"use client"

import dynamic from "next/dynamic"

import { useI18n } from "@/lib/i18n/client"

const ParticleField = dynamic(
  () => import("@/components/lab/ParticleField").then((m) => m.ParticleField),
  { ssr: false },
)
const MiniKeyboard = dynamic(
  () => import("@/components/lab/MiniKeyboard").then((m) => m.MiniKeyboard),
  { ssr: false },
)
const Terminal = dynamic(() => import("@/components/lab/Terminal").then((m) => m.Terminal), {
  ssr: false,
})

function DemoSection({
  index,
  title,
  desc,
  children,
}: {
  index: string
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <span className="text-muted-foreground font-mono text-xs">{index}</span>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        <p className="text-muted-foreground text-sm">{desc}</p>
      </header>
      {children}
    </section>
  )
}

export function LabClient() {
  const { t } = useI18n()
  const { particles, keyboard, terminal } = t.lab.sections
  return (
    <div className="flex flex-col gap-12">
      <DemoSection index={particles.index} title={particles.title} desc={particles.desc}>
        <ParticleField />
      </DemoSection>

      <DemoSection index={keyboard.index} title={keyboard.title} desc={keyboard.desc}>
        <MiniKeyboard />
      </DemoSection>

      <DemoSection index={terminal.index} title={terminal.title} desc={terminal.desc}>
        <Terminal />
      </DemoSection>
    </div>
  )
}
