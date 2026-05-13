"use client"

import { useCallback, useState } from "react"
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  KeyRound,
  Loader2,
  Sparkles,
  User,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { BYOKDialog } from "@/components/BYOKDialog"
import { HistoryDialog } from "@/components/tools/HistoryDialog"
import { VideoUploader, type VideoFile } from "@/components/tools/VideoUploader"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useByok } from "@/hooks/useByok"
import { byokToHeaders } from "@/lib/ai/byok"
import { pushHistory } from "@/lib/history"
import { useI18n } from "@/lib/i18n/client"

type ApiErrorPayload = { code?: string; message?: string }

type Result = {
  title: string
  tldr: string
  chapters: Array<{ timestamp: string; title: string; summary: string }>
  keyPoints: string[]
  actionItems: Array<{ owner: string; task: string; deadline: string | null }>
}

type Language = "auto" | "zh" | "en"
const LANGUAGE_KEYS: Language[] = ["auto", "zh", "en"]

type HistoryInput = { fileName: string; fileSize: number; language: Language }
type HistoryOutput = Result

export function VideoNotesClient() {
  const { t } = useI18n()
  const { byok } = useByok()
  const [file, setFile] = useState<VideoFile | null>(null)
  const [language, setLanguage] = useState<Language>("auto")
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiErrorPayload | null>(null)
  const slug = "video-notes"
  const tool = t.tools.byName[slug]
  const ui = t.tools.videoNotes

  const submit = useCallback(async () => {
    if (!file || loading) return
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const res = await fetch("/api/video-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...byokToHeaders(byok) },
        body: JSON.stringify({ video: file.dataUrl, language }),
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
        title: payload.title || file.name,
        input: { fileName: file.name, fileSize: file.size, language },
        output: payload,
      })
    } catch (err) {
      toast.error(t.tools.errors.generic, { description: (err as Error).message })
    } finally {
      setLoading(false)
    }
  }, [file, language, loading, byok, t, slug])

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-2">
        <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          / {slug}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tool.name}</h1>
        <p className="text-muted-foreground text-balance">{tool.description}</p>
      </header>

      <VideoUploader file={file} onFile={setFile} />

      <div className="grid grid-cols-[1fr_auto_auto] gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-foreground font-medium">{ui.outputLanguageLabel}</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            disabled={loading}
            className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {LANGUAGE_KEYS.map((key) => (
              <option key={key} value={key}>
                {ui.languages[key]}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={submit} disabled={!file || loading} className="self-end">
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {loading ? ui.loadingBtn : result ? ui.regenerateBtn : ui.submitBtn}
        </Button>
        <div className="self-end">
          <HistoryDialog<HistoryInput, HistoryOutput>
            slug={slug}
            onRestore={(entry) => {
              setLanguage(entry.input.language)
              setResult(entry.output)
            }}
            renderShareable={(entry) => `${entry.output.title}\n\n${entry.output.tldr}`}
          />
        </div>
      </div>

      {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

      {loading && !result && (
        <div
          role="status"
          aria-live="polite"
          className="bg-card/40 border-border/60 flex flex-col gap-4 rounded-lg border p-6"
        >
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {[100, 90, 85, 70].map((w, i) => (
              <Skeleton key={i} className="h-3" style={{ maxWidth: `${w}%` }} />
            ))}
          </div>
          <p className="text-muted-foreground mt-1 text-center font-mono text-[10px] tracking-widest uppercase">
            {ui.pipelineCaption}
          </p>
        </div>
      )}

      {result && <ResultView result={result} />}
    </div>
  )
}

function ResultView({ result }: { result: Result }) {
  const { t } = useI18n()
  const ui = t.tools.videoNotes
  return (
    <article className="bg-card/40 border-border/60 flex flex-col gap-4 rounded-lg border p-5">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">{result.title}</h2>
        <p className="text-muted-foreground text-sm">{result.tldr}</p>
      </header>

      <Tabs defaultValue="chapters" className="gap-3">
        <TabsList>
          <TabsTrigger value="chapters">
            <Clock />
            {ui.tabs.chapters} ({result.chapters.length})
          </TabsTrigger>
          <TabsTrigger value="points">
            <FileText />
            {ui.tabs.points}
          </TabsTrigger>
          <TabsTrigger value="actions">
            <CheckCircle2 />
            {ui.tabs.actions} ({result.actionItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chapters">
          <ol className="border-border/40 divide-border/40 divide-y border-l-2 pl-4">
            {result.chapters.map((c, i) => (
              <li key={i} className="flex flex-col gap-1 py-3">
                <div className="flex items-baseline gap-3">
                  <span className="bg-primary/15 text-primary inline-flex shrink-0 rounded px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums">
                    {c.timestamp}
                  </span>
                  <h3 className="font-semibold tracking-tight">{c.title}</h3>
                </div>
                <p className="text-muted-foreground pl-1 text-sm">{c.summary}</p>
              </li>
            ))}
          </ol>
        </TabsContent>

        <TabsContent value="points">
          <ul className="flex flex-col gap-2 text-sm">
            {result.keyPoints.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="bg-primary/15 text-primary mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold">
                  {i + 1}
                </span>
                <span className="text-foreground/90">{b}</span>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="actions">
          {result.actionItems.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">{ui.noActionItems}</p>
          ) : (
            <ul className="divide-border/40 divide-y">
              {result.actionItems.map((item, i) => (
                <li key={i} className="flex flex-col gap-1 py-3 text-sm">
                  <span className="text-foreground/90">{item.task}</span>
                  <div className="text-muted-foreground flex items-center gap-3 font-mono text-[10px]">
                    <span className="inline-flex items-center gap-1">
                      <User className="size-3" />
                      {item.owner}
                    </span>
                    {item.deadline && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="size-3" />
                        {item.deadline}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </article>
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
            {isKey ? t.tools.videoNotes.errorTitleKey : t.tools.videoNotes.errorTitle}
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
