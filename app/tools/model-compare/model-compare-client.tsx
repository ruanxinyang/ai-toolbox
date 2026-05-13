"use client"

import { useCallback, useRef, useState } from "react"
import { AlertCircle, Clock, Coins, Cpu, Hash, KeyRound, Play, StopCircle } from "lucide-react"
import { toast } from "sonner"

import { BYOKDialog } from "@/components/BYOKDialog"
import { HistoryDialog } from "@/components/tools/HistoryDialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useByok } from "@/hooks/useByok"
import { byokToHeaders } from "@/lib/ai/byok"
import { DEFAULT_MODELS, MODELS, estimateCost, getModelInfo } from "@/lib/ai/models"
import { PROVIDER_LABEL } from "@/lib/ai/providers"
import { pushHistory } from "@/lib/history"
import { useI18n } from "@/lib/i18n/client"

const MAX_MODELS = 4
const META_SEPARATOR = ""

type ColumnMeta = {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  elapsedMs: number
  firstTokenMs: number | null
}

type ColumnStatus = "idle" | "streaming" | "done" | "error" | "aborted"

type Column = {
  modelId: string
  text: string
  status: ColumnStatus
  meta: ColumnMeta | null
  error: string | null
}

type HistoryInput = {
  prompt: string
  system: string
  temperature: number
  modelIds: string[]
}
type HistoryColumn = { modelId: string; text: string; meta: ColumnMeta | null }
type HistoryOutput = { columns: HistoryColumn[] }

function makeColumn(modelId: string): Column {
  return { modelId, text: "", status: "idle", meta: null, error: null }
}

