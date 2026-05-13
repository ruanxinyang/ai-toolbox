import type { Metadata } from "next"

import { ApiDebugClient } from "./api-debug-client"

export const metadata: Metadata = {
  title: "API 调试器",
  description:
    "浏览器内直接发 HTTP 请求并查看响应，一键 AI 生成 curl / fetch / Python / axios 代码片段。",
}

export default function Page() {
  return <ApiDebugClient />
}
