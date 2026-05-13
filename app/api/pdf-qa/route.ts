import { streamText } from "ai"
import { z } from "zod"

import { ApiError, apiHandler } from "@/lib/api"
import { getModelInfo } from "@/lib/ai/models"
import { getModel } from "@/lib/ai/providers"
import { trackCall, trackUsage } from "@/lib/kv"

export const runtime = "nodejs"
export const maxDuration = 60

// PDF Q&A defaults to Gemini 2.5 Pro for its native PDF support + huge context.
const DEFAULT_MODEL = "google:gemini-2.5-pro"

const SYSTEM_PROMPT = `你是一个研究助手。用户上传了一份 PDF 文档并提出问题。

回答规则：
- 直接基于 PDF 内容回答，不要编造原文里没说的事
- 引用相关段落时用 \`引用：…\` 短引用 + 简单的位置（"第 X 页 / 第 X 节"，能定位就行）
- 找不到对应内容时直说"PDF 中没找到相关内容"，不要硬答
- 用 Markdown 格式输出，结构清晰
- 全程中文，技术名词保留英文`

const schema = z.object({
  pdf: z
    .string()
    .regex(/^data:application\/pdf;base64,/, "pdf 必须是 data URL")
    .max(20_000_000, "PDF 超过 15MB 限制"),
  question: z.string().min(1).max(2000),
  modelId: z.string().optional(),
})

export const POST = apiHandler(schema, async ({ input, byok }) => {
  const modelId = input.modelId ?? DEFAULT_MODEL
  const info = getModelInfo(modelId)
  if (!info) throw new ApiError("INVALID_INPUT", 400, `未知模型 ${modelId}`)
  // PDF is treated as "file" content — only models with strong document support
  // make sense here. Gemini family handles PDF natively; Claude/GPT can too.
  // We don't hard-restrict — let the user pick, fail at provider level if not.

  const { model } = getModel(modelId, byok)

  void trackCall("pdf-qa")

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: input.pdf,
            mediaType: "application/pdf",
          },
          { type: "text", text: input.question },
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
