"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Copy, Download, RotateCcw, Share2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

type HighlighterLike = {
  codeToHtml: (
    code: string,
    opts: { lang: string; themes: { light: string; dark: string } },
  ) => string
}

let highlighterPromise: Promise<HighlighterLike> | null = null

async function getHighlighter(): Promise<HighlighterLike> {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then((mod) =>
      mod.createHighlighter({
        themes: ["github-dark-dimmed", "github-light"],
        langs: ["tsx"],
      }),
    )
  }
  return highlighterPromise
}

export function CodeStreamView({
  code,
  streaming,
  onRetry,
  onShare,
}: {
  code: string
  streaming: boolean
  onRetry?: () => void
  onShare?: () => void
}) {
  // Pair the highlighted HTML with the code it was generated for, so a
  // re-stream automatically falls back to raw text without a sync setState
  // (React 19.2 `set-state-in-effect` rule).
  const [highlighted, setHighlighted] = useState<{ code: string; html: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  // Auto-scroll to bottom while streaming.
  useEffect(() => {
    if (streaming && preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight
    }
  }, [code, streaming])

  // Highlight once stream completes.
  useEffect(() => {
    if (streaming || !code) return
    let cancelled = false
    void getHighlighter()
      .then((h) =>
        h.codeToHtml(code, {
          lang: "tsx",
          themes: { light: "github-light", dark: "github-dark-dimmed" },
        }),
      )
      .then((html) => {
        if (!cancelled) setHighlighted({ code, html })
      })
      .catch((err) => {
        console.warn("[shiki] highlight failed:", err)
      })
    return () => {
      cancelled = true
    }
  }, [code, streaming])

  const highlightedHtml = highlighted?.code === code ? highlighted.html : null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast.success("已复制")
    } catch {
      toast.error("复制失败")
    }
  }

  const handleDownload = () => {
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

  const hasContent = code.length > 0

  return (
    <div className="bg-card/40 border-border/60 flex h-full min-h-[320px] flex-col overflow-hidden rounded-lg border">
      <div className="border-border/60 bg-muted/40 flex h-9 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono text-xs">App.tsx</span>
          {streaming && (
            <span className="text-primary inline-flex items-center gap-1 font-mono text-[10px] uppercase">
              <span className="bg-primary size-1.5 animate-pulse rounded-full" />
              streaming
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onRetry && hasContent && !streaming && (
            <Button variant="ghost" size="icon-xs" onClick={onRetry} aria-label="重试">
              <RotateCcw />
            </Button>
          )}
          {onShare && hasContent && !streaming && (
            <Button variant="ghost" size="icon-xs" onClick={onShare} aria-label="分享代码">
              <Share2 />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleCopy}
            disabled={!hasContent}
            aria-label="复制代码"
          >
            {copied ? <Check /> : <Copy />}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleDownload}
            disabled={!hasContent}
            aria-label="下载 App.tsx"
          >
            <Download />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {hasContent ? (
          highlightedHtml ? (
            <div
              className="[&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-xs"
              // Shiki-generated HTML is trusted (we produced it locally).
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          ) : (
            <pre
              ref={preRef}
              className="text-foreground/90 m-0 max-h-full overflow-auto p-4 font-mono text-xs whitespace-pre-wrap"
            >
              {code}
            </pre>
          )
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <p className="text-muted-foreground text-sm">上传截图后，生成的代码会在这里流式输出</p>
          </div>
        )}
      </div>
    </div>
  )
}
