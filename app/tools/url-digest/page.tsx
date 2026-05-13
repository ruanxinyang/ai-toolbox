import type { Metadata } from "next"

import { UrlDigestClient } from "./url-digest-client"

export const metadata: Metadata = {
  title: "URL 速读",
  description: "粘贴文章链接，AI 抽取要点 + 生成 Mermaid 思维导图，24 小时缓存复用结果。",
}

export default function Page() {
  return <UrlDigestClient />
}