function formatTime(ms: number | null | undefined): string {
  if (ms == null) return "—"
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function formatCost(usd: number | null): string {
  if (usd == null) return "—"
  if (usd === 0) return "$0"
  if (usd < 0.0001) return "< $0.0001"
  if (usd < 0.01) return `$${usd.toFixed(5)}`
  return `$${usd.toFixed(4)}`
}

export function ModelCompareClient() {
  const { t } = useI18n()
  const { byok } = useByok()
  const [prompt, setPrompt] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [temperature, setTemperature] = useState(0.7)
  const [selectedIds, setSelectedIds] = useState<string[]>([...DEFAULT_MODELS.modelCompareInitial])
  const [columns, setColumns] = useState<Column[]>([])
  const [running, setRunning] = useState(false)
  const [showSystem, setShowSystem] = useState(false)
  const [missingKey, setMissingKey] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const slug = "model-compare"
  const tool = t.tools.byName[slug]
  const ui = t.tools.modelCompare

  const toggleModel = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_MODELS) {
        toast.warning(ui.maxModelsToast(MAX_MODELS))
        return prev
      }
      return [...prev, id]
    })
  }

  const runOne = useCallback(
    async (col: Column, signal: AbortSignal, update: (next: Partial<Column>) => void) => {
      try {
        const res = await fetch("/api/model-compare", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...byokToHeaders(byok),
          },
          body: JSON.stringify({
            prompt,
            system: systemPrompt || undefined,
            modelId: col.modelId,
            temperature,
          }),
          signal,
        })

        if (!res.ok || !res.body) {
          const payload = (await res.json().catch(() => null)) as {
            error?: { code?: string; message?: string }
          } | null
          if (payload?.error?.code === "MISSING_API_KEY") setMissingKey(true)
          update({
            status: "error",
            error: payload?.error?.message ?? `HTTP ${res.status}`,
          })
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let raw = ""
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          raw += decoder.decode(value, { stream: true })
          const sep = raw.indexOf(META_SEPARATOR)
          const text = sep === -1 ? raw : raw.slice(0, sep)
          update({ text, status: "streaming" })
        }

        const sep = raw.indexOf(META_SEPARATOR)
        const text = sep === -1 ? raw : raw.slice(0, sep)
        let meta: ColumnMeta | null = null
        let metaError: string | null = null
        if (sep !== -1) {
          try {
            const parsed = JSON.parse(raw.slice(sep + 1)) as ColumnMeta & { error?: string }
            if (parsed.error) {
              metaError = parsed.error
            } else {
              meta = {
                inputTokens: parsed.inputTokens,
                outputTokens: parsed.outputTokens,
                totalTokens: parsed.totalTokens,
                elapsedMs: parsed.elapsedMs,
                firstTokenMs: parsed.firstTokenMs,
              }
            }
          } catch {
            metaError = "Failed to parse response metadata"
          }
        }
        update({
          text,
          meta,
          error: metaError,
          status: metaError ? "error" : "done",
        })
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          update({ status: "aborted" })
        } else {
          update({ status: "error", error: (err as Error).message })
        }
      }
    },
    [prompt, systemPrompt, temperature, byok],
  )

  const run = useCallback(async () => {
    if (running || !prompt.trim() || selectedIds.length === 0) return
    setMissingKey(false)
    const initial = selectedIds.map((id) => ({ ...makeColumn(id), status: "streaming" as const }))
    setColumns(initial)
    setRunning(true)
    const controller = new AbortController()
    abortRef.current = controller

    const finalCols: Column[] = [...initial]
    await Promise.all(
      initial.map((col, index) =>
        runOne(col, controller.signal, (next) => {
          setColumns((prev) => {
            const copy = [...prev]
            copy[index] = { ...copy[index], ...next }
            finalCols[index] = copy[index]
            return copy
          })
        }),
      ),
    )

    setRunning(false)
    abortRef.current = null

    const usable = finalCols.filter((c) => c.text.trim().length > 0)
    if (usable.length > 0) {
      pushHistory<HistoryInput, HistoryOutput>(slug, {
        title: prompt.split("\n")[0].trim().slice(0, 80) || tool.name,
        input: {
          prompt,
          system: systemPrompt,
          temperature,
          modelIds: selectedIds,
        },
        output: {
          columns: usable.map((c) => ({ modelId: c.modelId, text: c.text, meta: c.meta })),
        },
      })
    }
  }, [running, prompt, selectedIds, runOne, slug, systemPrompt, temperature, tool.name])

  const cancel = () => abortRef.current?.abort()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-2">
        <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          / {slug}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tool.name}</h1>
        <p className="text-muted-foreground text-balance">{ui.description(MAX_MODELS)}</p>
      </header>

      <div className="bg-card/40 border-border/60 flex flex-col gap-4 rounded-lg border p-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-foreground text-sm font-medium">{ui.selectModelsLabel}</span>
          <div className="flex flex-wrap gap-2">
            {MODELS.map((m) => {
              const active = selectedIds.includes(m.id)
              const disabled = !active && selectedIds.length >= MAX_MODELS
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleModel(m.id)}
                  disabled={running || disabled}
                  className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    active
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-background/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  <span>{m.name}</span>
                  <span className="text-[10px] opacity-70">{PROVIDER_LABEL[m.provider]}</span>
                </button>
              )
            })}
          </div>
          <span className="text-muted-foreground font-mono text-[10px]">
            {ui.selectedHint(selectedIds.length, MAX_MODELS)}
          </span>
        </div>

        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={ui.promptPlaceholder}
          disabled={running}
          rows={4}
          maxLength={10_000}
          className="resize-none"
        />

        <details
          open={showSystem}
          onToggle={(e) => setShowSystem((e.target as HTMLDetailsElement).open)}
          className="text-muted-foreground text-sm"
        >
          <summary className="hover:text-foreground cursor-pointer select-none">
            {ui.advancedToggle}
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder={ui.systemPlaceholder}
              disabled={running}
              rows={2}
              maxLength={2000}
              className="resize-none"
            />
            <label className="flex items-center gap-3">
              <span className="text-foreground/90 w-32 font-medium">
                {ui.temperatureLabel}:{" "}
                <span className="text-primary font-mono">{temperature.toFixed(1)}</span>
              </span>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                disabled={running}
                className="accent-primary flex-1"
                aria-label={ui.temperatureLabel}
              />
            </label>
          </div>
        </details>

        <div className="flex flex-wrap items-center gap-2">
          {running ? (
            <Button variant="outline" onClick={cancel}>
              <StopCircle />
              {ui.cancelBtn}
            </Button>
          ) : (
            <Button onClick={run} disabled={!prompt.trim() || selectedIds.length === 0}>
              <Play />
              {ui.runBtn(selectedIds.length)}
            </Button>
          )}
          <HistoryDialog<HistoryInput, HistoryOutput>
            slug={slug}
            onRestore={(entry) => {
              setPrompt(entry.input.prompt)
              setSystemPrompt(entry.input.system)
              setTemperature(entry.input.temperature)
              setSelectedIds(entry.input.modelIds)
              setColumns(
                entry.output.columns.map((c) => ({
                  modelId: c.modelId,
                  text: c.text,
                  meta: c.meta,
                  status: "done" as const,
                  error: null,
                })),
              )
            }}
            renderShareable={(entry) => entry.output.columns.map((c) => c.text).join("\n\n---\n\n")}
          />
          {missingKey && (
            <BYOKDialog
              trigger={
                <Button variant="outline" size="sm">
                  <KeyRound />
                  {ui.configureMissingKeyBtn}
                </Button>
              }
            />
          )}
        </div>
      </div>

      {columns.length > 0 && <Leaderboard columns={columns} />}

      {columns.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((col, i) => (
            <ColumnView key={`${col.modelId}-${i}`} column={col} />
          ))}
        </div>
      )}
    </div>
  )
}

