"use client"

import { useCallback, useRef, useState } from "react"
import { AlertCircle, BookOpen, KeyRound, Sparkles, X } from "lucide-react"
import { toast } from "sonner"

import { BYOKDialog } from "@/components/BYOKDialog"
import { HistoryDialog } from "@/components/tools/HistoryDialog"
import { MarkdownView } from "@/components/tools/MarkdownView"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useByok } from "@/hooks/useByok"
import { byokToHeaders } from "@/lib/ai/byok"
import { MODELS } from "@/lib/ai/models"
import { pushHistory } from "@/lib/history"
import { useI18n } from "@/lib/i18n/client"

const DEFAULT_MODEL = "anthropic:claude-sonnet-4-6"

const DIALECT_KEYS = ["generic", "postgres", "mysql", "sqlite", "mssql", "bigquery"] as const

type Dialect = (typeof DIALECT_KEYS)[number]

const EXAMPLE_SQL = {
  nPlusOne:
    "SELECT u.id, u.name,\n  (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count,\n  (SELECT MAX(created_at) FROM orders o WHERE o.user_id = u.id) AS last_order\nFROM users u\nWHERE u.created_at > NOW() - INTERVAL '30 days';",
  cte: "WITH active_users AS (\n  SELECT id FROM users WHERE last_login > NOW() - INTERVAL '7 days'\n),\nrevenue AS (\n  SELECT user_id, SUM(amount) AS total FROM orders\n  WHERE status = 'paid' GROUP BY user_id\n)\nSELECT u.email, r.total\nFROM active_users a\nJOIN users u ON u.id = a.id\nLEFT JOIN revenue r ON r.user_id = a.id\nORDER BY r.total DESC NULLS LAST\nLIMIT 100;",
} as const

type ApiErrorPayload = { code?: string; message?: string }

type HistoryInput = { sql: string; dialect: Dialect; modelId: string }
type HistoryOutput = { explanation: string }

export function SqlExplainClient() {
  const { t } = useI18n()
  const { byok } = useByok()
  const [sql, setSql] = useState("")
  const [dialect, setDialect] = useState<Dialect>("generic")
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL)
  const [explanation, setExplanation] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<ApiErrorPayload | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const submit = useCallback(async () => {
    if (!sql.trim() || streaming) return
    setError(null)
    setExplanation("")
    setStreaming(true)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await fetch("/api/sql-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...byokToHeaders(byok) },
        body: JSON.stringify({ sql, dialect, modelId }),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) {
        const payload = (await res.json().catch(() => null)) as { error?: ApiErrorPayload } | null
        setError(payload?.error ?? { code: "UNKNOWN", message: `HTTP ${res.status}` })
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let received = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        received += decoder.decode(value, { stream: true })
        setExplanation(received)
      }
      if (received.trim()) {
        pushHistory<HistoryInput, HistoryOutput>("sql-explain", {
          title: sql.split("\n")[0].trim().slice(0, 80) || "(SQL)",
          input: { sql, dialect, modelId },
          output: { explanation: received },
        })
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      toast.error("请求失败", { description: (err as Error).message })
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [sql, dialect, modelId, streaming, byok])

  const cancel = () => abortRef.current?.abort()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:py-10">
      <aside className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
            / sql-explain
          </span>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {t.tools.sqlExplain.title}
          </h1>
          <p className="text-muted-foreground text-sm text-balance">
            {t.tools.sqlExplain.description}
          </p>
        </header>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={streaming}
            onClick={() => setSql(EXAMPLE_SQL.nPlusOne)}
            className="border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-40"
          >
            <Sparkles className="size-3" />
            {t.tools.sqlExplain.examples.nPlusOne}
          </button>
          <button
            type="button"
            disabled={streaming}
            onClick={() => setSql(EXAMPLE_SQL.cte)}
            className="border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-40"
          >
            <Sparkles className="size-3" />
            {t.tools.sqlExplain.examples.cte}
          </button>
        </div>

        <Textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          disabled={streaming}
          placeholder={t.tools.sqlExplain.placeholder}
          rows={14}
          maxLength={10_000}
          className="font-mono text-xs"
          spellCheck={false}
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground font-medium">{t.tools.sqlExplain.dialectLabel}</span>
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value as Dialect)}
              disabled={streaming}
              className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {DIALECT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {t.tools.sqlExplain.dialects[key]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground font-medium">{t.tools.forms.modelLabel}</span>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={streaming}
              className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

        <div className="flex flex-wrap gap-2">
          {streaming ? (
            <Button variant="outline" onClick={cancel}>
              <X />
              {t.tools.actions.cancel}
            </Button>
          ) : (
            <Button onClick={submit} disabled={!sql.trim()}>
              <Sparkles />
              {explanation ? t.tools.sqlExplain.regenerateBtn : t.tools.sqlExplain.explainBtn}
            </Button>
          )}
          <HistoryDialog<HistoryInput, HistoryOutput>
            slug="sql-explain"
            onRestore={(entry) => {
              setSql(entry.input.sql)
              setDialect(entry.input.dialect)
              setModelId(entry.input.modelId)
              setExplanation(entry.output.explanation)
            }}
            renderShareable={(entry) => entry.output.explanation}
          />
        </div>
      </aside>

      <section className="bg-card/40 border-border/60 flex min-h-[400px] flex-col overflow-hidden rounded-lg border">
        <header className="border-border/60 bg-muted/40 flex h-9 items-center justify-between border-b px-3">
          <span className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-xs">
            <BookOpen className="size-3.5" />
            {t.tools.sqlExplain.outputTitle}
          </span>
          {streaming && (
            <span className="text-primary inline-flex items-center gap-1 font-mono text-[10px] uppercase">
              <span className="bg-primary size-1.5 animate-pulse rounded-full" />
              streaming
            </span>
          )}
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {explanation ? (
            <MarkdownView text={explanation} />
          ) : (
            <p className="text-muted-foreground py-12 text-center text-sm">
              {t.tools.sqlExplain.outputEmpty}
            </p>
          )}
        </div>
      </section>
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
            {isKey ? t.tools.byok.needs : t.tools.errors.generic}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">{error.message ?? "—"}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground"
          aria-label={t.tools.actions.cancel}
        >
          <X className="size-3.5" />
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
