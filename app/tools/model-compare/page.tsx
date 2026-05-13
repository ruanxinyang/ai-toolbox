import type { Metadata } from "next"

import { ModelCompareClient } from "./model-compare-client"

export const metadata: Metadata = {
  title: "多模型对比",
  description: "一个 prompt，4 个模型并发流式对比响应速度、tokens 与成本。",
}

export default function Page() {
  return <ModelCompareClient />
}
