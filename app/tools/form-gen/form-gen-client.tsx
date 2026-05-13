"use client"

import dynamic from "next/dynamic"
import { useCallback, useMemo, useState } from "react"
import { AlertCircle, Copy, Download, KeyRound, Loader2, Sparkles, X } from "lucide-react"
import { toast } from "sonner"

import { BYOKDialog } from "@/components/BYOKDialog"
import { HistoryDialog } from "@/components/tools/HistoryDialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useByok } from "@/hooks/useByok"
import { byokToHeaders } from "@/lib/ai/byok"
import { MODELS } from "@/lib/ai/models"
import { pushHistory } from "@/lib/history"
import { useI18n } from "@/lib/i18n/client"

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

const DEFAULT_MODEL = "anthropic:claude-sonnet-4-6"

type Field = {
  name: string
  label: string
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "tel"
    | "url"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "date"
  required: boolean
  placeholder?: string | null
  zod: string
  options?: Array<{ value: string; label: string }> | null
}

type Result = {
  title: string
  submitLabel: string
  fields: Field[]
  notes: string
}

type ApiErrorPayload = { code?: string; message?: string }
type HistoryInput = { description: string; modelId: string }
type HistoryOutput = Result

function fieldsToCode(result: Result): string {
  const zodLines = result.fields
    .map((f) => {
      let expr = f.zod
      if (!f.required && !/optional\(/.test(expr)) expr = `${expr}.optional()`
      return `  ${f.name}: ${expr},`
    })
    .join("\n")

  const inputs = result.fields
    .map((f) => {
      const idAttr = `id="${f.name}"`
      const reg = `{...register("${f.name}")}`
      const placeholder = f.placeholder ? ` placeholder=${JSON.stringify(f.placeholder)}` : ""
      const requiredMark = f.required ? ' <span className="text-red-500">*</span>' : ""
      const label = `<label htmlFor="${f.name}" className="text-sm font-medium">${f.label}${requiredMark}</label>`
      const err = `{errors.${f.name} && <p className="text-xs text-red-500">{String(errors.${f.name}.message)}</p>}`

      if (f.type === "textarea") {
        return `      <div className="flex flex-col gap-1">\n        ${label}\n        <textarea ${idAttr} ${reg}${placeholder} className="border rounded px-3 py-2 text-sm" rows={3} />\n        ${err}\n      </div>`
      }
      if (f.type === "select" && f.options) {
        const opts = f.options
          .map((o) => `          <option value=${JSON.stringify(o.value)}>${o.label}</option>`)
          .join("\n")
        return `      <div className="flex flex-col gap-1">\n        ${label}\n        <select ${idAttr} ${reg} className="border rounded px-3 py-2 text-sm">\n${opts}\n        </select>\n        ${err}\n      </div>`
      }
      if (f.type === "checkbox") {
        return `      <label className="flex items-center gap-2 text-sm">\n        <input type="checkbox" ${idAttr} ${reg} />\n        <span>${f.label}</span>\n        ${err}\n      </label>`
      }
      if (f.type === "radio" && f.options) {
        const opts = f.options
          .map(
            (o) =>
              `          <label className="flex items-center gap-1 text-sm"><input type="radio" value=${JSON.stringify(o.value)} ${reg} />${o.label}</label>`,
          )
          .join("\n")
        return `      <fieldset className="flex flex-col gap-1">\n        <legend className="text-sm font-medium">${f.label}${requiredMark}</legend>\n        <div className="flex flex-wrap gap-3 pt-1">\n${opts}\n        </div>\n        ${err}\n      </fieldset>`
      }
      return `      <div className="flex flex-col gap-1">\n        ${label}\n        <input type="${f.type}" ${idAttr} ${reg}${placeholder} className="border rounded px-3 py-2 text-sm" />\n        ${err}\n      </div>`
    })
    .join("\n\n")

  return `import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
${zodLines}
})

type FormValues = z.infer<typeof schema>

export default function App() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  return (
    <form
      onSubmit={handleSubmit((data) => {
        alert(JSON.stringify(data, null, 2))
      })}
      className="flex flex-col gap-4 max-w-md mx-auto p-6 bg-white rounded-lg shadow"
    >
      <h2 className="text-lg font-semibold">${result.title}</h2>

${inputs}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-violet-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
      >
        ${result.submitLabel}
      </button>
    </form>
  )
}
`
}

export function FormGenClient() {
  const { t } = useI18n()
  const { byok } = useByok()
  const [description, setDescription] = useState("")
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL)
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiErrorPayload | null>(null)
  const slug = "form-gen"
  const tool = t.tools.byName[slug]
  const ui = t.tools.formGen

  const code = useMemo(() => (result ? fieldsToCode(result) : ""), [result])

  const submit = useCallback(async () => {
    if (!description.trim() || loading) return
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const res = await fetch("/api/form-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...byokToHeaders(byok) },
        body: JSON.stringify({ description: description.trim(), modelId }),
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
        input: { description: description.trim(), modelId },
        output: payload,
      })
    } catch (err) {
      toast.error(t.tools.errors.generic, { description: (err as Error).message })
    } finally {
      setLoading(false)
    }
  }, [description, modelId, loading, byok, slug, t, tool.name])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success(ui.copySuccess)
    } catch {
      toast.error(ui.copyError)
    }
  }

  const download = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "App.tsx"
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

      <section className="bg-card/40 border-border/60 flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex flex-wrap gap-1.5">
          {ui.examples.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={loading}
              onClick={() => setDescription(ex)}
              className="border-border/60 bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-40"
            >
              {ex.slice(0, 24)}…
            </button>
          ))}
        </div>

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          placeholder={ui.placeholder}
          rows={4}
          maxLength={2000}
          className="resize-none"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            disabled={loading}
            aria-label={t.tools.forms.modelLabel}
            className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <HistoryDialog<HistoryInput, HistoryOutput>
              slug={slug}
              onRestore={(entry) => {
                setDescription(entry.input.description)
                setModelId(entry.input.modelId)
                setResult(entry.output)
              }}
              renderShareable={(entry) => fieldsToCode(entry.output)}
            />
            <Button onClick={submit} disabled={!description.trim() || loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {loading ? ui.loadingBtn : result ? ui.regenerateBtn : ui.submitBtn}
            </Button>
          </div>
        </div>
      </section>

      {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

      {loading && !result && <Skeleton className="h-64 w-full" />}

      {result && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="bg-card/40 border-border/60 flex flex-col overflow-hidden rounded-lg border">
            <header className="border-border/60 bg-muted/40 flex h-9 items-center justify-between border-b px-3">
              <span className="text-muted-foreground font-mono text-xs">
                {ui.filesCount(result.fields.length)}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={copy}
                  aria-label={t.tools.actions.copy}
                >
                  <Copy />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={download}
                  aria-label={t.tools.actions.download}
                >
                  <Download />
                </Button>
              </div>
            </header>
            <pre className="text-foreground/90 max-h-[420px] overflow-auto p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
              {code}
            </pre>
            <p className="border-border/40 text-muted-foreground border-t p-3 text-xs italic">
              {result.notes}
            </p>
          </div>
          <div className="bg-card/40 border-border/60 flex flex-col overflow-hidden rounded-lg border">
            <header className="border-border/60 bg-muted/40 flex h-9 items-center border-b px-3">
              <span className="text-muted-foreground font-mono text-xs">{ui.previewLabel}</span>
            </header>
            <div className="h-[420px]">
              <LivePreview code={code} />
            </div>
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
            {isKey ? t.tools.byok.needs : t.tools.formGen.errorTitle}
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
