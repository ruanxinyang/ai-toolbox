import { describe, expect, it } from "vitest"

import { DEFAULT_MODELS, MODELS, estimateCost, getModelInfo } from "./models"

describe("MODELS catalog", () => {
  it("has at least 4 distinct providers", () => {
    const providers = new Set(MODELS.map((m) => m.provider))
    expect(providers.size).toBeGreaterThanOrEqual(4)
    expect(providers).toContain("openai")
    expect(providers).toContain("anthropic")
    expect(providers).toContain("google")
    expect(providers).toContain("deepseek")
  })

  it("has all unique model ids", () => {
    const ids = MODELS.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("DEFAULT_MODELS references existing ids", () => {
    expect(getModelInfo(DEFAULT_MODELS.screenshotToCode)).toBeDefined()
    expect(getModelInfo(DEFAULT_MODELS.urlDigest)).toBeDefined()
    for (const id of DEFAULT_MODELS.modelCompareInitial) {
      expect(getModelInfo(id)).toBeDefined()
    }
  })

  it("vision-capable model is the screenshot default", () => {
    const info = getModelInfo(DEFAULT_MODELS.screenshotToCode)
    expect(info?.supportsVision).toBe(true)
  })
})

describe("estimateCost", () => {
  it("returns null for unknown model", () => {
    expect(estimateCost("unknown:foo", 100, 200)).toBeNull()
  })

  it("computes input cost + output cost correctly", () => {
    const model = MODELS.find((m) => m.id === "openai:gpt-4o")!
    const cost = estimateCost(model.id, 1_000_000, 0)
    expect(cost).toBeCloseTo(model.inputCostPer1M, 5)
  })

  it("computes mixed input + output", () => {
    // gpt-4o-mini: input 0.15, output 0.6 per 1M
    const cost = estimateCost("openai:gpt-4o-mini", 1_000_000, 1_000_000)
    expect(cost).toBeCloseTo(0.15 + 0.6, 5)
  })

  it("returns 0 for zero tokens", () => {
    expect(estimateCost("openai:gpt-4o", 0, 0)).toBe(0)
  })
})
