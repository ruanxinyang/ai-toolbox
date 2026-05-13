import { describe, expect, it } from "vitest"

import { byokToHeaders, configuredProviders, readByokFromHeaders } from "./byok"

describe("byokToHeaders / readByokFromHeaders", () => {
  it("round-trips a populated keychain via Headers", () => {
    const byok = { openai: "sk-test-1", anthropic: "ant-test-2" }
    const headers = new Headers(byokToHeaders(byok))
    const parsed = readByokFromHeaders(headers)
    expect(parsed).toEqual(byok)
  })

  it("strips empty / whitespace-only values", () => {
    const headers = byokToHeaders({ openai: "  ", anthropic: "real-key" })
    expect(headers["x-byok-openai"]).toBeUndefined()
    expect(headers["x-byok-anthropic"]).toBe("real-key")
  })

  it("ignores unknown provider headers", () => {
    const h = new Headers({ "x-byok-imaginary": "foo", "x-byok-openai": "sk-1" })
    const parsed = readByokFromHeaders(h)
    expect(parsed).toEqual({ openai: "sk-1" })
    expect((parsed as Record<string, string>).imaginary).toBeUndefined()
  })
})

describe("configuredProviders", () => {
  it("returns only providers with non-empty trimmed keys", () => {
    expect(
      configuredProviders({ openai: "sk-1", anthropic: "  ", google: "g-1", deepseek: "" }),
    ).toEqual(["openai", "google"])
  })

  it("returns empty array for empty keychain", () => {
    expect(configuredProviders({})).toEqual([])
  })
})
