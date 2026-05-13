"use client"

import { useCallback, useMemo, useState } from "react"
import { AlertCircle, Braces, Copy, Download, Sparkles, X } from "lucide-react"
import { toast } from "sonner"

import { HistoryDialog } from "@/components/tools/HistoryDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { pushHistory } from "@/lib/history"
import { useI18n } from "@/lib/i18n/client"
import { convert, type ConvertTarget } from "@/lib/json-convert"

const TARGETS: ConvertTarget[] = ["typescript", "zod", "yaml", "json5"]

const EXAMPLES: Record<"simple" | "nested" | "arrays", string> = {
  simple: '{\n  "id": 1,\n  "name": "Ada",\n  "active": true\n}',
  nested:
    '{\n  "user": {\n    "id": 42,\n    "profile": { "email": "a@b.com", "verified": true },\n    "tags": ["admin", "active"]\n  },\n  "createdAt": "2026-01-15T08:00:00Z"\n}',
  arrays:
    '[\n  { "id": 1, "title": "First", "score": 95 },\n  { "id": 2, "title": "Second", "score": 87 },\n  { "id": 3, "title": "Third", "score": null }\n]',
}

const EXTENSION: Record<ConvertTarget, string> = {
  typescript: "ts",
  zod: "ts",
  yaml: "yml",
  json5: "json",
}

type HistoryInput = { source: string; target: ConvertTarget; rootName: string }
type HistoryOutput = { result: string }

export function JsonConvertClient() {
  const { t } = useI18n()
  const [source, setSource] = useState("")
  const [target, setTarget] = useState<ConvertTarget>("typescript")
  const [rootName, setRootName] = useState("Root")
  const slug = "json-convert"
  const tool = t.tools.byName[slug]
  const ui = t.tools.jsonConvert

  const { output, error } = useMemo(() => {
    if (!source.trim()) return { output: "", error: null as string | null }
    try {
      const parsed = JSON.parse(source) as Parameters<typeof convert>[0]
      const safeRoot = rootName.match(/^[A-Za-z_][A-Za-z0-9_]*$/) ? rootName : "Root"
      return { output: convert(parsed, target, safeRoot), error: null as string | null }
    } catch (err) {
      return { output: "", error: (err as Error).message }
    }
  }, [source, target, rootName])

  const handleCopy = useCallback(async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      toast.success(ui.copySuccess)
      if (source.trim()) {
        pushHistory<HistoryInput, HistoryOutput>(slug, {
          title: `${target} · ${source.split("\n")[0].slice(0, 60)}`,
          input: { source, target, rootName },
          output: { result: output },
        })
      }
    } catch {
      toast.error(ui.copyError)
    }
  }, [output, source, target, rootName, ui, slug])

  const handleDownload = useCallback(() => {
    if (!output) return
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${rootName || "output"}.${EXTENSION[target]}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [output, rootName, target])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:py-10">
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
            / {slug}
          </span>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{tool.name}</h1>
          <p className="text-muted-foreground text-sm text-balance">{tool.description}</p>
        </header>

        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(EXAMPLES) as Array<keyof typeof EXAMPLES>).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSource(EXAMPLES[key])}
              className="border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors"
            >
              <Sparkles className="size-3" />
              {ui.examples[key]}
            </button>
          ))}
        </div>

        <Textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder={ui.placeholder}
          rows={14}
          className="font-mono text-xs"
          spellCheck={false}
        />
        <span className="text-muted-foreground text-right font-mono text-[10px]">
          {ui.charCount(source.length)}
        </span>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground font-medium">{ui.targetLabel}</span>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as ConvertTarget)}
              className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
            >
              {TARGETS.map((tg) => (
                <option key={tg} value={tg}>
                  {ui.targets[tg]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground font-medium">{ui.rootNameLabel}</span>
            <Input
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              maxLength={48}
              className="h-9 font-mono text-xs"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleCopy} disabled={!output}>
            <Copy />
            {ui.copyBtn}
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={!output}>
            <Download />
            {ui.downloadBtn}
          </Button>
          <HistoryDialog<HistoryInput, HistoryOutput>
            slug={slug}
            onRestore={(entry) => {
              setSource(entry.input.source)
              setTarget(entry.input.target)
              setRootName(entry.input.rootName)
            }}
            renderShareable={(entry) => entry.output.result}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/5 flex items-start gap-2 rounded-md border p-3 text-sm"
          >
            <AlertCircle className="text-destructive mt-0.5 size-4 shrink-0" />
            <div className="flex-1">
              <p className="text-foreground font-medium">{ui.parseError}</p>
              <p className="text-muted-foreground mt-0.5 font-mono text-xs">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setSource("")}
              className="text-muted-foreground hover:text-foreground"
              aria-label={t.common.close}
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </section>

      <section className="bg-card/40 border-border/60 flex min-h-[400px] flex-col overflow-hidden rounded-lg border">
        <header className="border-border/60 bg-muted/40 flex h-9 items-center justify-between border-b px-3">
          <span className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-xs">
            <Braces className="size-3.5" />
            {ui.targets[target]} · {rootName || "Root"}.{EXTENSION[target]}
          </span>
        </header>
        <div className="flex-1 overflow-auto">
          {output ? (
            <pre className="text-foreground/90 p-4 font-mono text-xs whitespace-pre-wrap">
              {output}
            </pre>
          ) : (
            <p className="text-muted-foreground py-12 text-center text-sm">{ui.outputEmpty}</p>
          )}
        </div>
      </section>
    </div>
  )
}
