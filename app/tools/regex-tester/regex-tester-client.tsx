"use client"

import { Fragment, useCallback, useMemo, useState } from "react"
import { AlertCircle, Copy, Regex, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { HistoryDialog } from "@/components/tools/HistoryDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { pushHistory } from "@/lib/history"
import { useI18n } from "@/lib/i18n/client"

const FLAG_KEYS = ["g", "i", "m", "s", "u", "y"] as const
type FlagKey = (typeof FLAG_KEYS)[number]

const MAX_MATCHES = 5_000

type Match = {
  index: number
  end: number
  text: string
  groups: string[]
}

const EXAMPLES = {
  email: {
    pattern: "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}",
    flags: "g" as const,
    sample:
      "Contact us at hello@example.com or sales@acme.co.uk.\nNot an email: foo@bar (no TLD).\nMixed: alice+work@startup.io meeting tomorrow.",
  },
  url: {
    pattern: "https?://[^\\s]+",
    flags: "g" as const,
    sample:
      "Read https://nextjs.org/docs and http://example.com for context.\nGitHub: https://github.com/vercel/next.js",
  },
  date: {
    pattern: "(\\d{4})-(\\d{2})-(\\d{2})",
    flags: "g" as const,
    sample:
      "Releases: 2026-01-15, 2026-03-22 and 2026-05-13.\nInvalid: 26-01-15 (not 4-digit year).",
  },
  chinese: {
    pattern: "[\\u4e00-\\u9fa5]+",
    flags: "g" as const,
    sample: "Mixed text: Hello 你好 world 世界! 这是 a sentence with 中文 chars.",
  },
} as const

type HistoryInput = {
  pattern: string
  flags: string
  sample: string
  replacement: string
}
type HistoryOutput = { matches: number; replaced: string }

export function RegexTesterClient() {
  const { t } = useI18n()
  const [pattern, setPattern] = useState("")
  const [flags, setFlags] = useState<string>("g")
  const [sample, setSample] = useState("")
  const [replacement, setReplacement] = useState("")
  const slug = "regex-tester"
  const tool = t.tools.byName[slug]
  const ui = t.tools.regexTester

  const { regex, error } = useMemo(() => {
    if (!pattern) return { regex: null as RegExp | null, error: null as string | null }
    try {
      return { regex: new RegExp(pattern, flags), error: null }
    } catch (err) {
      return { regex: null, error: (err as Error).message }
    }
  }, [pattern, flags])

  const matches = useMemo<Match[]>(() => {
    if (!regex || !sample) return []
    const out: Match[] = []
    if (!flags.includes("g")) {
      const m = regex.exec(sample)
      if (m) {
        out.push({
          index: m.index,
          end: m.index + m[0].length,
          text: m[0],
          groups: m.slice(1).map((g) => g ?? ""),
        })
      }
      return out
    }
    // Global flag: matchAll handles zero-width safely
    let count = 0
    for (const m of sample.matchAll(regex)) {
      if (m.index === undefined) continue
      out.push({
        index: m.index,
        end: m.index + m[0].length,
        text: m[0],
        groups: m.slice(1).map((g) => g ?? ""),
      })
      count++
      if (count >= MAX_MATCHES) break
    }
    return out
  }, [regex, sample, flags])

  const replaced = useMemo(() => {
    if (!regex || !sample) return ""
    try {
      return sample.replace(regex, replacement)
    } catch {
      return ""
    }
  }, [regex, sample, replacement])

  const toggleFlag = (key: FlagKey) => {
    setFlags((prev) => (prev.includes(key) ? prev.replace(key, "") : prev + key))
  }

  const onApplyExample = useCallback(
    (key: keyof typeof EXAMPLES) => {
      const ex = EXAMPLES[key]
      setPattern(ex.pattern)
      setFlags(ex.flags)
      setSample(ex.sample)
      setReplacement("")
      if (pattern || sample) {
        pushHistory<HistoryInput, HistoryOutput>(slug, {
          title: `${ui.examples[key]} · ${ex.pattern.slice(0, 40)}`,
          input: { pattern: ex.pattern, flags: ex.flags, sample: ex.sample, replacement: "" },
          output: { matches: 0, replaced: "" },
        })
      }
    },
    [pattern, sample, slug, ui],
  )

  const handleCopyReplaced = async () => {
    if (!replaced) return
    try {
      await navigator.clipboard.writeText(replaced)
      toast.success(t.tools.actions.copy)
      pushHistory<HistoryInput, HistoryOutput>(slug, {
        title: pattern.slice(0, 60) || tool.name,
        input: { pattern, flags, sample, replacement },
        output: { matches: matches.length, replaced },
      })
    } catch {
      toast.error(t.tools.errors.generic)
    }
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

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(EXAMPLES) as Array<keyof typeof EXAMPLES>).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onApplyExample(key)}
            className="border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors"
          >
            <Sparkles className="size-3" />
            {ui.examples[key]}
          </button>
        ))}
      </div>

      <div className="bg-card/40 border-border/60 flex flex-col gap-3 rounded-lg border p-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-foreground font-medium">{ui.patternLabel}</span>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder={ui.patternPlaceholder}
              className="font-mono text-xs"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
            />
            <div className="border-input bg-background inline-flex h-9 items-center gap-0 rounded-md border px-2 font-mono text-xs">
              <span className="text-muted-foreground mr-1">/</span>
              {FLAG_KEYS.map((flag) => (
                <button
                  key={flag}
                  type="button"
                  onClick={() => toggleFlag(flag)}
                  aria-pressed={flags.includes(flag)}
                  className={`hover:text-primary inline-flex size-6 items-center justify-center rounded ${
                    flags.includes(flag)
                      ? "bg-primary/15 text-primary font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {flag}
                </button>
              ))}
            </div>
          </div>
          <span className="text-muted-foreground font-mono text-[10px]">
            {ui.flagsLabel}: {ui.flagsHint}
          </span>
        </label>

        {error && (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/5 flex items-start gap-2 rounded-md border p-3 text-sm"
          >
            <AlertCircle className="text-destructive mt-0.5 size-4 shrink-0" />
            <div className="flex-1">
              <p className="text-foreground font-medium">{ui.invalidRegex}</p>
              <p className="text-muted-foreground mt-0.5 font-mono text-xs">{error}</p>
            </div>
          </div>
        )}

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-foreground font-medium">{ui.sampleLabel}</span>
          <Textarea
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            placeholder={ui.samplePlaceholder}
            rows={8}
            maxLength={50_000}
            className="font-mono text-xs"
            spellCheck={false}
          />
        </label>
      </div>

      <section className="bg-card/40 border-border/60 flex flex-col overflow-hidden rounded-lg border">
        <header className="border-border/60 bg-muted/40 flex h-9 items-center justify-between border-b px-3">
          <span className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-xs">
            <Regex className="size-3.5" />
            {regex && sample ? ui.summary(matches.length) : ui.noMatch}
          </span>
          <HistoryDialog<HistoryInput, HistoryOutput>
            slug={slug}
            onRestore={(entry) => {
              setPattern(entry.input.pattern)
              setFlags(entry.input.flags)
              setSample(entry.input.sample)
              setReplacement(entry.input.replacement)
            }}
            renderShareable={(entry) =>
              `/${entry.input.pattern}/${entry.input.flags}\n\n${entry.input.sample}`
            }
          />
        </header>
        <div className="p-4">
          <HighlightedView sample={sample} matches={matches} />
        </div>
      </section>

      {matches.length > 0 && matches[0].groups.length > 0 && (
        <section className="bg-card/40 border-border/60 flex flex-col overflow-hidden rounded-lg border">
          <header className="border-border/60 bg-muted/40 flex h-9 items-center border-b px-3">
            <span className="text-muted-foreground font-mono text-xs">{ui.groupsLabel}</span>
          </header>
          <ul className="divide-border/40 max-h-72 divide-y overflow-y-auto">
            {matches.slice(0, 50).map((m, i) => (
              <li key={i} className="flex flex-col gap-1 px-3 py-2 text-sm">
                <div className="text-muted-foreground font-mono text-[10px]">
                  [{m.index}, {m.end}) → {JSON.stringify(m.text)}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {m.groups.map((g, gi) => (
                    <span
                      key={gi}
                      className="border-border/60 bg-background/40 inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono"
                    >
                      <span className="text-muted-foreground">{ui.groupIndex(gi + 1)}:</span>
                      <span className="text-foreground/90">{JSON.stringify(g)}</span>
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-card/40 border-border/60 flex flex-col gap-3 rounded-lg border p-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-foreground font-medium">{ui.replaceLabel}</span>
          <Input
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder={ui.replacePlaceholder}
            className="font-mono text-xs"
            spellCheck={false}
          />
        </label>
        {regex && sample && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-mono text-xs">
                {ui.replaceResultLabel}
              </span>
              <Button variant="ghost" size="sm" onClick={handleCopyReplaced} disabled={!replaced}>
                <Copy />
                {ui.copyResult}
              </Button>
            </div>
            <pre className="bg-background/40 border-border/40 text-foreground/90 max-h-72 overflow-auto rounded-md border p-3 font-mono text-xs whitespace-pre-wrap">
              {replaced}
            </pre>
          </div>
        )}
      </section>
    </div>
  )
}

function HighlightedView({ sample, matches }: { sample: string; matches: Match[] }) {
  if (!sample) {
    return <p className="text-muted-foreground py-6 text-center font-mono text-xs">—</p>
  }
  if (matches.length === 0) {
    return (
      <pre className="text-foreground/80 font-mono text-xs whitespace-pre-wrap">{sample}</pre>
    )
  }
  const chunks: Array<{ text: string; matched: boolean }> = []
  let cursor = 0
  for (const m of matches) {
    if (m.index > cursor) chunks.push({ text: sample.slice(cursor, m.index), matched: false })
    chunks.push({ text: m.text || "‹empty›", matched: true })
    cursor = m.end
  }
  if (cursor < sample.length) chunks.push({ text: sample.slice(cursor), matched: false })

  return (
    <pre className="text-foreground/90 font-mono text-xs whitespace-pre-wrap">
      {chunks.map((c, i) => (
        <Fragment key={i}>
          {c.matched ? (
            <mark className="bg-primary/20 text-primary rounded px-0.5 py-px">{c.text}</mark>
          ) : (
            c.text
          )}
        </Fragment>
      ))}
    </pre>
  )
}
