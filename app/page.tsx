import Link from "next/link"
import { ArrowDown, KeyRound, Play, Radio, Shield } from "lucide-react"

import { GithubIcon } from "@/components/icons/GithubIcon"
import { ToolsGrid } from "@/components/sections/ToolsGrid"
import { buttonVariants } from "@/components/ui/button"
import { getServerMessages } from "@/lib/i18n/server"
import { siteConfig } from "@/lib/site"

export default async function HomePage() {
  const { t } = await getServerMessages()
  const features = [
    { icon: KeyRound, label: t.hero.features.byok },
    { icon: Radio, label: t.hero.features.streaming },
    { icon: Shield, label: t.hero.features.privacy },
  ] as const

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="bg-primary/15 absolute top-0 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full blur-3xl"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,var(--foreground)_1px,transparent_0)] bg-[size:32px_32px] opacity-[0.04]"
        />

        <div className="mx-auto flex min-h-[70svh] max-w-5xl flex-col items-center justify-center gap-8 px-6 py-24 text-center">
          <span className="border-border bg-card/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs backdrop-blur">
            <span className="bg-primary size-1.5 animate-pulse rounded-full" />
            {t.hero.badge}
          </span>

          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            <span className="block">{siteConfig.name}</span>
            <span className="from-primary via-primary/80 to-foreground/70 mt-3 block bg-gradient-to-br bg-clip-text text-2xl font-medium text-transparent sm:text-3xl lg:text-4xl">
              {t.hero.titleLine2}
            </span>
          </h1>

          <p className="text-muted-foreground max-w-2xl text-base text-balance sm:text-lg">
            {t.hero.description}
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link href="#tools" className={buttonVariants({ size: "lg" })}>
              {t.hero.ctaExplore}
              <ArrowDown className="ml-1 size-4" />
            </Link>
            <Link href="/playground" className={buttonVariants({ size: "lg", variant: "outline" })}>
              <Play className="mr-1 size-4" />
              {t.hero.ctaPlayground}
            </Link>
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "lg", variant: "ghost" })}
            >
              <GithubIcon className="mr-1 size-4" />
              {t.hero.ctaGithub}
            </a>
          </div>

          <ul className="text-muted-foreground mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-1.5">
                <Icon aria-hidden className="text-primary size-3.5" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ToolsGrid />
    </>
  )
}
