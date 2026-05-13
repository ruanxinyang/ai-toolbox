"use client"

import dynamic from "next/dynamic"
import { useCallback, useState } from "react"
import {
  AlertCircle,
  CalendarDays,
  Clock,
  ExternalLink,
  FileText,
  KeyRound,
  Loader2,
  Sparkles,
  User,
} from "lucide-react"
import { toast } from "sonner"

import { BYOKDialog } from "@/components/BYOKDialog"
import { HistoryDialog } from "@/components/tools/HistoryDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useByok } from "@/hooks/useByok"
import { byokToHeaders } from "@/lib/ai/byok"
import { pushHistory } from "@/lib/history"
import { useI18n } from "@/lib/i18n/client"

const MermaidView = dynamic(
  () => import("@/components/tools/MermaidView").then((m) => m.MermaidView),
  {
    ssr: false,
    loading: () => <MermaidLoading />,
  },
)

function MermaidLoading() {
  const { t } = useI18n()
  return (
    <div className="text-muted-foreground p-6 text-center text-sm">{t.tools.mermaidGen.loadingEngine}</div>
  )
}

type DigestResult = {
  summary: string[]
  mindmap: string
  title: string
  author?: string | null
  publishedAt?: string | null
  meta: { url: string; wordCount: number; readingMinutes: number }
  source: "cache" | "fresh"
}

type ApiErrorPayload = { code?: string; message?: string }
type HistoryInput = { url: string; language: "zh" | "en" }
type HistoryOutput = DigestResult

export function UrlDigestClient() {
  const { t } = useI18n()
  const { byok } = useByok()
  const [url, setUrl] = useState("")
  const [language, setLanguage] = useState<"zh" | "en">("zh")
  const [result, setResult] = useState<DigestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiErrorPayload | null>(null)
  const slug = "url-digest"
  const tool = t.tools.byName[slug]
  const ui = t.tools.urlDigest

  const submit = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault()
      if (!url.trim() || loading) return
      setError(null)
      setResult(null)
      setLoading(true)
      try {
        const res = await fetch("/api/url-digest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...byokToHeaders(byok),
          },
          body: JSON.stringify({ url: url.trim(), language }),
        })
        const payload = (await res.json().catch(() => null)) as
          | DigestResult
          | { error: ApiErrorPayload }
          | null
        if (!res.ok || !payload || "error" in payload) {
          setError(
            (payload && "error" in payload ? payload.error : null) ?? {
              code: "UNKNOWN",
              message: `HTTP ${res.status}`,
            },
          )
          return
        }
        setResult(payload)
        if (payload.source === "cache") {
          toast.info(ui.cacheHitTitle, { description: ui.cacheHitBody })
        }
        pushHistory<HistoryInput, HistoryOutput>(slug, {
          title: payload.title || url.trim().slice(0, 80),
          input: { url: url.trim(), language },
          output: payload,
        })
      } catch (err) {
        toast.error(t.tools.errors.generic, { description: (err as Error).message })
      } finally {
        setLoading(false)
      }
    },
    [url, language, loading, byok, slug, t, ui],
  )

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <header className="flex flex-col gap-2">
        <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          / {slug}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tool.name}</h1>
        <p className="text-muted-foreground text-balance">{tool.description}</p>
      </header>

      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={ui.placeholder}
          disabled={loading}
          required
          maxLength={2000}
          autoComplete="url"
          className="flex-1"
        />
        <div className="flex gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "zh" | "en")}
            disabled={loading}
            aria-label={ui.languageAria}
            className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="zh">{ui.languageZh}</option>
            <option value="en">{ui.languageEn}</option>
          </select>
          <Button type="submit" disabled={!url.trim() || loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? ui.submitLoadingBtn : ui.submitBtn}
          </Button>
          <HistoryDialog<HistoryInput, HistoryOutput>
            slug={slug}
            onRestore={(entry) => {
              setUrl(entry.input.url)
              setLanguage(entry.input.language)
              setResult(entry.output)
            }}
            renderShareable={(entry) => entry.output.meta.url}
          />
        </div>
      </form>

      {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

      {loading && !result && <LoadingSkeleton />}

      {result && <DigestView result={result} />}
    </div>
  )
}

