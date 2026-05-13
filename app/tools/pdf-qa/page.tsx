import type { Metadata } from "next"

import { PdfQaClient } from "./pdf-qa-client"

export const metadata: Metadata = {
  title: "PDF 问答",
  description: "上传 PDF 文档，AI 流式回答任何关于内容的问题，引用原文位置，支持中英文文档。",
}

export default function Page() {
  return <PdfQaClient />
}
