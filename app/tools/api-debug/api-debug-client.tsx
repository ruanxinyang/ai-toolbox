"use client"

import { useCallback, useRef, useState } from "react"
import { Code2, Copy, Loader2, Plus, Send, Sparkles, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { HistoryDialog } from "@/components/tools/HistoryDialog"
import { MarkdownView } from "@/components/tools/MarkdownView"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useByok } from "@/hooks/useByok"
import { byokToHeaders } from "@/lib/ai/byok"
import { pushHistory } from "@/lib/history"
import { useI18n } from "@/lib/i18n/client"

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const
type Method = (typeof METHODS)[number]

type HeaderRow = { id: string; key: string; value: string; enabled: boolean }

type ApiResponse = {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  bodyType: "json" | "text" | "binary"
  elapsedMs: number
}

const TARGETS = [
  { value: "curl", label: "curl" },
  { value: "fetch", label: "fetch (JS/TS)" },
  { value: "python", label: "Python (requests)" },
  { value: "ts-axios", label: "TypeScript + axios" },
] as const

type Target = (typeof TARGETS)[number]["value"]

type HistoryInput = {
  method: Method
  url: string
  headers: HeaderRow[]
  body: string
}
type HistoryOutput = {
  response: ApiResponse | null
  snippet: string
}

function newRow(): HeaderRow {
  return { id: crypto.randomUUID(), key: "", value: "", enabled: true }
}

function isJsonContentType(value: string | undefined): boolean {
  return Boolean(value?.toLowerCase().includes("application/json"))
}

function tryFormatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

