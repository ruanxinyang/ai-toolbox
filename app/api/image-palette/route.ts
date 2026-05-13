import { generateObject } from "ai"
import { z } from "zod"

import { ApiError, apiHandler } from "@/lib/api"
import { getModelInfo } from "@/lib/ai/models"
import { getModel } from "@/lib/ai/providers"
import { trackCall, trackUsage } from "@/lib/kv"

export const runtime = "nodejs"
export const maxDuration = 60

const DEFAULT_MODEL = "google:gemini-2.5-pro"

const inputSchema = z.object({
  image: z
    .string()
    .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/, "image 必须是 data URL")
    .max(7_500_000, "图片超过 5MB 限制"),
  modelId: z.string().optional(),
})

const llmSchema = z.object({
  palette: z
    .array(
      z.object({
        hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "必须是 6 位十六进制颜色"),
        name: z.string().describe("简短可记的中文/英文色名，例如 '夜空蓝' / 'Cream'"),
        role: z
          .enum(["primary", "secondary", "accent", "neutral", "highlight"])
          .describe("这个颜色在画面里担任的角色"),
        ratio: z.number().min(0).max(100).describe("估算占比 0-100，全 6 个加起来约等于 100"),
      }),
    )
    .length(6)
    .describe("按显著度降序的 6 个主色"),
  fonts: z
    .array(
      z.object({
        family: z.string().describe("Google Fonts 上能找到的字体名，例如 'Inter'"),
        category: z.enum(["serif", "sans-serif", "display", "monospace", "handwriting"]),
        vibe: z.string().describe("一句话说为什么这个字体配这张图"),
      }),
    )
    .min(2)
    .max(4),
  mood: z.string().describe("一句话（≤ 40 字）描述这张图的整体调性 / vibe / 适合的场景"),
})

export type ImagePaletteResult = z.infer<typeof llmSchema>

export const POST = apiHandler(inputSchema, async ({ input, byok }) => {
  const modelId = input.modelId ?? DEFAULT_MODEL
  const info = getModelInfo(modelId)
  if (!info) throw new ApiError("INVALID_INPUT", 400, `未知模型 ${modelId}`)
  if (!info.supportsVision) {
    throw new ApiError("INVALID_INPUT", 400, `${info.name} 不支持图像输入，请选择视觉模型`)
  }

  const { model } = getModel(modelId, byok)
  void trackCall("image-palette")

  const { object, usage } = await generateObject({
    model,
    schema: llmSchema,
    temperature: 0.4,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", image: input.image },
          {
            type: "text",
            text: `请你像一位资深品牌设计师那样分析这张图：
1. 抽 6 个最具代表性的主色（hex 6 位大写），按视觉显著度降序
2. 给每个颜色一个易记的名字（中文优先；如果原图明显是英文/西方风格，可以用英文）
3. 给每色一个角色（primary / secondary / accent / neutral / highlight）
4. 估算它在画面里的视觉占比（0-100，6 个加起来 ~100）
5. 推荐 3 个 Google Fonts 上能找到的字体（搭配这种 vibe）
6. 一句话总结 mood / vibe（≤ 40 字）

不要废话，只按 schema 返回。`,
          },
        ],
      },
    ],
  })

  void trackUsage(modelId, usage.inputTokens, usage.outputTokens)
  return Response.json(object)
})
