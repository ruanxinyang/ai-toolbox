"use client"

import { useCallback, useRef, useState } from "react"
import { AlertCircle, KeyRound, Send, Sparkles, X } from "lucide-react"
import { toast } from "sonner"

import { BYOKDialog } from "@/components/BYOKDialog"
import { HistoryDialog } from "@/components/tools/HistoryDialog"
import { MarkdownView } from "@/components/tools/MarkdownView"
import { PdfUploader } from "@/components/tools/PdfUploader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useByok } from "@/hooks/useByok"
import { byokToHeaders } from "@/lib/ai/byok"
import { MODELS } from "@/lib/ai/models"
import { pushHistory } from "@/lib/history"
import { useI18n } from "@/lib/i18n/client"

const PDF_MODELS = MODELS.filter((m) => m.provider === "google" || m.provider === "anthropic")
const DEFAULT_MODEL = "google:gemini-2.5-pro"

type ApiErrorPayload = { code?: string; message?: string }
type PdfFile = { name: string; size: number; dataUrl: string }
type HistoryInput = { fileName: string; fileSize: number; question: string; modelId: string }
type HistoryOutput = { answer: string }

export function PdfQaClient() {
  const { t } = useI18n()
  const { byok } = useByok()
  const [file, setFile] = useState<PdfFile | null>(null)
  const [question, setQuestion] = useState("")
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL)
  const [answer, setAnswer] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<ApiErrorPayload | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const slug = "pdf-qa"
  const tool = t.tools.byName[slug]
  const ui = t.tools.pdfQa

  const ask = useCallback(
    async (q?: string) => {
      const finalQ = (q ?? question).trim()
      if (!file || !finalQ || streaming) return
      setError(null)
      setAnswer("")
      setStreaming(true)
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch("/api/pdf-qa", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...byokToHeaders(byok) },
          body: JSON.stringify({ pdf: file.dataUrl, question: finalQ, modelId }),
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
          setAnswer(received)
        }
        if (received.trim()) {
          pushHistory<HistoryInput, HistoryOutput>(slug, {
            title: `${file.name} · ${finalQ.slice(0, 60)}`,
            input: { fileName: file.name, fileSize: file.size, question: finalQ, modelId },
            output: { answer: received },
          })
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        toast.error(t.tools.errors.generic, { description: (err as Error).message })
      } finally {
        setStreaming(false)
        abortRef.current = null
      }
    },
    [file, question, modelId, streaming, byok, t, slug],
  )

  const cancel = () => abortRef.current?.abort()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-2">
        <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          / {slug}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tool.name}</h1>
        <p className="text-muted-foreground text-balance">{tool.description}</p>
      </header>

      <PdfUploader file={file} onFile={setFile} />

      <div className="grid grid-cols-[1fr_auto_auto] gap-2">
        <label className="sr-only" htmlFor="pdf-question">
          {ui.questionAria}
        </label>
        <Input
          id="pdf-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !streaming) {
              e.preventDefault()
              void ask()
            }
          }}
          disabled={!file || streaming}
          placeholder={file ? ui.questionPlaceholder : ui.questionPlaceholderEmpty}
          maxLength={2000}
        />
        <select
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          disabled={streaming}
          aria-label={ui.modelAria}
          className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {PDF_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <HistoryDialog<HistoryInput, HistoryOutput>
          slug={slug}
          onRestore={(entry) => {
            setQuestion(entry.input.question)
            setModelId(entry.input.modelId)
            setAnswer(entry.output.answer)
          }}
          renderShareable={(entry) => entry.output.answer}
        />
      </div>

      {!answer && !streaming && (
        <div className="flex flex-wrap gap-2">
          {ui.suggested.map((q) => (
            <button
              key={q}
              type="button"
              disabled={!file}
              onClick={() => {
                setQuestion(q)
                void ask(q)
              }}
              className="border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles className="size-3" />
              {q}
            </button>
          ))}
        </div>
      )}

      {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

      <div className="flex gap-2">
        {streaming ? (
          <Button variant="outline" onClick={cancel}>
            <X />
            {ui.cancelBtn}
          </Button>
        ) : (
          <Button onClick={() => ask()} disabled={!file || !question.trim()}>
            <Send />
            {ui.askBtn}
          </Button>
        )}
      </div>

      {(answer || streaming) && (
        <article className="bg-card/40 border-border/60 rounded-lg border p-5">
          {answer ? (
            <MarkdownView text={answer} />
          ) : (
            <p className="text-muted-foreground text-sm">
              <span className="bg-primary mr-2 inline-block size-1.5 animate-pulse rounded-full" />
              {ui.readingHint}
            </p>
          )}
        </article>
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
            {isKey ? t.tools.byok.needs : t.tools.pdfQa.errorTitle}
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
