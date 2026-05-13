import type { Metadata } from "next"

import { BgRemoveClient } from "./bg-remove-client"

export const metadata: Metadata = {
  title: "图片去背景",
  description: "上传图片，Replicate 851-labs/background-remover 一键扣图，前后对比 + PNG 下载。",
}

export default function Page() {
  return <BgRemoveClient />
}
