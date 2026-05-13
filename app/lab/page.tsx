import type { Metadata } from "next"
import { FlaskConical } from "lucide-react"

import { getServerMessages } from "@/lib/i18n/server"

import { LabClient } from "./lab-client"

export const metadata: Metadata = {
  title: "实验室",
  description: "纯前端炫技 demo：粒子动画、Web Audio 键盘、终端模拟器。",
}

export default async function LabPage() {
  const { t } = await getServerMessages()
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-16 sm:px-6 sm:py-20">
      <header className="flex flex-col gap-3">
        <span className="text-muted-foreground inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase">
          <FlaskConical className="size-3.5" />
          {t.lab.badge}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.lab.title}</h1>
        <p className="text-muted-foreground max-w-2xl text-balance">{t.lab.intro}</p>
      </header>

      <LabClient />
    </div>
  )
}
