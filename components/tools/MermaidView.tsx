"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"

type MermaidModule = (typeof import("mermaid"))["default"]

let mermaidPromise: Promise<MermaidModule> | null = null
let lastTheme: "dark" | "default" | null = null

async function getMermaid(theme: "dark" | "default"): Promise<MermaidModule> {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => m.default)
  }
  const mermaid = await mermaidPromise
  if (lastTheme !== theme) {
    mermaid.initialize({
      startOnLoad: false,
      theme,
      securityLevel: "strict",
      fontFamily: "var(--font-sans), system-ui, sans-serif",
    })
    lastTheme = theme
  }
  return mermaid
}

let renderCounter = 0

export function MermaidView({ code }: { code: string }) {
  const { resolvedTheme } = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [renderedSvg, setRenderedSvg] = useState<string | null>(null)

  useEffect(() => {
    if (!code.trim()) return
    let cancelled = false
    const theme: "dark" | "default" = resolvedTheme === "light" ? "default" : "dark"
    const id = `mermaid-${++renderCounter}`

    void getMermaid(theme)
      .then((mermaid) => mermaid.render(id, code))
      .then(({ svg }) => {
        if (!cancelled) {
          setRenderedSvg(svg)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.warn("[mermaid] render failed:", err)
          setError((err as Error)?.message ?? "Mermaid 渲染失败")
          setRenderedSvg(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [code, resolvedTheme])

  if (!code.trim()) {
    return <div className="text-muted-foreground p-6 text-center text-sm">无思维导图数据</div>
  }

  if (error) {
    return (
      <div className="border-destructive/30 bg-destructive/5 flex flex-col gap-2 rounded-md border p-4 text-sm">
        <p className="text-destructive font-medium">思维导图渲染失败</p>
        <p className="text-muted-foreground text-xs">{error}</p>
        <details className="text-xs">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer">
            查看原始 Mermaid 代码
          </summary>
          <pre className="text-foreground/80 mt-2 overflow-auto font-mono text-[10px] whitespace-pre-wrap">
            {code}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="overflow-auto p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={renderedSvg ? { __html: renderedSvg } : undefined}
    >
      {!renderedSvg && <p className="text-muted-foreground text-center text-sm">渲染中…</p>}
    </div>
  )
}
