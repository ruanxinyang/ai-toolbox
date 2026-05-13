import { openai } from "@ai-sdk/openai"
import { experimental_transcribe as transcribe, generateObject } from "ai"
import { z } from "zod"

import { ApiError, apiHandler } from "@/lib/api"
import { resolveKey } from "@/lib/ai/providers"
import { getModel } from "@/lib/ai/providers"
import { trackCall, trackUsage } from "@/lib/kv"

export const runtime = "nodejs"
export const maxDuration = 120 // Audio transcription can be slow.

const SUMMARY_MODEL = "anthropic:claude-sonnet-4-6"

const schema = z.object({
  audio: z
    .string()
    .regex(/^data:audio\/.+;base64,/, "audio 必须是 data URL")
    .max(40_000_000, "音频超过 30MB 限制"),
  language: z.enum(["auto", "zh", "en"]).default("auto"),
  modelId: z.string().optional(),
})

const summarySchema = z.object({
  title: z.string().describe("会议主题，≤ 20 字"),
  tldr: z.string().describe("一句话概括，≤ 60 字"),
  bullets: z.array(z.string()).min(3).max(8).describe("3-8 条关键讨论要点"),
  decisions: z.array(z.string()).describe("达成的决定，可能为空数组"),
  actionItems: z
    .array(
      z.object({
        owner: z.string().describe("负责人，未指明则填 '未指派'"),
        task: z.string().describe("具体任务"),
        deadline: z.string().nullable().describe("截止时间，未提及则 null"),
      }),
    )
    .describe("可执行的待办事项"),
})

export type MeetingNotesResult = z.infer<typeof summarySchema> & {
  transcript: string
}

function base64Body(dataUrl: string): Buffer {
  const comma = dataUrl.indexOf(",")
  return Buffer.from(dataUrl.slice(comma + 1), "base64")
}

export const POST = apiHandler(schema, async ({ input, byok }) => {
  // Whisper requires an OpenAI key — either user's BYOK or our default.
  const { key } = resolveKey("openai", byok)
  if (!key) {
    throw new ApiError(
      "MISSING_API_KEY",
      400,
      "会议纪要工具需要 OpenAI Key（Whisper 转写）。请在 BYOK 设置中配置。",
      { provider: "openai" },
    )
  }

  void trackCall("meeting-notes")

  // Step 1: Whisper transcription.
  const audioBuffer = base64Body(input.audio)
  const transcription = await transcribe({
    model: openai.transcription("whisper-1"),
    audio: audioBuffer,
    providerOptions: {
      openai: {
        ...(input.language !== "auto" ? { language: input.language } : {}),
      },
    },
  })

  const transcript = transcription.text.trim()
  if (transcript.length < 50) {
    throw new ApiError("INVALID_INPUT", 400, "转写结果过短（< 50 字），可能是无声或语言识别失败")
  }

  // Step 2: LLM structured summary.
  const modelId = input.modelId ?? SUMMARY_MODEL
  const { model } = getModel(modelId, byok)

  const { object, usage } = await generateObject({
    model,
    schema: summarySchema,
    temperature: 0.3,
    prompt: `以下是会议转写文本（Whisper 自动生成，可能有少量误识别）。提炼出结构化的会议纪要。

要求：
- title: 一个能立刻看出主题的中文标题
- tldr: 一句话告诉一个完全没参加的人"这场会决定了什么"
- bullets: 按讨论顺序整理 3-8 条关键要点（每条 1-2 句）
- decisions: 明确达成的决定（用"我们决定…"的语气；没有就空数组）
- actionItems: 具体到"谁、做什么、何时之前"。owner 没说就填"未指派"，deadline 没说就 null

转写文本：
${transcript}`,
  })

  void trackUsage(modelId, usage.inputTokens, usage.outputTokens)

  const result: MeetingNotesResult = { ...object, transcript }
  return Response.json(result)
})