function LoadingSkeleton() {
  const { t } = useI18n()
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t.tools.urlDigest.a11yAnalyzing}
      className="bg-card/40 border-border/60 flex flex-col gap-5 rounded-lg border p-6"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex flex-col gap-3">
        {[100, 95, 88, 76].map((w, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="size-6 shrink-0 rounded-full" />
            <Skeleton className="h-3 flex-1" style={{ maxWidth: `${w}%` }} />
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-1 text-center font-mono text-[10px] tracking-widest uppercase">
        {t.tools.urlDigest.pipelineCaption}
      </p>
    </div>
  )
}

function DigestView({ result }: { result: DigestResult }) {
  const { t } = useI18n()
  const ui = t.tools.urlDigest
  return (
    <div className="bg-card/40 border-border/60 flex flex-col gap-6 rounded-lg border p-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">{result.title}</h2>
          <a
            href={result.meta.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary inline-flex max-w-md items-center gap-1 truncate font-mono text-xs transition-colors"
          >
            <ExternalLink className="size-3" />
            {result.meta.url}
          </a>
        </div>
        {result.source === "cache" && (
          <span className="border-border/60 text-muted-foreground rounded border px-2 py-0.5 font-mono text-[10px] uppercase">
            {ui.cachedBadge}
          </span>
        )}
      </header>

      <Tabs defaultValue="summary" className="gap-4">
        <TabsList>
          <TabsTrigger value="summary">
            <FileText />
            {ui.tabs.summary}
          </TabsTrigger>
          <TabsTrigger value="mindmap">
            <Sparkles />
            {ui.tabs.mindmap}
          </TabsTrigger>
          <TabsTrigger value="meta">
            <Clock />
            {ui.tabs.meta}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="flex flex-col gap-3">
          <ul role="list" className="flex flex-col gap-3">
            {result.summary.map((point, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span
                  aria-hidden
                  className="bg-primary/10 text-primary inline-flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold"
                >
                  {i + 1}
                </span>
                <span className="text-foreground/90 leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="mindmap">
          <div className="bg-background/40 border-border/40 overflow-hidden rounded-md border">
            <MermaidView code={result.mindmap} />
          </div>
        </TabsContent>

        <TabsContent value="meta" className="flex flex-col gap-3">
          <MetaRow icon={FileText} label={ui.meta.title} value={result.title} />
          {result.author && <MetaRow icon={User} label={ui.meta.author} value={result.author} />}
          {result.publishedAt && (
            <MetaRow icon={CalendarDays} label={ui.meta.publishedAt} value={result.publishedAt} />
          )}
          <MetaRow
            icon={FileText}
            label={ui.meta.wordCount}
            value={result.meta.wordCount.toLocaleString()}
          />
          <MetaRow
            icon={Clock}
            label={ui.meta.readingTime}
            value={ui.readingMinutes(result.meta.readingMinutes)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="border-border/40 flex items-center justify-between gap-3 border-b py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground inline-flex items-center gap-2">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="text-foreground/90 max-w-[60%] truncate text-right">{value}</span>
    </div>
  )
}

function ErrorBanner({ error, onDismiss }: { error: ApiErrorPayload; onDismiss: () => void }) {
  const { t } = useI18n()
  const isKey = error.code === "MISSING_API_KEY"
  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/5 flex flex-col gap-2 rounded-md border p-3 text-sm"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="text-destructive mt-0.5 size-4 shrink-0" />
        <div className="flex-1">
          <p className="text-foreground font-medium">
            {isKey ? t.tools.byok.needs : t.tools.urlDigest.errorTitle}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">{error.message ?? "—"}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground"
          aria-label={t.common.close}
        >
          <span aria-hidden>×</span>
        </button>
      </div>
      {isKey && (
        <BYOKDialog
          trigger={
            <Button variant="outline" size="sm" className="self-start">
              <KeyRound />
              {t.tools.byok.configure}
            </Button>
          }
        />
      )}
    </div>
  )
}
