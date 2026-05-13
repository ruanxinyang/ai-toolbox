"use client"

import dynamic from "next/dynamic"
import { useCallback, useRef, useState } from "react"
import { AlertCircle, KeyRound, Sparkles, X } from "lucide-react"
import { toast } from "sonner"

import { BYOKDialog } from "@/components/BYOKDialog"
import { CodeStreamView } from "@/components/tools/CodeStreamView"
import { HistoryDialog } from "@/components/tools/HistoryDialog"
import { ScreenshotUploader } from "@/components/tools/ScreenshotUploader"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useByok } from "@/hooks/useByok"
import { useHashShare } from "@/hooks/useHashShare"
import { byokToHeaders } from "@/lib/ai/byok"
import { DEFAULT_MODELS, MODELS } from "@/lib/ai/models"
import { pushHistory } from "@/lib/history"
import { useI18n } from "@/lib/i18n/client"
import { buildShareUrl, clearShareHash, setShareHash } from "@/lib/share"

const LivePreview = dynamic(
  () => import("@/components/tools/LivePreview").then((m) => m.LivePreview),
  {
    ssr: false,
    loading: () => <PreviewLoading />,
  },
)

function PreviewLoading() {
  const { t } = useI18n()
  return (
    <div className="bg-card/40 border-border/60 flex h-full min-h-[320px] items-center justify-center rounded-lg border p-6 text-center">
      <p className="text-muted-foreground text-sm">{t.tools.formGen.loadingEngine}</p>
    </div>
  )
}

const visionModels = MODELS.filter((m) => m.supportsVision)

type ApiErrorPayload = {
  code?: string
  message?: string
  provider?: string
}

type HistoryInput = { note: string; modelId: string; thumbnail?: string }
type HistoryOutput = { code: string }

export function ScreenshotToCodeClient() {
  const { t } = useI18n()
  const { byok } = useByok()
  const sharedCode = useHashShare()
  const [image, setImage] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [modelId, setModelId] = useState<string>(DEFAULT_MODELS.screenshotToCode)
  const [generatedCode, setGeneratedCode] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<ApiErrorPayload | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const slug = "screenshot-to-code"
  const tool = t.tools.byName[slug]
  const ui = t.tools.screenshotToCode

  // Generated takes precedence over shared once the user creates their own.
  const code = generatedCode || sharedCode

  const generate = useCallback(async () => {
    if (!image || streaming) return
    setError(null)
    setGeneratedCode("")
    clearShareHash()
    setStreaming(true)
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch("/api/screenshot-to-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...byokToHeaders(byok),
        },
        body: JSON.stringify({
          image,
          note: note || undefined,
          modelId,
        }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        const payload = (await res.json().catch(() => null)) as { error?: ApiErrorPayload } | null
        setError(
          payload?.error ?? {
            code: "UNKNOWN",
            message: `HTTP ${res.status}`,
          },
        )
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let received = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        received += decoder.decode(value, { stream: true })
        setGeneratedCode(received)
      }
      if (received.trim()) {
        pushHistory<HistoryInput, HistoryOutput>(slug, {
          title: note.trim().slice(0, 80) || tool.name,
          input: { note, modelId },
          output: { code: received },
        })
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      toast.error(t.tools.errors.generic, { description: (err as Error).message })
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [image, note, modelId, streaming, byok, t, tool.name])

  const cancel = () => {
    abortRef.current?.abort()
  }

  const handleShare = useCallback(async () => {
    if (!code) return
    setShareHash(code)
    try {
      await navigator.clipboard.writeText(buildShareUrl(code))
      toast.success(ui.shareCopied, {
        description: ui.shareCopiedDesc,
      })
    } catch {
      toast.info(ui.shareFallback, {
        description: ui.shareFallbackDesc,
      })
    }
  }, [code, ui])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[320px_1fr_1fr] lg:gap-4 lg:py-10">
      <aside className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
            / {slug}
          </span>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{tool.name}</h1>
          <p className="text-muted-foreground text-sm text-balance">{tool.description}</p>
        </header>

        <ScreenshotUploader image={image} onImage={setImage} />

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-foreground font-medium">{ui.modelLabel}</span>
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            disabled={streaming}
            className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {visionModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {m.tagline}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-foreground font-medium">
            {ui.noteLabel}{" "}
            <span className="text-muted-foreground font-normal">{ui.noteOptional}</span>
          </span>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={streaming}
            placeholder={ui.notePlaceholder}
            rows={3}
            maxLength={500}
            className="resize-none"
          />
          <span className="text-muted-foreground text-right font-mono text-[10px]">
            {note.length} / 500
          </span>
        </label>

        {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

        <div className="flex flex-col gap-2">
          {streaming ? (
            <Button variant="outline" onClick={cancel}>
              <X />
              {t.tools.actions.cancel}
            </Button>
          ) : (
            <Button onClick={generate} disabled={!image}>
              <Sparkles />
              {code ? ui.regenerateBtn : ui.generateBtn}
            </Button>
          )}
          <HistoryDialog<HistoryInput, HistoryOutput>
            slug={slug}
            onRestore={(entry) => {
              setNote(entry.input.note)
              setModelId(entry.input.modelId)
              setGeneratedCode(entry.output.code)
              clearShareHash()
            }}
            renderShareable={(entry) => entry.output.code}
          />
        </div>
      </aside>

      <section className="flex flex-col">
        <CodeStreamView
          code={code}
          streaming={streaming}
          onRetry={image && !streaming ? generate : undefined}
          onShare={code && !streaming ? handleShare : undefined}
        />
      </section>

      <section className="flex flex-col">
        <LivePreview code={code} />
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
            {isKey ? t.tools.byok.needs : t.tools.screenshotToCode.errorTitle}
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
