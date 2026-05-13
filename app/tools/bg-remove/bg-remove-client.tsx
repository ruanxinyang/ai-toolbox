"use client"

import Image from "next/image"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import {
  AlertCircle,
  Download,
  Eraser,
  KeyRound,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { BYOKDialog } from "@/components/BYOKDialog"
import { HistoryDialog } from "@/components/tools/HistoryDialog"
import { Button } from "@/components/ui/button"
import { pushHistory } from "@/lib/history"
import { useI18n } from "@/lib/i18n/client"

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"]
const MAX_BYTES = 10 * 1024 * 1024

type ApiErrorPayload = { code?: string; message?: string }
type HistoryInput = { fileName: string; size: number; thumbnail: string }
type HistoryOutput = { resultUrl: string }

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"))
    reader.readAsDataURL(file)
  })
}

export function BgRemoveClient() {
  const { t } = useI18n()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [original, setOriginal] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [fileSize, setFileSize] = useState<number>(0)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiErrorPayload | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const slug = "bg-remove"
  const tool = t.tools.byName[slug]
  const ui = t.tools.bgRemove

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        toast.error(ui.invalidImage)
        return
      }
      if (file.size > MAX_BYTES) {
        toast.error(ui.tooLarge(10))
        return
      }
      try {
        const dataUrl = await readAsDataURL(file)
        setOriginal(dataUrl)
        setFileName(file.name)
        setFileSize(file.size)
        setResult(null)
        setError(null)
      } catch {
        toast.error(t.tools.errors.generic)
      }
    },
    [ui, t],
  )

  useEffect(() => {
    const handler = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) {
            event.preventDefault()
            void handleFile(file)
            return
          }
        }
      }
    }
    document.addEventListener("paste", handler)
    return () => document.removeEventListener("paste", handler)
  }, [handleFile])

  const submit = useCallback(async () => {
    if (!original || loading) return
    setError(null)
    setResult(null)
    setLoading(true)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await fetch("/api/bg-remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: original }),
        signal: controller.signal,
      })
      const payload = (await res.json().catch(() => null)) as
        | { url: string }
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
      setResult(payload.url)
      pushHistory<HistoryInput, HistoryOutput>(slug, {
        title: fileName || tool.name,
        input: { fileName, size: fileSize, thumbnail: original.slice(0, 80) },
        output: { resultUrl: payload.url },
      })
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      toast.error(t.tools.errors.generic, { description: (err as Error).message })
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [original, loading, fileName, fileSize, slug, tool.name, t])

  const cancel = () => abortRef.current?.abort()

  const handleDownload = useCallback(async () => {
    if (!result) return
    try {
      const res = await fetch(result)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = ui.downloadFilename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(t.tools.errors.generic)
    }
  }, [result, ui, t])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-2">
        <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          / {slug}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tool.name}</h1>
        <p className="text-muted-foreground text-balance">{tool.description}</p>
        <p className="text-muted-foreground inline-flex items-center gap-2 font-mono text-[11px]">
          <Sparkles className="text-primary size-3" />
          {ui.modelHint}
        </p>
      </header>

      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          const file = event.dataTransfer.files?.[0]
          if (file) void handleFile(file)
        }}
        className={`group border-border/70 bg-background/40 hover:border-primary/50 hover:bg-primary/5 relative flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
          dragOver ? "border-primary bg-primary/10" : ""
        }`}
      >
        {original ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={original}
              alt={ui.originalLabel}
              className="absolute inset-0 size-full rounded-lg object-contain p-2"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setOriginal(null)
                setResult(null)
                setFileName("")
                setFileSize(0)
                if (inputRef.current) inputRef.current.value = ""
              }}
              aria-label={t.common.close}
              className="bg-background/80 hover:bg-destructive/10 hover:text-destructive border-border absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-md border backdrop-blur transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <>
            <Upload aria-hidden className="text-muted-foreground size-6" />
            <div className="flex flex-col items-center gap-0.5 text-center">
              <span className="text-sm font-medium">{ui.uploadPickBtn}</span>
              <span className="text-muted-foreground font-mono text-xs">{ui.uploadHint}</span>
            </div>
          </>
        )}
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
      </label>

      {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

      <div className="flex flex-wrap gap-2">
        {loading ? (
          <Button variant="outline" onClick={cancel}>
            <X />
            {ui.cancelBtn}
          </Button>
        ) : (
          <Button onClick={submit} disabled={!original}>
            {result ? <Sparkles /> : <Eraser />}
            {result ? ui.regenerateBtn : ui.removeBtn}
          </Button>
        )}
        {loading && (
          <span className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-xs">
            <Loader2 className="size-3.5 animate-spin" />
            {ui.processingBtn}
          </span>
        )}
        <HistoryDialog<HistoryInput, HistoryOutput>
          slug={slug}
          onRestore={(entry) => {
            setResult(entry.output.resultUrl)
            setFileName(entry.input.fileName)
            setFileSize(entry.input.size)
            setOriginal(null)
          }}
        />
      </div>

      {(original || result) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ImagePanel src={original} label={ui.originalLabel} />
          <ImagePanel
            src={result}
            label={ui.resultLabel}
            transparent
            actions={
              result ? (
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download />
                  {ui.downloadBtn}
                </Button>
              ) : null
            }
          />
        </div>
      )}
    </div>
  )
}

function ImagePanel({
  src,
  label,
  transparent,
  actions,
}: {
  src: string | null
  label: string
  transparent?: boolean
  actions?: React.ReactNode
}) {
  return (
    <div className="bg-card/40 border-border/60 flex flex-col overflow-hidden rounded-lg border">
      <header className="border-border/60 bg-muted/40 flex h-9 items-center justify-between border-b px-3">
        <span className="text-muted-foreground font-mono text-xs">{label}</span>
        {actions}
      </header>
      <div
        className={`relative flex aspect-video items-center justify-center p-4 ${
          transparent
            ? "bg-[repeating-conic-gradient(theme(colors.muted)_0deg_25%,transparent_0deg_50%)] [background-size:16px_16px]"
            : ""
        }`}
      >
        {src ? (
          src.startsWith("http") ? (
            <Image
              src={src}
              alt={label}
              width={800}
              height={450}
              className="size-full object-contain"
              unoptimized
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={label} className="size-full object-contain" />
          )
        ) : (
          <span className="text-muted-foreground font-mono text-xs">—</span>
        )}
      </div>
    </div>
  )
}

function ErrorBanner({ error, onDismiss }: { error: ApiErrorPayload; onDismiss: () => void }) {
  const { t } = useI18n()
  const ui = t.tools.bgRemove
  const isKey = error.code === "MISSING_API_KEY"
  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/5 flex flex-col gap-2 rounded-md border p-3 text-sm"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="text-destructive mt-0.5 size-4 shrink-0" />
        <div className="flex-1">
          <p className="text-foreground font-medium">{isKey ? ui.errorTitleKey : ui.errorTitle}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">{error.message ?? "—"}</p>
          {isKey && <p className="text-muted-foreground mt-1 text-xs italic">{ui.keyNote}</p>}
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
