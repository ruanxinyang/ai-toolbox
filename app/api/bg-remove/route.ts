import { z } from "zod"

import { ApiError, apiHandler } from "@/lib/api"
import { MissingReplicateKeyError, resolveReplicateKey } from "@/lib/ai/image-providers"
import { trackCall } from "@/lib/kv"

export const runtime = "nodejs"
export const maxDuration = 60

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

const inputSchema = z.object({
  image: z
    .string()
    .startsWith("data:image/")
    .max(Math.ceil(MAX_IMAGE_BYTES * 1.4)), // base64 inflates ~4/3
})

type ReplicatePrediction = {
  id: string
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled"
  output: unknown
  error: unknown
  urls?: { get?: string }
}

async function poll(url: string, key: string, attempts = 30, intervalMs = 1500): Promise<ReplicatePrediction> {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    })
    if (!res.ok) {
      throw new ApiError("UPSTREAM_ERROR", 502, `Replicate poll HTTP ${res.status}`)
    }
    const data = (await res.json()) as ReplicatePrediction
    if (data.status === "succeeded" || data.status === "failed" || data.status === "canceled") {
      return data
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new ApiError("UPSTREAM_ERROR", 504, "Replicate prediction timed out")
}

function extractOutputUrl(output: unknown): string {
  if (typeof output === "string") return output
  if (Array.isArray(output) && typeof output[0] === "string") return output[0]
  throw new ApiError("UPSTREAM_ERROR", 502, "Unexpected Replicate output shape")
}

export const POST = apiHandler(inputSchema, async ({ input, req }) => {
  let key: string
  try {
    key = resolveReplicateKey(req.headers)
  } catch (err) {
    if (err instanceof MissingReplicateKeyError) {
      throw new ApiError("MISSING_API_KEY", 400, err.message, { provider: err.provider })
    }
    throw err
  }

  void trackCall("bg-remove")

  const start = await fetch(
    "https://api.replicate.com/v1/models/851-labs/background-remover/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "wait=30",
      },
      body: JSON.stringify({
        input: { image: input.image, format: "png" },
      }),
    },
  )

  if (!start.ok) {
    const body = await start.text()
    throw new ApiError(
      "UPSTREAM_ERROR",
      start.status === 401 || start.status === 403 ? 400 : 502,
      `Replicate ${start.status}: ${body.slice(0, 200)}`,
    )
  }

  let prediction = (await start.json()) as ReplicatePrediction

  if (
    prediction.status !== "succeeded" &&
    prediction.status !== "failed" &&
    prediction.status !== "canceled"
  ) {
    const pollUrl = prediction.urls?.get
    if (!pollUrl) {
      throw new ApiError("UPSTREAM_ERROR", 502, "Replicate did not return a polling URL")
    }
    prediction = await poll(pollUrl, key)
  }

  if (prediction.status !== "succeeded") {
    throw new ApiError(
      "UPSTREAM_ERROR",
      502,
      typeof prediction.error === "string"
        ? prediction.error
        : `Replicate prediction ${prediction.status}`,
    )
  }

  const outputUrl = extractOutputUrl(prediction.output)
  return Response.json({ url: outputUrl })
})
