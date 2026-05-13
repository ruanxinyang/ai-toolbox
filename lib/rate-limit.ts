import type { NextRequest } from "next/server"

type Bucket = { count: number; resetAt: number }

/**
 * In-memory fixed-window rate limiter.
 *
 * NOTE: state lives in the function instance memory. Vercel may have many
 * concurrent instances, so a user could exceed the limit `instances × limit`
 * times before getting blocked. Good enough for soft "be polite" throttling;
 * for real abuse protection, back this with KV/Redis.
 */
export type RateLimitOptions = {
  /** Max requests per window. */
  limit: number
  /** Window length in milliseconds. */
  windowMs: number
}

export type RateLimitResult = {
  ok: boolean
  remaining: number
  resetAt: number
}

const SWEEP_INTERVAL = 5 * 60_000

export function rateLimit({ limit, windowMs }: RateLimitOptions) {
  // Each limiter owns its own bucket Map. Independent rules (e.g. `limiters.ai`
  // vs `limiters.read`) don't share state — and tests get a fresh state per
  // limiter instance.
  const buckets = new Map<string, Bucket>()
  let lastSweep = 0

  return (key: string): RateLimitResult => {
    const now = Date.now()
    if (now - lastSweep >= SWEEP_INTERVAL) {
      lastSweep = now
      for (const [k, b] of buckets) {
        if (b.resetAt < now) buckets.delete(k)
      }
    }
    const bucket = buckets.get(key)
    if (!bucket || bucket.resetAt < now) {
      const resetAt = now + windowMs
      buckets.set(key, { count: 1, resetAt })
      return { ok: true, remaining: limit - 1, resetAt }
    }
    if (bucket.count >= limit) {
      return { ok: false, remaining: 0, resetAt: bucket.resetAt }
    }
    bucket.count += 1
    return { ok: true, remaining: limit - bucket.count, resetAt: bucket.resetAt }
  }
}

/** Extract a stable per-client key from a NextRequest, IP-based with fallback. */
export function getClientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  const real = req.headers.get("x-real-ip")?.trim()
  if (real) return real
  return "unknown"
}

/** Pre-baked limiters for common patterns. */
export const limiters = {
  /** 10 AI calls / minute per IP — generous for casual use, blocks scraping. */
  ai: rateLimit({ limit: 10, windowMs: 60_000 }),
  /** 30 read-only calls / minute per IP — for /api/stats and similar. */
  read: rateLimit({ limit: 30, windowMs: 60_000 }),
}
