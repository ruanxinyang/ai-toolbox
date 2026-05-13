"use client"

import dynamic from "next/dynamic"
import { useCallback, useState } from "react"
import { AlertCircle, Copy, Download, KeyRound, Loader2, Sparkles, X } from "lucide-react"
import { toast } from "sonner"

import { BYOKDialog } from "@/components/BYOKDialog"
import { HistoryDialog } from "@/components/tools/HistoryDialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useByok } from "@/hooks/useByok"
import { byokToHeaders } from "@/lib/ai/byok"
import { MODELS } from "@/lib/ai/models"
import { pushHistory } from "@/lib/history"
import { useI18n } from "@/lib/i18n/client"

const DIAGRAM_TYPE_KEYS = [
  "flowchart",
  "sequence",
  "class",
  "state",
  "er",
  "mindmap",
  "gantt",
  "git",
] as const

type DiagramType = (typeof DIAGRAM_TYPE_KEYS)[number]

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
    <div className="text-muted-foreground p-6 text-center text-sm">
      {t.tools.mermaidGen.loadingEngine}
    </div>
  )
}

const DEFAULT_MODEL = "anthropic:claude-sonnet-4-6"

type ApiErrorPayload = { code?: string; message?: string }

type Result = {
  mermaid: string
  title: string
  explanation: string
}

type HistoryInput = { description: string; type: DiagramType; modelId: string }
type HistoryOutput = Result

export function MermaidGenClient() {
  const { t } = useI18n()
  const { byok } = useByok()
  const [description, setDescription] = useState("")
  const [type, setType] = useState<DiagramType>("flowchart")
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL)
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiErrorPayload | null>(null)
  const slug = "mermaid-gen"
  const tool = t.tools.byName[slug]
  const ui = t.tools.mermaidGen

  const submit = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault()
      if (!description.trim() || loading) return
      setError(null)
      setResult(null)
      setLoading(true)
      try {
        const res = await fetch("/api/mermaid-gen", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...byokToHeaders(byok) },
          body: JSON.stringify({ description: description.trim(), type, modelId }),
        })
        const payload = (await res.json().catch(() => null)) as
          | Result
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
        pushHistory<HistoryInput, HistoryOutput>(slug, {
          title: payload.title || description.trim().slice(0, 80) || tool.name,
          input: { description: description.trim(), type, modelId },
          output: payload,
        })
      } catch (err) {
        toast.error(t.tools.errors.generic, { description: (err as Error).message })
      } finally {
        setLoading(false)
      }
    },
    [description, type, modelId, loading, byok, slug, t, tool.name],
  )

  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.mermaid)
      toast.success(ui.copySuccess)
    } catch {
      toast.error(ui.copyError)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const blob = new Blob([result.mermaid], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${result.title || "diagram"}.mmd`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-2">
        <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          / {slug}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tool.name}</h1>
        <p className="text-muted-foreground text-balance">{tool.description}</p>
      </header>

      <form
        onSubmit={submit}
        className="bg-card/40 border-border/60 flex flex-col gap-4 rounded-lg border p-4"
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground font-medium">{ui.typeLabel}</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DiagramType)}
              disabled={loading}
              className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {DIAGRAM_TYPE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {ui.types[key].label} · {ui.types[key].hint}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground font-medium">{t.tools.forms.modelLabel}</span>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={loading}
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

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          placeholder={ui.promptPlaceholder}
          rows={5}
          maxLength={4000}
          className="resize-none"
        />
        <span className="text-muted-foreground text-right font-mono text-[10px]">
          {ui.charCount(description.length)}
        </span>

        {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={!description.trim() || loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? ui.generateLoadingBtn : result ? ui.regenerateBtn : ui.generateBtn}
          </Button>
          <HistoryDialog<HistoryInput, HistoryOutput>
            slug={slug}
            onRestore={(entry) => {
              setDescription(entry.input.description)
              setType(entry.input.type)
              setModelId(entry.input.modelId)
              setResult(entry.output)
            }}
            renderShareable={(entry) => entry.output.mermaid}
          />
        </div>
      </form>

      {result && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="bg-card/40 border-border/60 flex flex-col overflow-hidden rounded-lg border">
            <header className="border-border/60 bg-muted/40 flex h-9 items-center justify-between border-b px-3">
              <span className="text-muted-foreground font-mono text-xs">
                {result.title || "Mermaid"}.mmd
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCopy}
                  aria-label={t.tools.actions.copy}
                >
                  <Copy />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleDownload}
                  aria-label={t.tools.actions.download}
                >
                  <Download />
                </Button>
              </div>
            </header>
            <pre className="text-foreground/90 overflow-auto p-4 font-mono text-xs whitespace-pre-wrap">
              {result.mermaid}
            </pre>
          </div>
          <div className="bg-card/40 border-border/60 flex flex-col overflow-hidden rounded-lg border">
            <header className="border-border/60 bg-muted/40 flex h-9 items-center border-b px-3">
              <span className="text-muted-foreground font-mono text-xs">{ui.previewLabel}</span>
            </header>
            <MermaidView code={result.mermaid} />
            {result.explanation && (
              <p className="border-border/40 text-muted-foreground border-t p-3 text-xs italic">
                {result.explanation}
              </p>
            )}
          </div>
        </div>
      )}
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
            {isKey ? t.tools.byok.needs : t.tools.mermaidGen.errorTitle}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">{error.message ?? "—"}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground"
          aria-label={t.common.close}
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
