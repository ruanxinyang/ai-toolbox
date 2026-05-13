"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  Palette,
  Sparkles,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { BYOKDialog } from "@/components/BYOKDialog"
import { HistoryDialog } from "@/components/tools/HistoryDialog"
import { Button } from "@/components/ui/button"
import { useByok } from "@/hooks/useByok"
import { byokToHeaders } from "@/lib/ai/byok"
import { MODELS } from "@/lib/ai/models"
import { pushHistory } from "@/lib/history"
import { useI18n } from "@/lib/i18n/client"

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"]
const MAX_BYTES = 5 * 1024 * 1024
const DEFAULT_MODEL = "google:gemini-2.5-pro"
const VISION_MODELS = MODELS.filter((m) => m.supportsVision)

type PaletteEntry = {
  hex: string
  name: string
  role: "primary" | "secondary" | "accent" | "neutral" | "highlight"
  ratio: number
}
type FontEntry = {
  family: string
  category: "serif" | "sans-serif" | "display" | "monospace" | "handwriting"
  vibe: string
}
type Result = { palette: PaletteEntry[]; fonts: FontEntry[]; mood: string }
type ApiErrorPayload = { code?: string; message?: string }

type HistoryInput = { fileName: string; size: number; modelId: string }
type HistoryOutput = Result

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"))
    reader.readAsDataURL(file)
  })
}

function pickTextColor(hex: string): string {
  // Standard relative luminance check → black on light, white on dark
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luma > 0.55 ? "#0a0a0a" : "#fafafa"
}

function toTailwindConfig(palette: PaletteEntry[]): string {
  const lines = palette.map(
    (p, i) => `        ${slugify(p.name) || `c${i + 1}`}: "${p.hex.toLowerCase()}",`,
  )
  return `// tailwind.config.ts (excerpt)
const palette = {
  extend: {
    colors: {
${lines.join("\n")}
    },
  },
}`
}

