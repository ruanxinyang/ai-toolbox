import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { getServerMessages } from "@/lib/i18n/server"
import type { Messages } from "@/lib/i18n/dictionary"
import { type Tool, tools } from "@/lib/site"

type ToolI18nKey = keyof Messages["tools"]["byName"]

function translateTool(tool: Tool, t: Messages): { name: string; description: string } {
  const tr = t.tools.byName[tool.slug as ToolI18nKey]
  return tr ?? { name: tool.name, description: tool.description }
}

export async function ToolsGrid() {
  const { t } = await getServerMessages()
  return (
    <section id="tools" aria-labelledby="tools-heading" className="border-border/60 border-t">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <header className="mb-12 flex flex-col items-center gap-3 text-center">
          <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
            {t.toolsGrid.subtitle}
          </span>
          <h2 id="tools-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.toolsGrid.title}
          </h2>
          <p className="text-muted-foreground max-w-2xl text-balance">{t.toolsGrid.description}</p>
        </header>

        <ul role="list" className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => {
            const tr = translateTool(tool, t)
            return (
              <li key={tool.slug}>
                <ToolCard
                  tool={tool}
                  name={tr.name}
                  description={tr.description}
                  comingSoonLabel={t.toolsGrid.comingSoon}
                />
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function ToolCard({
  tool,
  name,
  description,
  comingSoonLabel,
}: {
  tool: Tool
  name: string
  description: string
  comingSoonLabel: string
}) {
  const Icon = tool.icon
  const available = tool.status === "available"

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden
          className="bg-primary/10 text-primary group-hover:bg-primary/15 inline-flex size-10 items-center justify-center rounded-lg transition-colors"
        >
          <Icon className="size-5" />
        </span>
        {available ? (
          <ArrowUpRight
            aria-hidden
            className="text-muted-foreground group-hover:text-primary size-4 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        ) : (
          <span className="text-muted-foreground/80 border-border/60 bg-background/60 rounded-md border px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase">
            {comingSoonLabel}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-semibold tracking-tight">{name}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
        {tool.tags.map((tag) => (
          <span
            key={tag}
            className="text-muted-foreground border-border/60 bg-background/50 rounded border px-1.5 py-0.5 font-mono text-[10px]"
          >
            {tag}
          </span>
        ))}
      </div>
    </>
  )

  const cardClass =
    "group bg-card/40 border-border/60 hover:border-primary/40 hover:bg-card/70 relative flex h-full flex-col gap-4 rounded-lg border p-5 transition-colors"

  if (available) {
    return (
      <Link href={tool.href} className={cardClass} aria-label={name}>
        {inner}
      </Link>
    )
  }

  return (
    <div className={`${cardClass} cursor-default`} aria-disabled="true" aria-label={name}>
      {inner}
    </div>
  )
}
