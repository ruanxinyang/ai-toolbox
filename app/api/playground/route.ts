import { streamText } from "ai"
import { z } from "zod"

import { ApiError, apiHandler } from "@/lib/api"
import { getModelInfo } from "@/lib/ai/models"
import { getModel } from "@/lib/ai/providers"
import { trackCall, trackUsage } from "@/lib/kv"

export const runtime = "nodejs"
export const maxDuration = 60

const inputSchema = z.object({
  prompt: z.string().min(1).max(20_000),
  system: z.string().max(4000).optional(),
  modelId: z.string(),
  temperature: z.number().min(0).max(2).optional(),
})

export const POST = apiHandler(inputSchema, async ({ input, byok }) => {
  const info = getModelInfo(input.modelId)
  if (!info) throw new ApiError("INVALID_INPUT", 400, `未知模型 ${input.modelId}`)

  const { model } = getModel(input.modelId, byok)
  void trackCall("playground")

  const result = streamText({
    model,
    system: input.system,
    prompt: input.prompt,
    temperature: input.temperature,
    onFinish: ({ usage }) => {
      void trackUsage(input.modelId, usage.inputTokens, usage.outputTokens)
    },
  })

  return result.toTextStreamResponse()
})