export function ApiDebugClient() {
  const { t } = useI18n()
  const { byok } = useByok()
  const [method, setMethod] = useState<Method>("GET")
  const [url, setUrl] = useState("https://api.github.com/repos/vercel/next.js")
  const [headers, setHeaders] = useState<HeaderRow[]>([
    { id: crypto.randomUUID(), key: "User-Agent", value: "ai-toolbox/1.0", enabled: true },
  ])
  const [body, setBody] = useState("")
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [target, setTarget] = useState<Target>("curl")
  const [snippet, setSnippet] = useState("")
  const [explaining, setExplaining] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const slug = "api-debug"
  const tool = t.tools.byName[slug]
  const ui = t.tools.apiDebug

  const buildHeaderMap = useCallback((): Record<string, string> => {
    const map: Record<string, string> = {}
    for (const h of headers) {
      if (h.enabled && h.key.trim()) map[h.key.trim()] = h.value
    }
    return map
  }, [headers])

  const send = useCallback(async () => {
    if (!url.trim() || sending) return
    setError(null)
    setResponse(null)
    setSending(true)
    const start = Date.now()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const init: RequestInit = {
        method,
        headers: buildHeaderMap(),
        signal: controller.signal,
      }
      if (method !== "GET" && method !== "HEAD" && body.trim()) {
        init.body = body
      }
      const res = await fetch(url, init)
      const elapsedMs = Date.now() - start
      const resHeaders: Record<string, string> = {}
      res.headers.forEach((v, k) => {
        resHeaders[k] = v
      })
      const contentType = res.headers.get("content-type") ?? ""
      const isJson = isJsonContentType(contentType)
      let bodyText: string
      let bodyType: ApiResponse["bodyType"] = "text"
      if (contentType.startsWith("text/") || isJson || /xml|javascript|html/.test(contentType)) {
        bodyText = await res.text()
        if (isJson) {
          bodyType = "json"
          bodyText = tryFormatJson(bodyText)
        }
      } else {
        const blob = await res.blob()
        bodyText = `[binary · ${blob.type || "unknown"} · ${blob.size} bytes]`
        bodyType = "binary"
      }
      const apiRes: ApiResponse = {
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: bodyText,
        bodyType,
        elapsedMs,
      }
      setResponse(apiRes)
      pushHistory<HistoryInput, HistoryOutput>(slug, {
        title: `${method} ${url.slice(0, 80)}`,
        input: { method, url, headers, body },
        output: { response: apiRes, snippet },
      })
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      setError((err as Error).message || ui.networkErrorMessage)
    } finally {
      setSending(false)
      abortRef.current = null
    }
  }, [url, method, body, sending, buildHeaderMap, headers, snippet, slug, ui])

  const cancel = () => abortRef.current?.abort()

  const explain = useCallback(async () => {
    if (explaining) return
    setExplaining(true)
    setSnippet("")
    try {
      const res = await fetch("/api/api-debug", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...byokToHeaders(byok) },
        body: JSON.stringify({
          request: {
            method,
            url,
            headers: buildHeaderMap(),
            body: body || undefined,
          },
          target,
        }),
      })
      if (!res.ok || !res.body) {
        const payload = (await res.json().catch(() => null)) as {
          error?: { message?: string }
        } | null
        toast.error(ui.generationFailed, { description: payload?.error?.message })
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let received = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        received += decoder.decode(value, { stream: true })
        setSnippet(received)
      }
    } catch (err) {
      toast.error(ui.generationFailed, { description: (err as Error).message })
    } finally {
      setExplaining(false)
    }
  }, [method, url, body, target, byok, buildHeaderMap, explaining, ui])

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
        <div className="grid grid-cols-[120px_1fr_auto_auto] gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as Method)}
            className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-3 font-mono text-sm outline-none focus-visible:ring-2"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={ui.urlPlaceholder}
            className="font-mono text-sm"
          />
          {sending ? (
            <Button variant="outline" onClick={cancel}>
              <X />
              {ui.cancelBtn}
            </Button>
          ) : (
            <Button onClick={send} disabled={!url.trim()}>
              <Send />
              {ui.sendBtn}
            </Button>
          )}
          <HistoryDialog<HistoryInput, HistoryOutput>
            slug={slug}
            onRestore={(entry) => {
              setMethod(entry.input.method)
              setUrl(entry.input.url)
              setHeaders(entry.input.headers)
              setBody(entry.input.body)
              setResponse(entry.output.response)
              setSnippet(entry.output.snippet)
            }}
            renderShareable={(entry) => entry.output.snippet || entry.output.response?.body || ""}
          />
        </div>

        <details className="text-sm">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer">
            {ui.headersToggle(headers.filter((h) => h.enabled && h.key.trim()).length)}
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            {headers.map((h) => (
              <div key={h.id} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2">
                <input
                  type="checkbox"
                  checked={h.enabled}
                  onChange={(e) =>
                    setHeaders((prev) =>
                      prev.map((p) => (p.id === h.id ? { ...p, enabled: e.target.checked } : p)),
                    )
                  }
                  className="accent-primary size-4"
                  aria-label={ui.headerEnableAria}
                />
                <Input
                  value={h.key}
                  onChange={(e) =>
                    setHeaders((prev) =>
                      prev.map((p) => (p.id === h.id ? { ...p, key: e.target.value } : p)),
                    )
                  }
                  placeholder={ui.headerKeyPlaceholder}
                  className="h-8 font-mono text-xs"
                />
                <Input
                  value={h.value}
                  onChange={(e) =>
                    setHeaders((prev) =>
                      prev.map((p) => (p.id === h.id ? { ...p, value: e.target.value } : p)),
                    )
                  }
                  placeholder={ui.headerValuePlaceholder}
                  className="h-8 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setHeaders((prev) => prev.filter((p) => p.id !== h.id))}
                  aria-label={ui.deleteHeaderAria}
                  className="text-muted-foreground hover:text-destructive inline-flex size-7 items-center justify-center rounded-md transition-colors"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHeaders((prev) => [...prev, newRow()])}
              className="self-start"
            >
              <Plus />
              {ui.addHeaderBtn}
            </Button>
          </div>
        </details>

        {method !== "GET" && method !== "HEAD" && (
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={method === "POST" ? ui.bodyPlaceholderPost : ui.bodyPlaceholderOther}
            rows={4}
            maxLength={10_000}
            className="font-mono text-xs"
          />
        )}
      </section>

      {error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-md border p-3 text-sm"
        >
          {error}
        </div>
      )}

      {response && <ResponseView response={response} />}

      <section className="bg-card/40 border-border/60 flex flex-col gap-3 rounded-lg border p-4">
        <header className="flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
            <Code2 className="text-primary size-4" />
            {ui.generateTitle}
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as Target)}
              disabled={explaining}
              className="border-input bg-background focus-visible:ring-ring h-8 rounded-md border px-2 text-xs outline-none focus-visible:ring-2 disabled:opacity-50"
            >
              {TARGETS.map((tg) => (
                <option key={tg.value} value={tg.value}>
                  {tg.label}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={explain} disabled={explaining || !url.trim()}>
              {explaining ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {explaining ? ui.generatingBtn : ui.generateBtn}
            </Button>
          </div>
        </header>
        {snippet ? (
          <MarkdownView text={snippet} />
        ) : (
          <p className="text-muted-foreground text-xs">{ui.generateHint}</p>
        )}
      </section>
    </div>
  )
}

function ResponseView({ response }: { response: ApiResponse }) {
  const { t } = useI18n()
  const ui = t.tools.apiDebug
  const statusTone =
    response.status < 300
      ? "text-emerald-500 border-emerald-500/40 bg-emerald-500/10"
      : response.status < 400
        ? "text-blue-500 border-blue-500/40 bg-blue-500/10"
        : "text-destructive border-destructive/40 bg-destructive/10"

  const copyBody = async () => {
    try {
      await navigator.clipboard.writeText(response.body)
      toast.success(ui.copyBodySuccess)
    } catch {
      toast.error(ui.copyError)
    }
  }

  return (
    <section className="bg-card/40 border-border/60 flex flex-col overflow-hidden rounded-lg border">
      <header className="border-border/60 bg-muted/40 flex items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className={`rounded border px-2 py-0.5 font-semibold ${statusTone}`}>
            {response.status} {response.statusText || ""}
          </span>
          <span className="text-muted-foreground">{response.elapsedMs}ms</span>
          <span className="text-muted-foreground">{response.bodyType}</span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={copyBody}
          aria-label={ui.copyResponseAria}
        >
          <Copy />
        </Button>
      </header>
      <details className="border-border/40 border-b">
        <summary className="text-muted-foreground hover:text-foreground cursor-pointer px-3 py-2 text-xs">
          {ui.responseHeaders(Object.keys(response.headers).length)}
        </summary>
        <ul className="divide-border/30 divide-y px-3 pb-2 font-mono text-[11px]">
          {Object.entries(response.headers).map(([k, v]) => (
            <li key={k} className="grid grid-cols-[1fr_2fr] gap-2 py-1.5">
              <span className="text-muted-foreground truncate">{k}:</span>
              <span className="text-foreground/90 truncate">{v}</span>
            </li>
          ))}
        </ul>
      </details>
      <pre className="text-foreground/90 max-h-[400px] overflow-auto p-4 font-mono text-xs whitespace-pre-wrap">
        {response.body || "(empty)"}
      </pre>
    </section>
  )
}
