import type { Metadata } from "next"

import { MermaidGenClient } from "./mermaid-gen-client"

export const metadata: Metadata = {
  title: "Mermaid 自动生成",
  description:
    "用自然语言描述图，AI 生成可渲染的 Mermaid 源码（流程图 / 时序图 / 状态图 / ER 图等 8 种类型）。",
}

export default function Page() {
  return <MermaidGenClient />
}
