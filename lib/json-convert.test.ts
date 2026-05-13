import { describe, expect, it } from "vitest"

import { convert, inferShape, prettifyJson, toTypeScript, toYaml, toZod } from "./json-convert"

describe("inferShape", () => {
  it("identifies primitives", () => {
    expect(inferShape("hi").kind).toBe("string")
    expect(inferShape(1).kind).toBe("number")
    expect(inferShape(true).kind).toBe("boolean")
    expect(inferShape(null).kind).toBe("null")
  })

  it("infers empty array as any-element", () => {
    const shape = inferShape([])
    expect(shape.kind).toBe("array")
    if (shape.kind === "array") expect(shape.element.kind).toBe("any")
  })

  it("unions heterogeneous arrays", () => {
    const shape = inferShape([1, "two", 3])
    expect(shape.kind).toBe("array")
    if (shape.kind === "array") {
      expect(shape.element.kind).toBe("union")
      if (shape.element.kind === "union") {
        const kinds = shape.element.shapes.map((s) => s.kind).sort()
        expect(kinds).toEqual(["number", "string"])
      }
    }
  })

  it("samples only the first 50 items", () => {
    const arr = Array.from({ length: 200 }, (_, i) => (i < 50 ? "s" : 1))
    const shape = inferShape(arr)
    // All sampled items are strings, so element should be a single string shape
    if (shape.kind === "array") {
      expect(shape.element.kind).toBe("string")
    }
  })
})

describe("toTypeScript", () => {
  it("renders an interface for a flat object", () => {
    const out = toTypeScript({ id: 1, name: "Ada" }, "User")
    expect(out).toBe("export interface User {\n  id: number\n  name: string\n}")
  })

  it("quotes non-identifier keys", () => {
    const out = toTypeScript({ "user-name": "x", "0invalid": 1 }, "Weird")
    expect(out).toContain('"user-name": string')
    expect(out).toContain('"0invalid": number')
  })

  it("emits a type alias for non-object roots", () => {
    expect(toTypeScript([1, 2, 3], "Nums")).toBe("export type Nums = number[]")
    expect(toTypeScript("ok", "S")).toBe("export type S = string")
  })

  it("uses Record<string, unknown> for empty objects", () => {
    expect(toTypeScript({}, "Empty")).toBe("export type Empty = Record<string, unknown>")
  })

  it("wraps union element types in parens for arrays", () => {
    const out = toTypeScript([1, "x"], "Items")
    expect(out).toMatch(/\(number \| string\)\[\]|\(string \| number\)\[\]/)
  })
})

describe("toZod", () => {
  it("emits z.object for a flat object", () => {
    const out = toZod({ id: 1, name: "Ada" }, "User")
    expect(out).toContain("export const User = z.object({")
    expect(out).toContain("id: z.number()")
    expect(out).toContain("name: z.string()")
    expect(out).toContain("export type UserType = z.infer<typeof User>")
  })

  it("uses z.record for empty objects", () => {
    const out = toZod({}, "Empty")
    expect(out).toContain("z.record(z.string(), z.unknown())")
  })

  it("emits z.union for heterogeneous arrays", () => {
    const out = toZod([1, "x"], "Items")
    expect(out).toContain("z.union(")
  })
})

describe("toYaml", () => {
  it("renders nested objects with indentation", () => {
    const out = toYaml({ user: { name: "Ada", age: 30 } })
    expect(out).toBe("user:\n  name: Ada\n  age: 30")
  })

  it("renders arrays of scalars", () => {
    expect(toYaml([1, 2, 3])).toBe("- 1\n- 2\n- 3")
  })

  it("renders arrays of objects", () => {
    const out = toYaml([{ a: 1 }, { a: 2 }])
    expect(out).toBe("- a: 1\n- a: 2")
  })

  it("quotes strings that look like booleans", () => {
    expect(toYaml({ x: "true" })).toBe('x: "true"')
    expect(toYaml({ x: "no" })).toBe('x: "no"')
  })

  it("emits empty containers as [] and {}", () => {
    expect(toYaml({ a: [], b: {} })).toBe("a: []\nb: {}")
  })

  it("handles null and bool", () => {
    expect(toYaml({ a: null, b: true, c: false })).toBe("a: null\nb: true\nc: false")
  })

  it("quotes keys with non-word chars", () => {
    expect(toYaml({ "user-id": 1 })).toBe('"user-id": 1')
  })
})

describe("prettifyJson", () => {
  it("formats with 2-space indent", () => {
    expect(prettifyJson({ a: 1, b: [2] })).toBe('{\n  "a": 1,\n  "b": [\n    2\n  ]\n}')
  })
})

describe("convert (dispatch)", () => {
  it("routes to the requested target", () => {
    const v = { id: 1 }
    expect(convert(v, "typescript", "T")).toContain("export interface T")
    expect(convert(v, "zod", "T")).toContain("z.object({")
    expect(convert(v, "yaml", "T")).toBe("id: 1")
    expect(convert(v, "json5", "T")).toContain('"id": 1')
  })
})
