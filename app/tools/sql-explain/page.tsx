import type { Metadata } from "next"

import { SqlExplainClient } from "./sql-explain-client"

export const metadata: Metadata = {
  title: "SQL 解释器",
  description: "粘 SQL 语句，AI 用自然语言解释每个子句 + 标出性能 / 正确性问题。支持 6 种方言。",
}

export default function Page() {
  return <SqlExplainClient />
}
