import { NextResponse, type NextRequest } from "next/server"
import type { ZodType } from "zod"

import { readByokFromHeaders } from "@/lib/ai/byok"
import { MissingApiKeyError, type Keychain } from "@/lib/ai/providers"
import { getClientKey, limiters, type RateLimitResult } from "@/lib/rate-limit"

/**
 * Standard error envelope:
 *   { error: { code: string, message: string } }
 *
 * Codes are stable strings — never localize them on the wire; localize only
 * the `message` (which the UI can also replace with its own copy).
 */
export type ApiErrorCode =
  | "INVALID_INPUT"
  | "MISSING_API_KEY"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "INTERNAL"

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly status: number,
    message: string,
    readonly extra?: Record<string, unknown>,
  ) {
    super(message)
  }
}

export function errorResponse(
  code: ApiErrorCode,
  status: number,
  message: string,
  extra?: Record<string, unknown>,
  headers?: HeadersInit,
) {
  return NextResponse.json({ error: { code, message, ...extra } }, { status, headers })
}

export type ApiContext<T> = {
  input: T
  req: NextRequest
  byok: Keychain
  clientKey: string
}

export type Handler<T> = (ctx: ApiContext<T>) => Promise<Response> | Response

type Limiter = (typeof limiters)[keyof typeof limiters]

export type ApiHandlerOptions = {
  /** Apply a rate limiter (default: `limiters.ai`). Pass `false` to skip. */
  rateLimit?: Limiter | false
}

/**
 * Wraps a Next.js route handler with:
 *   1. Zod-validated JSON body parsing
 *   2. BYOK header extraction (x-byok-<provider>)
 *   3. Optional rate limiting (default: AI limiter)
 *   4. Unified error envelope
 *
 * The handler returns a `Response` directly — typically `streamText().toUIMessageStreamResponse()`
 * for streaming endpoints, or `NextResponse.json(...)` for JSON.
 */
export function apiHandler<T>(
  schema: ZodType<T>,
  handler: Handler<T>,
  options: ApiHandlerOptions = {},
) {
  const limiter = options.rateLimit === false ? null : (options.rateLimit ?? limiters.ai)

  return async (req: NextRequest): Promise<Response> => {
    try {
      const clientKey = getClientKey(req)

      if (limiter) {
        const result: RateLimitResult = limiter(clientKey)
        if (!result.ok) {
          const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
          return errorResponse(
            "RATE_LIMITED",
            429,
            `请求过于频繁，请 ${retryAfter}s 后再试`,
            { retryAfter, resetAt: result.resetAt },
            { "Retry-After": String(retryAfter) },
          )
        }
      }

      const raw = await req.json().catch(() => null)
      const parsed = schema.safeParse(raw)
      if (!parsed.success) {
        return errorResponse("INVALID_INPUT", 400, "请求参数不合法", {
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        })
      }

      const byok = readByokFromHeaders(req.headers)

      return await handler({ input: parsed.data, req, byok, clientKey })
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResponse(err.code, err.status, err.message, err.extra)
      }
      if (err instanceof MissingApiKeyError) {
        return errorResponse("MISSING_API_KEY", 400, err.message, { provider: err.provider })
      }
      console.error("[api] unexpected error:", err)
      return errorResponse("INTERNAL", 500, "服务器内部错误")
    }
  }
}
