import type { Metadata } from "next"
import { Activity, BadgeCheck, Coins, GitCompareArrows, Hash, Sparkles } from "lucide-react"

import { TrendChart } from "@/components/stats/TrendChart"
import { MODELS, estimateCost, type ModelInfo } from "@/lib/ai/models"
import { PROVIDER_LABEL } from "@/lib/ai/providers"
import { getServerMessages } from "@/lib/i18n/server"
import { counterGet, kvEnabled, readCallTrend } from "@/lib/kv"
import { siteConfig, tools } from "@/lib/site"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerMessages()
  return {
    title: t.stats.title,
    description: `${siteConfig.name} ${t.stats.intro.slice(0, 100)}`,
  }
}

// ISR: refresh at most once per minute.
export const revalidate = 60

type ModelUsage = {
  model: ModelInfo
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
}

function formatCost(usd: number): string {
  if (usd === 0) return "$0"
  if (usd < 0.01) return `$${usd.toFixed(5)}`
  if (usd < 1) return `$${usd.toFixed(4)}`
  return `$${usd.toFixed(2)}`
}

function formatTokens(n: number): string {
  if (n < 1000) return n.toString()
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`
  return `${(n / 1_000_000).toFixed(2)}M`
}

export default async function StatsPage() {
  const { t } = await getServerMessages()

  const counts = await Promise.all(
    tools.map(async (tool) => {
      const tr = t.tools.byName[tool.slug as keyof typeof t.tools.byName]
      return {
        tool,
        name: tr?.name ?? tool.name,
        count: await counterGet(`calls:${tool.slug}`),
      }
    }),
  )
  const total = counts.reduce((acc, c) => acc + c.count, 0)

  const usage: ModelUsage[] = await Promise.all(
    MODELS.map(async (model) => {
      const [inputTokens, outputTokens] = await Promise.all([
        counterGet(`tokens:${model.id}:input`),
        counterGet(`tokens:${model.id}:output`),
      ])
      return {
        model,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        cost: estimateCost(model.id, inputTokens, outputTokens) ?? 0,
      }
    }),
  )

  const totalTokens = usage.reduce((acc, u) => acc + u.totalTokens, 0)
  const totalCost = usage.reduce((acc, u) => acc + u.cost, 0)
  const activeUsage = usage.filter((u) => u.totalTokens > 0).sort((a, b) => b.cost - a.cost)

  const trend = await readCallTrend("total", 7)
  const trendPeak = Math.max(...trend.map((d) => d.count), 0)

  const generatedAt = new Date().toISOString()
  const status = kvEnabled ? t.stats.statusActive : t.stats.statusOffline

  const PERF_TARGETS = [
    { label: t.stats.perfLabels.lighthousePerf, target: "≥ 95", icon: Sparkles },
    { label: t.stats.perfLabels.lighthouseOthers, target: "≥ 95", icon: BadgeCheck },
    { label: t.stats.perfLabels.lcp, target: "< 1.5s @ 4G", icon: Activity },
    { label: t.stats.perfLabels.firstToken, target: "< 2s", icon: Activity },
  ] as const

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 py-16 sm:px-6 sm:py-20">
      <header className="flex flex-col gap-3">
        <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          {t.stats.badge}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.stats.title}</h1>
        <p className="text-muted-foreground max-w-2xl text-balance">{t.stats.intro}</p>
        {!kvEnabled && (
          <div className="border-border/60 bg-card/50 text-muted-foreground rounded-md border p-3 text-xs">
            <strong className="text-foreground">{t.stats.kvOffline.headline}</strong>.{" "}
            {t.stats.kvOffline.body}
          </div>
        )}
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          {t.stats.sections.cumulative}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={Activity}
            label={t.stats.cards.totalCalls}
            value={total.toLocaleString()}
            tone="primary"
          />
          <SummaryCard
            icon={Hash}
            label={t.stats.cards.totalTokens}
            value={formatTokens(totalTokens)}
          />
          <SummaryCard
            icon={Coins}
            label={t.stats.cards.outOfPocket}
            value={formatCost(totalCost)}
            tone={totalCost > 0 ? "primary" : undefined}
          />
          <SummaryCard
            icon={GitCompareArrows}
            label={t.stats.cards.activeModels}
            value={`${activeUsage.length} / ${MODELS.length}`}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          {t.stats.sections.trend}
        </h2>
        <div className="bg-card/40 border-border/60 text-muted-foreground rounded-lg border p-4">
          {trendPeak === 0 ? (
            <p className="py-4 text-center text-sm">
              {kvEnabled ? t.stats.trend.empty : t.stats.trend.noKv}
            </p>
          ) : (
            <TrendChart data={trend} ariaLabel={t.stats.trend.lastNDays(7)} />
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          {t.stats.sections.perTool}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {counts.map(({ tool, name, count }) => (
            <SummaryCard
              key={tool.slug}
              icon={tool.icon}
              label={name}
              value={count.toLocaleString()}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          {t.stats.sections.perModel}
        </h2>
        {activeUsage.length === 0 ? (
          <p className="bg-card/40 border-border/60 text-muted-foreground rounded-lg border p-4 text-sm">
            {t.stats.emptyModelUsage}
          </p>
        ) : (
          <ul className="bg-card/40 border-border/60 divide-border/60 divide-y overflow-hidden rounded-lg border">
            {activeUsage.map((u) => (
              <li
                key={u.model.id}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-4 py-3 text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-medium tracking-tight">{u.model.name}</span>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {PROVIDER_LABEL[u.model.provider]}
                  </span>
                </div>
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {formatTokens(u.inputTokens)} → {formatTokens(u.outputTokens)}
                </span>
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {formatTokens(u.totalTokens)}
                </span>
                <span className="text-foreground font-mono text-sm font-semibold tabular-nums">
                  {formatCost(u.cost)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          {t.stats.sections.perfTargets}
        </h2>
        <ul className="divide-border/60 bg-card/40 border-border/60 divide-y overflow-hidden rounded-lg border">
          {PERF_TARGETS.map((p) => (
            <li key={p.label} className="flex items-center justify-between gap-3 p-3 text-sm">
              <span className="text-foreground/90 inline-flex items-center gap-2">
                <p.icon className="text-primary size-3.5" />
                {p.label}
              </span>
              <span className="text-muted-foreground font-mono text-xs">{p.target}</span>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground text-xs">{t.stats.perfTargetsNote}</p>
      </section>

      <footer className="text-muted-foreground border-border/40 border-t pt-4 font-mono text-[10px]">
        {t.stats.generated(generatedAt, status)}
      </footer>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone?: "primary"
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border p-4 ${
        tone === "primary" ? "border-primary/40 bg-primary/5" : "bg-card/40 border-border/60"
      }`}
    >
      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="font-mono text-2xl font-semibold tabular-nums">{value}</span>
    </div>
  )
}
