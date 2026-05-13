import type { Metadata } from "next"

import { FormGenClient } from "./form-gen-client"

export const metadata: Metadata = {
  title: "表单生成器",
  description:
    "用自然语言描述表单，AI 生成 React Hook Form + Zod schema 代码 + Sandpack 实时预览。",
}

export default function Page() {
  return <FormGenClient />
}
