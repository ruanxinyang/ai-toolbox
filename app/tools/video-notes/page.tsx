import type { Metadata } from "next"

import { VideoNotesClient } from "./video-notes-client"

export const metadata: Metadata = {
  title: "视频纪要",
  description:
    "上传视频，Gemini 2.5 Pro 原生多模态处理 —— 直接出时间轴章节 + 要点 + 待办，跳过转文字步骤。",
}

export default function Page() {
  return <VideoNotesClient />
}
