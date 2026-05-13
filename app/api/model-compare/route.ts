import { streamText } from "ai"
import { z } from "zod"

import { ApiError, apiHandler } from "@/lib/api"
import { getModelInfo } from "@/lib/ai/models"
import { getModel } from "@/lib/ai/providers"
import { trackCall, trackUsage } from "@/lib/kv"

export const runtime = "nodejs"
export const maxDuration = 60

const inputSchema = z.object({
  prompt: z.string().min(1).max(10_000),
  system: z.string().max(2000).optional(),
  modelId: z.string(),
  temperature: z.number().min(0).max(2).optional(),
})

/**
 * Stream protocol (custom, simple):
 *   <text chunks>
 *   <JSON meta>
 *
 * `` (SOH) never appears in normal LLM output, so the client can
 * split the body once at the first `` to separate text from meta.
 */
const META_SEPARATOR = ""

export const POST = apiHandler(inputSchema, async ({ input, byok }) => {
  const info = getModelInfo(input.modelId)
  if (!info) throw new ApiError("INVALID_INPUT", 400, `未知模型 ${input.modelId}`)

  const { model } = getModel(input.modelId, byok)

  void trackCall("model-compare")

  const result = streamText({
    model,
    system: input.system,
    prompt: input.prompt,
    temperature: input.temperature,
  })

  const encoder = new TextEncoder()
  const start = Date.now()
  let firstTokenAt: number | null = null

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of result.textStream) {
          if (firstTokenAt === null) firstTokenAt = Date.now()
          controller.enqueue(encoder.encode(delta))
        }
        const usage = await result.usage
        const meta = {
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          totalTokens: usage.totalTokens ?? 0,
          elapsedMs: Date.now() - start,
          firstTokenMs: firstTokenAt ? firstTokenAt - start : null,
        }
        controller.enqueue(encoder.encode(META_SEPARATOR + JSON.stringify(meta)))
        controller.close()
        void trackUsage(input.modelId, meta.inputTokens, meta.outputTokens)
      } catch (err) {
        // Emit error as a meta record so the client can show it per-column.
        const meta = {
          error: (err as Error).message || "stream failed",
          elapsedMs: Date.now() - start,
        }
        controller.enqueue(encoder.encode(META_SEPARATOR + JSON.stringify(meta)))
        controller.close()
      }
    },
    cancel() {
      // Stream aborted by client; AI SDK handles upstream cancellation via finalizer.
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Model-Id": input.modelId,
    },
  })
})
