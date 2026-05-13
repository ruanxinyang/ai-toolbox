import type { Metadata } from "next"

import { RegexTesterClient } from "./regex-tester-client"

export const metadata: Metadata = {
  title: "正则速练",
  description: "粘正则 + 样本文本，实时高亮所有 match、显示捕获组、即时反馈无效语法。还有替换模式。",
}

export default function Page() {
  return <RegexTesterClient />
}
