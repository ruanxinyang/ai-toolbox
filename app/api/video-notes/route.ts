import { generateObject } from "ai"
import { z } from "zod"

import { ApiError, apiHandler } from "@/lib/api"
import { getModelInfo } from "@/lib/ai/models"
import { getModel } from "@/lib/ai/providers"
import { trackCall, trackUsage } from "@/lib/kv"

export const runtime = "nodejs"
export const maxDuration = 180 // Video processing can be slow.

// Gemini 2.5 Pro natively accepts video — no client-side ffmpeg.wasm bloat.
const DEFAULT_MODEL = "google:gemini-2.5-pro"

const inputSchema = z.object({
  video: z
    .string()
    .regex(/^data:video\/.+;base64,/, "video 必须是 data URL")
    .max(80_000_000, "视频超过 60MB 限制"),
  language: z.enum(["auto", "zh", "en"]).default("auto"),
  modelId: z.string().optional(),
})

const summarySchema = z.object({
  title: z.string().describe("视频主题，≤ 20 字"),
  tldr: z.string().describe("一句话概括，≤ 80 字"),
  chapters: z
    .array(
      z.object({
        timestamp: z.string().describe("章节起始时间，格式 mm:ss 或 hh:mm:ss"),
        title: z.string().describe("章节标题，≤ 30 字"),
        summary: z.string().describe("该章节内容，1-2 句"),
      }),
    )
    .min(2)
    .max(15)
    .describe("时间轴章节分段"),
  keyPoints: z.array(z.string()).min(3).max(8).describe("3-8 条关键要点"),
  actionItems: z
    .array(
      z.object({
        owner: z.string().describe("负责人，未指明则填 '未指派'"),
        task: z.string(),
        deadline: z.string().nullable(),
      }),
    )
    .describe("可执行的待办事项"),
})

export type VideoNotesResult = z.infer<typeof summarySchema>

export const POST = apiHandler(inputSchema, async ({ input, byok }) => {
  const modelId = input.modelId ?? DEFAULT_MODEL
  const info = getModelInfo(modelId)
  if (!info) throw new ApiError("INVALID_INPUT", 400, `未知模型 ${modelId}`)
  if (info.provider !== "google") {
    throw new ApiError(
      "INVALID_INPUT",
      400,
      "视频纪要目前只支持 Google Gemini（原生多模态支持视频）",
    )
  }

  const { model } = getModel(modelId, byok)
  void trackCall("video-notes")

  const langTarget =
    input.language === "auto" ? "原文语言" : input.language === "zh" ? "中文" : "English"

  const { object, usage } = await generateObject({
    model,
    schema: summarySchema,
    temperature: 0.3,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: input.video,
            mediaType: "video/mp4",
          },
          {
            type: "text",
            text: `根据这段视频内容生成结构化纪要。输出语言：${langTarget}。

要求：
- title：能立刻看出主题的标题
- tldr：一句话概括，给完全没看过视频的人
- chapters：按时间顺序分段，每段含 timestamp / title / summary（必须 2-15 段）
- keyPoints：3-8 条关键要点（每条 1-2 句）
- actionItems：可执行的 TODO（谁、做什么、何时）；owner 没说就"未指派"，deadline 没说就 null

时间戳格式：短视频用 mm:ss（如 03:42），超过 1 小时用 hh:mm:ss。`,
          },
        ],
      },
    ],
  })

  void trackUsage(modelId, usage.inputTokens, usage.outputTokens)
  return Response.json(object)
})
