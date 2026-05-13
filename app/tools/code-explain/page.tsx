import type { Metadata } from "next"

import { CodeExplainClient } from "./code-explain-client"

export const metadata: Metadata = {
  title: "代码解释器",
  description:
    "粘贴任意语言的代码片段，AI 流式输出 Markdown 解释，分块讲清楚做什么、为什么、怎么改。",
}

export default function Page() {
  return <CodeExplainClient />
}
