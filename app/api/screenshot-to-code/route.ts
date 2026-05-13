import { streamText } from "ai"
import { z } from "zod"

import { ApiError, apiHandler } from "@/lib/api"
import { DEFAULT_MODELS, getModelInfo } from "@/lib/ai/models"
import { getModel } from "@/lib/ai/providers"
import { trackCall, trackUsage } from "@/lib/kv"

export const runtime = "nodejs"
export const maxDuration = 60

const SYSTEM_PROMPT = `你是一个专业的前端工程师。我会给你一张 UI 截图，请你生成对应的 React 组件代码。

约束：
1. 单文件、纯函数组件，使用 TypeScript
2. 仅使用 Tailwind CSS，不引入其他样式库
3. 不引入除 React 之外的任何外部依赖
4. 默认导出（export default）一个名为 App 的组件
5. 如果有图片占位，使用 https://placehold.co/600x400 这类占位图
6. 如果有图标，使用 emoji 替代（不引入图标库）
7. 代码必须可以直接在 Sandpack 中运行
8. 输出格式：直接输出代码，不要解释，不要 markdown 代码块标记（不要 \`\`\`tsx 这种）`

const schema = z.object({
  image: z
    .string()
    .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/, "image 必须是 data URL")
    .max(7_500_000, "图片超过 5MB 限制"),
  note: z.string().max(500).optional(),
  modelId: z.string().optional(),
})

export const POST = apiHandler(schema, async ({ input, byok }) => {
  const modelId = input.modelId ?? DEFAULT_MODELS.screenshotToCode
  const info = getModelInfo(modelId)
  if (!info) {
    throw new ApiError("INVALID_INPUT", 400, `未知的模型 ${modelId}`)
  }
  if (!info.supportsVision) {
    throw new ApiError("INVALID_INPUT", 400, `${info.name} 不支持图像输入，请选择视觉模型`)
  }

  const { model } = getModel(modelId, byok)

  // Best-effort metrics; fire-and-forget so they never block the stream.
  void trackCall("screenshot-to-code")

  const userText = input.note?.trim().length ? `附加说明：${input.note}` : "请生成对应的 React 组件"

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", image: input.image },
          { type: "text", text: userText },
        ],
      },
    ],
    temperature: 0.2,
    onFinish: ({ usage }) => {
      void trackUsage(modelId, usage.inputTokens, usage.outputTokens)
    },
  })

  return result.toTextStreamResponse()
})
