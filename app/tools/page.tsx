import type { Metadata } from "next"

import { ToolsGrid } from "@/components/sections/ToolsGrid"

export const metadata: Metadata = {
  title: "工具集",
  description: "三个真的能用的 AI 工具：截图转代码、URL 速读、多模型对比。",
}

export default function ToolsPage() {
  return (
    <div className="flex flex-1 flex-col py-12">
      <ToolsGrid />
    </div>
  )
}
