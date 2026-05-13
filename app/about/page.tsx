import type { Metadata } from "next"
import { Cloud, Code2, Database, KeyRound, Mail, Radio, Shield, Zap } from "lucide-react"

import { GithubIcon } from "@/components/icons/GithubIcon"
import { buttonVariants } from "@/components/ui/button"
import { getServerMessages } from "@/lib/i18n/server"
import { siteConfig } from "@/lib/site"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerMessages()
  return {
    title: t.about.title,
    description: t.about.intro.slice(0, 160),
  }
}

const PRINCIPLE_ICONS = { byok: KeyRound, streaming: Radio, privacy: Shield, lighthouse: Zap }
const STACK_LINKS: Record<string, string> = {
  "Next.js 16": "https://nextjs.org",
  "TypeScript 5": "https://www.typescriptlang.org",
  "Tailwind CSS 4": "https://tailwindcss.com",
  "shadcn/ui (base-nova)": "https://ui.shadcn.com",
  "Vercel AI SDK": "https://sdk.vercel.ai",
  "cmdk + sonner": "https://cmdk.paco.me",
}
const ARCHITECTURE_ICONS = { edge: Cloud, kv: Database, rsc: Code2 }

export default async function AboutPage() {
  const { t } = await getServerMessages()
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-24">
      <header className="mb-14 flex flex-col gap-3">
        <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          {t.about.badge}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.about.title}</h1>
        <p className="text-muted-foreground max-w-2xl text-balance">{t.about.intro}</p>
      </header>

      <Section title={t.about.sections.principles} subtitle="/ principles">
        <div className="grid gap-4 sm:grid-cols-2">
          {t.about.principles.map((p) => {
            const Icon = PRINCIPLE_ICONS[p.key]
            return (
              <div
                key={p.key}
                className="bg-card/40 border-border/60 flex flex-col gap-3 rounded-lg border p-5"
              >
                <span
                  aria-hidden
                  className="bg-primary/10 text-primary inline-flex size-9 items-center justify-center rounded-lg"
                >
                  <Icon className="size-4" />
                </span>
                <h3 className="font-semibold tracking-tight">{p.title}</h3>
                <p className="text-muted-foreground text-sm">{p.desc}</p>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title={t.about.sections.stack} subtitle="/ stack">
        <ul role="list" className="divide-border/60 divide-y">
          {t.about.stack.map((s) => (
            <li key={s.name} className="flex items-start justify-between gap-4 py-3">
              <div className="flex flex-col">
                <a
                  href={STACK_LINKS[s.name] ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary text-sm font-semibold tracking-tight transition-colors"
                >
                  {s.name}
                </a>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </div>
              <span aria-hidden className="text-muted-foreground/60 font-mono text-xs">
                ↗
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t.about.sections.architecture} subtitle="/ architecture">
        <ol className="flex flex-col gap-4">
          {t.about.architecture.map((a, i) => {
            const Icon = ARCHITECTURE_ICONS[a.key]
            return (
              <li key={a.key} className="flex gap-4 rounded-lg border border-transparent p-1">
                <span
                  aria-hidden
                  className="bg-primary/10 text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-lg"
                >
                  <Icon className="size-4" />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold tracking-tight">
                    <span className="text-muted-foreground mr-2 font-mono text-xs">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {a.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{a.desc}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </Section>

      <Section title={t.about.sections.contact} subtitle="/ contact">
        <div className="bg-card/40 border-border/60 flex flex-col items-start gap-4 rounded-lg border p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold tracking-tight">{t.about.contact.title}</h3>
            <p className="text-muted-foreground text-sm">{t.about.contact.body}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "sm" })}
            >
              <GithubIcon className="mr-1 size-3.5" />
              {t.about.contact.githubBtn}
            </a>
            <a
              href={`mailto:${siteConfig.authorEmail}`}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              <Mail className="mr-1 size-3.5" />
              {t.about.contact.emailBtn}
            </a>
          </div>
        </div>
      </Section>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-12">
      <div className="mb-5 flex flex-col gap-1.5">
        <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          {subtitle}
        </span>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      </div>
      {children}
    </section>
  )
}
