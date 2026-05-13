/**
 * Pure JSON → TS / Zod / YAML / pretty-JSON converters.
 *
 * Type inference is structural: object shapes are recorded by their property
 * set, arrays union the element types from the first 50 items (sampled to
 * stay bounded), primitives map directly. Nulls collapse with their sibling
 * type into `T | null` instead of `null`.
 */

type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json }

type Shape =
  | { kind: "string" }
  | { kind: "number" }
  | { kind: "boolean" }
  | { kind: "null" }
  | { kind: "any" }
  | { kind: "array"; element: Shape }
  | { kind: "object"; entries: Array<{ key: string; shape: Shape }> }
  | { kind: "union"; shapes: Shape[] }

const ARRAY_SAMPLE = 50

export function inferShape(value: Json): Shape {
  if (value === null) return { kind: "null" }
  if (typeof value === "string") return { kind: "string" }
  if (typeof value === "number") return { kind: "number" }
  if (typeof value === "boolean") return { kind: "boolean" }
  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: "array", element: { kind: "any" } }
    const sampled = value.slice(0, ARRAY_SAMPLE)
    const shapes = sampled.map(inferShape)
    return { kind: "array", element: unionShapes(shapes) }
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).map(([key, val]) => ({ key, shape: inferShape(val) }))
    return { kind: "object", entries }
  }
  return { kind: "any" }
}

function shapeKey(s: Shape): string {
  switch (s.kind) {
    case "string":
    case "number":
    case "boolean":
    case "null":
    case "any":
      return s.kind
    case "array":
      return `array<${shapeKey(s.element)}>`
    case "object":
      return `obj{${s.entries.map((e) => `${e.key}:${shapeKey(e.shape)}`).join(",")}}`
    case "union":
      return `union<${s.shapes.map(shapeKey).sort().join("|")}>`
  }
}

function unionShapes(shapes: Shape[]): Shape {
  const seen = new Map<string, Shape>()
  for (const s of shapes) {
    const flat = s.kind === "union" ? s.shapes : [s]
    for (const inner of flat) {
      seen.set(shapeKey(inner), inner)
    }
  }
  const unique = Array.from(seen.values())
  if (unique.length === 1) return unique[0]
  return { kind: "union", shapes: unique }
}

function isSafeIdentifier(key: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
}

function tsType(s: Shape): string {
  switch (s.kind) {
    case "string":
      return "string"
    case "number":
      return "number"
    case "boolean":
      return "boolean"
    case "null":
      return "null"
    case "any":
      return "unknown"
    case "array":
      return `${withParens(s.element)}[]`
    case "object": {
      if (s.entries.length === 0) return "Record<string, unknown>"
      const lines = s.entries.map(({ key, shape }) => {
        const propKey = isSafeIdentifier(key) ? key : JSON.stringify(key)
        return `  ${propKey}: ${tsType(shape)}`
      })
      return `{\n${lines.join("\n")}\n}`
    }
    case "union":
      return s.shapes.map(withParens).join(" | ")
  }
}

function withParens(s: Shape): string {
  if (s.kind === "union" || s.kind === "object") return `(${tsType(s)})`
  return tsType(s)
}

export function toTypeScript(value: Json, rootName: string): string {
  const shape = inferShape(value)
  if (shape.kind === "object") {
    const lines = shape.entries.map(({ key, shape: sh }) => {
      const propKey = isSafeIdentifier(key) ? key : JSON.stringify(key)
      return `  ${propKey}: ${tsType(sh)}`
    })
    if (lines.length === 0) {
      return `export type ${rootName} = Record<string, unknown>`
    }
    return `export interface ${rootName} {\n${lines.join("\n")}\n}`
  }
  return `export type ${rootName} = ${tsType(shape)}`
}

function zod(s: Shape, indent = 0): string {
  const pad = "  ".repeat(indent)
  const innerPad = "  ".repeat(indent + 1)
  switch (s.kind) {
    case "string":
      return "z.string()"
    case "number":
      return "z.number()"
    case "boolean":
      return "z.boolean()"
    case "null":
      return "z.null()"
    case "any":
      return "z.unknown()"
    case "array":
      return `z.array(${zod(s.element, indent)})`
    case "object": {
      if (s.entries.length === 0) return "z.record(z.string(), z.unknown())"
      const lines = s.entries.map(({ key, shape }) => {
        const propKey = isSafeIdentifier(key) ? key : JSON.stringify(key)
        return `${innerPad}${propKey}: ${zod(shape, indent + 1)},`
      })
      return `z.object({\n${lines.join("\n")}\n${pad}})`
    }
    case "union":
      return `z.union([${s.shapes.map((x) => zod(x, indent)).join(", ")}])`
  }
}

export function toZod(value: Json, rootName: string): string {
  const shape = inferShape(value)
  return `import { z } from "zod"

export const ${rootName} = ${zod(shape)}

export type ${capitalize(rootName)}Type = z.infer<typeof ${rootName}>
`
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function yamlScalar(value: string | number | boolean | null): string {
  if (value === null) return "null"
  if (typeof value === "boolean") return value ? "true" : "false"
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null"
  if (/^[A-Za-z][\w\-./ ]*$/.test(value) && !/^(true|false|null|yes|no)$/i.test(value)) {
    return value
  }
  return JSON.stringify(value)
}

function yaml(value: Json, indent = 0): string {
  const pad = "  ".repeat(indent)
  if (value === null || typeof value !== "object") return yamlScalar(value as never)
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]"
    return value
      .map((item) => {
        if (item !== null && typeof item === "object") {
          const inner = yaml(item, indent + 1)
          const [firstLine, ...rest] = inner.split("\n")
          return `${pad}- ${firstLine.trimStart()}${rest.length ? "\n" + rest.join("\n") : ""}`
        }
        return `${pad}- ${yamlScalar(item as never)}`
      })
      .join("\n")
  }
  const entries = Object.entries(value)
  if (entries.length === 0) return "{}"
  return entries
    .map(([key, val]) => {
      const safeKey = /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : JSON.stringify(key)
      if (val !== null && typeof val === "object" && (Array.isArray(val) ? val.length > 0 : Object.keys(val).length > 0)) {
        const inner = yaml(val, indent + 1)
        return `${pad}${safeKey}:\n${inner}`
      }
      return `${pad}${safeKey}: ${yaml(val, indent + 1)}`
    })
    .join("\n")
}

export function toYaml(value: Json): string {
  return yaml(value, 0)
}

export function prettifyJson(value: Json): string {
  return JSON.stringify(value, null, 2)
}

export type ConvertTarget = "typescript" | "zod" | "yaml" | "json5"

export function convert(value: Json, target: ConvertTarget, rootName: string): string {
  switch (target) {
    case "typescript":
      return toTypeScript(value, rootName)
    case "zod":
      return toZod(value, rootName)
    case "yaml":
      return toYaml(value)
    case "json5":
      return prettifyJson(value)
  }
}
