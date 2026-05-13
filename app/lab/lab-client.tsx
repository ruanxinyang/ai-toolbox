"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { Sparkles } from "lucide-react"

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
  const { galaxy } = t.lab
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

      <Link
        href="/lab/galaxy"
        className="group border-border/60 hover:border-primary/40 relative flex flex-col gap-3 overflow-hidden rounded-lg border bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-zinc-950 p-6 transition-colors sm:p-8"
      >
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_30%,oklch(0.6_0.18_295/0.25),transparent_60%)]"
        />
        <span className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-xs">
          <Sparkles className="size-3" />
          {galaxy.cardIndex}
        </span>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{galaxy.cardTitle}</h2>
        <p className="text-muted-foreground text-sm">{galaxy.cardDesc}</p>
        <span className="text-primary inline-flex items-center font-mono text-sm transition-transform group-hover:translate-x-1">
          {galaxy.cardCta}
        </span>
      </Link>
    </div>
  )
}
