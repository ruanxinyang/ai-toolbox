import type { Metadata } from "next"

import { MeetingNotesClient } from "./meeting-notes-client"

export const metadata: Metadata = {
  title: "会议纪要",
  description: "上传会议录音，Whisper 转写 + Claude 提炼成要点 / 决定 / 待办的结构化纪要。",
}

export default function Page() {
  return <MeetingNotesClient />
}
