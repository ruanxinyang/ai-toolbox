/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest"

import { decodeShare, encodeShare } from "./share"

describe("encodeShare / decodeShare", () => {
  it("round-trips ASCII text", () => {
    const text = "function hello() { return 'world' }"
    expect(decodeShare(encodeShare(text))).toBe(text)
  })

  it("round-trips multi-byte UTF-8 (Chinese, emoji)", () => {
    const text = "你好 世界 🎉 \n// 中文注释\nconst x = '✓'"
    expect(decodeShare(encodeShare(text))).toBe(text)
  })

  it("handles empty string", () => {
    expect(decodeShare(encodeShare(""))).toBe("")
  })

  it("strips trailing = padding in output", () => {
    const encoded = encodeShare("a") // 1 byte → "YQ==" normally
    expect(encoded).not.toMatch(/=$/)
  })

  it("handles large code blocks (10KB+)", () => {
    const text = "x".repeat(10_000)
    expect(decodeShare(encodeShare(text)).length).toBe(10_000)
  })
})
