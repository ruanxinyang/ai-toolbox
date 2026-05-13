import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { rateLimit } from "./rate-limit"

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("allows requests up to the limit", () => {
    const limiter = rateLimit({ limit: 3, windowMs: 60_000 })
    expect(limiter("a").ok).toBe(true)
    expect(limiter("a").ok).toBe(true)
    expect(limiter("a").ok).toBe(true)
    expect(limiter("a").ok).toBe(false)
  })

  it("decrements remaining count correctly", () => {
    const limiter = rateLimit({ limit: 5, windowMs: 60_000 })
    expect(limiter("a").remaining).toBe(4)
    expect(limiter("a").remaining).toBe(3)
    expect(limiter("a").remaining).toBe(2)
  })

  it("isolates buckets per key", () => {
    const limiter = rateLimit({ limit: 1, windowMs: 60_000 })
    expect(limiter("a").ok).toBe(true)
    expect(limiter("a").ok).toBe(false)
    expect(limiter("b").ok).toBe(true) // different key, fresh bucket
  })

  it("resets after window elapses", () => {
    const limiter = rateLimit({ limit: 2, windowMs: 1000 })
    expect(limiter("a").ok).toBe(true)
    expect(limiter("a").ok).toBe(true)
    expect(limiter("a").ok).toBe(false)
    vi.advanceTimersByTime(1001)
    expect(limiter("a").ok).toBe(true)
  })

  it("returns resetAt timestamp for blocked requests", () => {
    const limiter = rateLimit({ limit: 1, windowMs: 60_000 })
    limiter("a")
    const result = limiter("a")
    expect(result.ok).toBe(false)
    expect(result.resetAt).toBeGreaterThan(Date.now())
    expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 60_000)
  })
})