function toCssVars(palette: PaletteEntry[]): string {
  const lines = palette.map(
    (p, i) => `  --color-${slugify(p.name) || `c${i + 1}`}: ${p.hex.toLowerCase()};`,
  )
  return `:root {\n${lines.join("\n")}\n}`
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function ImagePaletteClient() {
  const { t } = useI18n()
  const { byok } = useByok()
  const inputId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")
  const [fileSize, setFileSize] = useState(0)
  const [modelId, setModelId] = useState(DEFAULT_MODEL)
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiErrorPayload | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const slug = "image-palette"
  const tool = t.tools.byName[slug]
  const ui = t.tools.imagePalette

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        toast.error(ui.invalidImage)
        return
      }
      if (file.size > MAX_BYTES) {
        toast.error(ui.tooLarge(5))
        return
      }
      try {
        const dataUrl = await readAsDataURL(file)
        setImage(dataUrl)
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
    if (!image || loading) return
    setError(null)
    setResult(null)
    setLoading(true)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await fetch("/api/image-palette", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...byokToHeaders(byok) },
        body: JSON.stringify({ image, modelId }),
        signal: controller.signal,
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
        title: fileName || tool.name,
        input: { fileName, size: fileSize, modelId },
        output: payload,
      })
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      toast.error(t.tools.errors.generic, { description: (err as Error).message })
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [image, loading, byok, modelId, fileName, fileSize, slug, tool.name, t])

  const cancel = () => abortRef.current?.abort()

  const copy = useCallback(
    async (key: string, text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopiedKey(key)
        toast.success(ui.copyConfirm)
        setTimeout(() => setCopiedKey(null), 1500)
      } catch {
        toast.error(t.tools.errors.generic)
      }
    },
    [ui, t],
  )

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-2">
        <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          / {slug}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tool.name}</h1>
        <p className="text-muted-foreground text-balance">{tool.description}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-3">
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
            {image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={fileName || tool.name}
                  className="absolute inset-0 size-full rounded-lg object-contain p-2"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setImage(null)
                    setFileName("")
                    setFileSize(0)
                    setResult(null)
                    if (fileRef.current) fileRef.current.value = ""
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
              ref={fileRef}
              type="file"
              accept={ACCEPTED.join(",")}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleFile(file)
              }}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground font-medium">{t.tools.forms.modelLabel}</span>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={loading}
              className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {VISION_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

          <div className="flex flex-wrap gap-2">
            {loading ? (
              <Button variant="outline" onClick={cancel}>
                <X />
                {ui.cancelBtn}
              </Button>
            ) : (
              <Button onClick={submit} disabled={!image}>
                {loading ? <Loader2 className="animate-spin" /> : <Palette />}
                {result ? ui.regenerateBtn : ui.generateBtn}
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
                setResult(entry.output)
                setFileName(entry.input.fileName)
                setFileSize(entry.input.size)
                setModelId(entry.input.modelId)
                setImage(null)
              }}
              renderShareable={(entry) => entry.output.palette.map((p) => p.hex).join(", ")}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {result ? (
            <>
              <ResultMood mood={result.mood} />
              <ResultPalette
                palette={result.palette}
                onCopyHex={() =>
                  copy("hex", JSON.stringify(result.palette.map((p) => p.hex.toLowerCase())))
                }
                onCopyTailwind={() => copy("tw", toTailwindConfig(result.palette))}
                onCopyCss={() => copy("css", toCssVars(result.palette))}
                copiedKey={copiedKey}
                ui={ui}
              />
              <ResultFonts
                fonts={result.fonts}
                googleFontsLabel={ui.googleFontsLink}
                label={ui.fontsLabel}
              />
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  const { t } = useI18n()
  return (
    <div className="bg-card/40 border-border/60 flex min-h-[400px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center">
      <Palette className="text-muted-foreground size-6" />
      <p className="text-muted-foreground text-sm">
        <Sparkles className="text-primary mr-1 inline-block size-3.5 -translate-y-px" />
        {t.tools.imagePalette.uploadHint}
      </p>
    </div>
  )
}

function ResultMood({ mood }: { mood: string }) {
  const { t } = useI18n()
  return (
    <div className="bg-card/40 border-border/60 flex flex-col gap-1.5 rounded-lg border p-4">
      <span className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
        {t.tools.imagePalette.moodLabel}
      </span>
      <p className="text-foreground/90 text-sm">{mood}</p>
    </div>
  )
}

function ResultPalette({
  palette,
  onCopyHex,
  onCopyTailwind,
  onCopyCss,
  copiedKey,
  ui,
}: {
  palette: PaletteEntry[]
  onCopyHex: () => void
  onCopyTailwind: () => void
  onCopyCss: () => void
  copiedKey: string | null
  ui: ReturnType<typeof useI18n>["t"]["tools"]["imagePalette"]
}) {
  return (
    <section className="bg-card/40 border-border/60 flex flex-col gap-3 rounded-lg border p-4">
      <header className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
          {ui.paletteLabel}
        </span>
        <div className="flex flex-wrap items-center gap-1">
          <CopyButton onClick={onCopyHex} active={copiedKey === "hex"} label={ui.copyHexBtn} />
          <CopyButton
            onClick={onCopyTailwind}
            active={copiedKey === "tw"}
            label={ui.copyTailwindBtn}
          />
          <CopyButton onClick={onCopyCss} active={copiedKey === "css"} label={ui.copyCssBtn} />
        </div>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {palette.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(p.hex.toLowerCase())
            }}
            className="border-border/60 hover:border-primary/40 flex flex-col gap-2 overflow-hidden rounded-md border text-left transition-colors"
            aria-label={`${p.name} ${p.hex}`}
          >
            <div
              className="flex aspect-[2.5/1] items-end justify-between p-2 font-mono text-[10px]"
              style={{
                backgroundColor: p.hex,
                color: pickTextColor(p.hex),
              }}
            >
              <span>{p.hex.toUpperCase()}</span>
              <span className="rounded bg-black/15 px-1 py-0.5 backdrop-blur">
                {Math.round(p.ratio)}%
              </span>
            </div>
            <div className="flex flex-col gap-0.5 px-2 pb-2">
              <span className="text-foreground/90 truncate text-xs font-medium">{p.name}</span>
              <span className="text-muted-foreground font-mono text-[10px]">{p.role}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function CopyButton({
  onClick,
  active,
  label,
}: {
  onClick: () => void
  active: boolean
  label: string
}) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="h-7 px-2 text-[11px]">
      {active ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
      {label}
    </Button>
  )
}

function ResultFonts({
  fonts,
  googleFontsLabel,
  label,
}: {
  fonts: FontEntry[]
  googleFontsLabel: string
  label: string
}) {
  return (
    <section className="bg-card/40 border-border/60 flex flex-col gap-3 rounded-lg border p-4">
      <span className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
        {label}
      </span>
      <ul className="flex flex-col gap-2.5">
        {fonts.map((f, i) => (
          <li
            key={i}
            className="border-border/40 flex flex-col gap-1 rounded-md border p-3 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-foreground/90 truncate text-base font-semibold"
                style={{ fontFamily: `'${f.family}', ${f.category}` }}
              >
                {f.family}
              </span>
              <a
                href={`https://fonts.google.com/specimen/${encodeURIComponent(f.family.replace(/\s+/g, "+"))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 font-mono text-[10px]"
              >
                {googleFontsLabel}
                <ExternalLink className="size-2.5" />
              </a>
            </div>
            <span className="text-muted-foreground font-mono text-[10px] uppercase">
              {f.category}
            </span>
            <p className="text-foreground/80 text-xs italic">{f.vibe}</p>
          </li>
        ))}
      </ul>
    </section>
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
            {isKey ? t.tools.byok.needs : t.tools.imagePalette.errorTitle}
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
