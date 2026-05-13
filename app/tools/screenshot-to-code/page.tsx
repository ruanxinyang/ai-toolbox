import type { Metadata } from "next"

import { ScreenshotToCodeClient } from "./screenshot-to-code-client"

export const metadata: Metadata = {
  title: "截图转代码",
  description: "上传 UI 截图，AI 流式生成可直接运行的 React + Tailwind 组件，Sandpack 实时预览。",
}

export default function Page() {
  return <ScreenshotToCodeClient />
}
