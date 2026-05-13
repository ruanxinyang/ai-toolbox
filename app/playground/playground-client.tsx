"use client"

import { useCallback, useRef, useState } from "react"
import { AlertCircle, Copy, KeyRound, Play, Sparkles, Square, X } from "lucide-react"
import { toast } from "sonner"

import { BYOKDialog } from "@/components/BYOKDialog"
import { MarkdownView } from "@/components/tools/MarkdownView"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useByok } from "@/hooks/useByok"
import { byokToHeaders } from "@/lib/ai/byok"
import { DEFAULT_MODELS, MODELS, getModelInfo } from "@/lib/ai/models"
import { PROVIDER_LABEL } from "@/lib/ai/providers"
import { useI18n } from "@/lib/i18n/client"

type ApiErrorPayload = { code?: string; message?: string }

function formatTime(ms: number | null): string {
  if (ms == null) return "—"
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function PlaygroundClient() {
  const { t } = useI18n()
  const { byok } = useByok()
  const [prompt, setPrompt] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [modelId, setModelId] = useState<string>(DEFAULT_MODELS.modelCompareInitial[0])
  const [temperature, setTemperature] = useState(0.7)
  const [output, setOutput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<ApiErrorPayload | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [stats, setStats] = useState<{ elapsedMs: number; firstTokenMs: number | null } | null>(
    null,
  )
  const abortRef = useRef<AbortController | null>(null)

  const run = useCallback(async () => {
    if (!prompt.trim() || streaming) return
    setError(null)
    setOutput("")
    setStats(null)
    setStreaming(true)
    const controller = new AbortController()
    abortRef.current = controller
    const start = Date.now()
    let firstTokenAt: number | null = null

    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...byokToHeaders(byok) },
        body: JSON.stringify({
          prompt,
          system: systemPrompt || undefined,
          modelId,
          temperature,
        }),
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
        if (firstTokenAt === null) firstTokenAt = Date.now()
        received += decoder.decode(value, { stream: true })
        setOutput(received)
      }
      setStats({
        elapsedMs: Date.now() - start,
        firstTokenMs: firstTokenAt ? firstTokenAt - start : null,
      })
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      toast.error("请求失败", { description: (err as Error).message })
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [prompt, systemPrompt, modelId, temperature, streaming, byok])

  const cancel = () => abortRef.current?.abort()

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output)
      toast.success("输出已复制")
    } catch {
      toast.error("复制失败")
    }
  }

  const info = getModelInfo(modelId)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[420px_1fr] lg:gap-6 lg:py-10">
      <aside className="flex flex-col gap-4">
        <header className="flex flex-col gap-2">
          <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
            {t.playground.badge}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t.playground.title}
          </h1>
          <p className="text-muted-foreground text-balance">{t.playground.description}</p>
        </header>

        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={streaming}
          placeholder={t.playground.promptPlaceholder}
          rows={10}
          maxLength={20_000}
          className="resize-none"
        />
        <span className="text-muted-foreground text-right font-mono text-[10px]">
          {prompt.length.toLocaleString()} / 20,000
        </span>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-foreground font-medium">模型</span>
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            disabled={streaming}
            className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {PROVIDER_LABEL[m.provider]}
              </option>
            ))}
          </select>
          {info && (
            <span className="text-muted-foreground font-mono text-[10px]">
              {info.tagline} · context {(info.contextWindow / 1000).toFixed(0)}k · in $
              {info.inputCostPer1M}/1M · out ${info.outputCostPer1M}/1M
            </span>
          )}
        </label>

        <details
          open={showAdvanced}
          onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
          className="text-muted-foreground text-sm"
        >
          <summary className="hover:text-foreground cursor-pointer select-none">
            {t.playground.advancedToggle}
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              disabled={streaming}
              placeholder={t.playground.systemPlaceholder}
              rows={3}
              maxLength={4000}
              className="resize-none"
            />
            <label className="flex items-center gap-3">
              <span className="text-foreground/90 w-40 font-medium">
                {t.playground.temperature}:{" "}
                <span className="text-primary font-mono">{temperature.toFixed(1)}</span>
              </span>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                disabled={streaming}
                className="accent-primary flex-1"
                aria-label={t.playground.temperature}
              />
            </label>
          </div>
        </details>

        {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

        <div className="flex flex-col gap-2">
          {streaming ? (
            <Button variant="outline" onClick={cancel}>
              <Square />
              {t.playground.cancel}
            </Button>
          ) : (
            <Button onClick={run} disabled={!prompt.trim()}>
              <Play />
              {t.playground.run}
            </Button>
          )}
        </div>
      </aside>

      <section className="bg-card/40 border-border/60 flex min-h-[480px] flex-col overflow-hidden rounded-lg border">
        <header className="border-border/60 bg-muted/40 flex items-center justify-between gap-3 border-b px-3 py-2">
          <span className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-xs">
            <Sparkles className="size-3.5" />
            {t.playground.output}
          </span>
          <div className="flex items-center gap-3">
            {streaming && (
              <span className="text-primary inline-flex items-center gap-1 font-mono text-[10px] uppercase">
                <span className="bg-primary size-1.5 animate-pulse rounded-full" />
                streaming
              </span>
            )}
            {stats && (
              <span className="text-muted-foreground inline-flex items-center gap-3 font-mono text-[10px]">
                <span>
                  first:{" "}
                  <strong className="text-foreground">{formatTime(stats.firstTokenMs)}</strong>
                </span>
                <span>
                  total: <strong className="text-foreground">{formatTime(stats.elapsedMs)}</strong>
                </span>
              </span>
            )}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={copyOutput}
              disabled={!output}
              aria-label="复制输出"
            >
              <Copy />
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          {output ? (
            <MarkdownView text={output} />
          ) : (
            <p className="text-muted-foreground py-16 text-center text-sm">
              {t.playground.awaitingOutput}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function ErrorBanner({ error, onDismiss }: { error: ApiErrorPayload; onDismiss: () => void }) {
  const isKey = error.code === "MISSING_API_KEY"
  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/5 flex flex-col gap-2 rounded-md border p-3 text-sm"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="text-destructive mt-0.5 size-4 shrink-0" />
        <div className="flex-1">
          <p className="text-foreground font-medium">{isKey ? "需要 API Key" : "请求失败"}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">{error.message ?? "未知错误"}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground"
          aria-label="关闭"
        >
          <X className="size-3.5" />
        </button>
      </div>
      {isKey && (
        <BYOKDialog
          trigger={
            <Button variant="outline" size="sm" className="self-start">
              <KeyRound />
              配置 BYOK
            </Button>
          }
        />
      )}
    </div>
  )
}
