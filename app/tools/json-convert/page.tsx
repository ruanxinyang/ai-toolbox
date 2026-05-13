import type { Metadata } from "next"

import { JsonConvertClient } from "./json-convert-client"

export const metadata: Metadata = {
  title: "JSON 转换",
  description: "粘 JSON，一键生成 TypeScript 类型 / Zod schema / YAML / 格式化 JSON。零后端、零延迟。",
}

export default function Page() {
  return <JsonConvertClient />
}