function Leaderboard({ columns }: { columns: Column[] }) {
  const { t } = useI18n()
  const done = columns.filter((c) => c.status === "done" && c.meta)
  if (done.length === 0) return null
  const sorted = [...done].sort((a, b) => (a.meta!.elapsedMs ?? 0) - (b.meta!.elapsedMs ?? 0))
  return (
    <div className="bg-card/40 border-border/60 flex flex-wrap items-center gap-3 rounded-md border p-3 text-xs">
      <span className="text-muted-foreground font-mono uppercase">
        {t.tools.modelCompare.leaderboardLabel}
      </span>
      {sorted.map((col, i) => {
        const info = getModelInfo(col.modelId)
        return (
          <span
            key={col.modelId}
            className="border-border/60 inline-flex items-center gap-1.5 rounded border px-2 py-0.5"
          >
            <span className="text-muted-foreground font-mono">{i + 1}.</span>
            <span className="font-medium">{info?.name ?? col.modelId}</span>
            <span className="text-primary font-mono">{formatTime(col.meta!.elapsedMs)}</span>
          </span>
        )
      })}
    </div>
  )
}

function ColumnView({ column }: { column: Column }) {
  const { t } = useI18n()
  const info = getModelInfo(column.modelId)
  const cost =
    column.meta && info
      ? estimateCost(column.modelId, column.meta.inputTokens, column.meta.outputTokens)
      : null

  return (
    <div className="bg-card/40 border-border/60 flex h-full flex-col overflow-hidden rounded-lg border">
      <header className="border-border/60 bg-muted/30 flex flex-col gap-1 border-b p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold tracking-tight">
            {info?.name ?? column.modelId}
          </span>
          <StatusBadge status={column.status} />
        </div>
        <span className="text-muted-foreground truncate font-mono text-[10px]">
          {info ? PROVIDER_LABEL[info.provider] : column.modelId.split(":")[0]} ·{" "}
          {info?.tagline ?? ""}
        </span>
      </header>

      <div className="flex max-h-[400px] min-h-[180px] flex-1 overflow-y-auto p-3 text-sm whitespace-pre-wrap">
        {column.error ? (
          <p className="text-destructive flex items-start gap-2 text-xs">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <span>{column.error}</span>
          </p>
        ) : column.text ? (
          <p className="text-foreground/90 break-words">{column.text}</p>
        ) : (
          <p className="text-muted-foreground text-xs">{t.tools.modelCompare.waitingLabel}</p>
        )}
      </div>

      <footer className="border-border/60 text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-1 border-t p-2 font-mono text-[10px]">
        <Stat
          icon={Clock}
          label={t.tools.modelCompare.footer.firstToken}
          value={formatTime(column.meta?.firstTokenMs)}
        />
        <Stat
          icon={Cpu}
          label={t.tools.modelCompare.footer.totalTime}
          value={formatTime(column.meta?.elapsedMs)}
        />
        <Stat
          icon={Hash}
          label={t.tools.modelCompare.footer.tokens}
          value={column.meta ? `${column.meta.inputTokens}→${column.meta.outputTokens}` : "—"}
        />
        <Stat icon={Coins} label={t.tools.modelCompare.footer.cost} value={formatCost(cost)} />
      </footer>
    </div>
  )
}

function StatusBadge({ status }: { status: ColumnStatus }) {
  const { t } = useI18n()
  const map: Record<ColumnStatus, { label: string; className: string }> = {
    idle: { label: t.tools.modelCompare.status.idle, className: "text-muted-foreground" },
    streaming: {
      label: t.tools.modelCompare.status.streaming,
      className: "text-primary bg-primary/10",
    },
    done: {
      label: t.tools.modelCompare.status.done,
      className: "text-emerald-500 bg-emerald-500/10",
    },
    error: {
      label: t.tools.modelCompare.status.error,
      className: "text-destructive bg-destructive/10",
    },
    aborted: {
      label: t.tools.modelCompare.status.aborted,
      className: "text-muted-foreground bg-muted",
    },
  }
  const { label, className } = map[status]
  return (
    <span
      className={`rounded px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase ${className}`}
    >
      {label}
    </span>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <span className="inline-flex items-center gap-1 truncate">
      <Icon className="size-2.5 shrink-0" />
      <span className="text-muted-foreground/80">{label}:</span>
      <span className="text-foreground/80 truncate">{value}</span>
    </span>
  )
}
