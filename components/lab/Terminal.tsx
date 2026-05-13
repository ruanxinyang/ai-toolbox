"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"

import { useI18n } from "@/lib/i18n/client"
import { siteConfig, tools } from "@/lib/site"

type Line = { kind: "prompt" | "out" | "err"; text: string }

export function Terminal() {
  const { setTheme } = useTheme()
  const { t } = useI18n()
  const term = t.lab.terminal
  const [history, setHistory] = useState<Line[]>([
    { kind: "out", text: term.welcome(siteConfig.name) },
  ])
  const [input, setInput] = useState("")
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [history])

  const runCommand = (raw: string) => {
    const trimmed = raw.trim()
    const next: Line[] = [...history, { kind: "prompt", text: trimmed }]
    if (!trimmed) {
      setHistory(next)
      return
    }
    setCmdHistory((prev) => [...prev, trimmed].slice(-50))

    const [cmd, ...rest] = trimmed.split(/\s+/)
    const args = rest.join(" ")

    switch (cmd) {
      case "help":
        next.push({ kind: "out", text: term.help })
        break
      case "whoami":
        next.push({ kind: "out", text: term.whoami })
        break
      case "ls":
        if (rest[0] === "projects") {
          next.push({
            kind: "out",
            text: tools.map((tool) => `  ${tool.slug.padEnd(22)} ${tool.name}`).join("\n"),
          })
        } else {
          next.push({ kind: "out", text: term.lsDefault })
        }
        break
      case "cat":
        if (rest[0] === "README") {
          const readme = [
            siteConfig.name,
            siteConfig.description,
            "",
            `${term.readmeToolsLabel}: ${tools
              .slice(0, 3)
              .map((tl) => tl.name)
              .join(" / ")}`,
            `${term.readmeStackLabel}:  ${term.readmeStackValue}`,
            `${term.readmePrinciplesLabel}: ${term.readmePrinciplesValue}`,
            term.readmeFooter(siteConfig.githubUrl),
          ].join("\n")
          next.push({ kind: "out", text: readme })
        } else {
          next.push({ kind: "err", text: term.catNotFound(args || term.catEmpty) })
        }
        break
      case "tools":
        if (typeof window !== "undefined") window.location.href = "/tools"
        next.push({ kind: "out", text: term.toolsJumping })
        break
      case "github":
        if (typeof window !== "undefined") {
          window.open(siteConfig.githubUrl, "_blank", "noopener,noreferrer")
        }
        next.push({ kind: "out", text: `→ ${siteConfig.githubUrl}` })
        break
      case "theme":
        if (rest[0] === "dark" || rest[0] === "light" || rest[0] === "system") {
          setTheme(rest[0])
          next.push({ kind: "out", text: term.themeChanged(rest[0]) })
        } else {
          next.push({ kind: "err", text: term.themeUsage })
        }
        break
      case "date":
        next.push({ kind: "out", text: new Date().toString() })
        break
      case "echo":
        next.push({ kind: "out", text: args })
        break
      case "clear":
        setHistory([])
        return
      case "rm": {
        if (args.includes("-rf") && args.includes("/")) {
          next.push({ kind: "err", text: term.rmJoke })
        } else {
          next.push({ kind: "err", text: term.rmDenied(args) })
        }
        break
      }
      case "sudo":
        next.push({ kind: "err", text: term.sudoers })
        break
      case "exit":
      case "quit":
        next.push({ kind: "out", text: term.exit })
        break
      default:
        next.push({ kind: "err", text: term.notFound(cmd) })
    }
    setHistory(next)
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      runCommand(input)
      setInput("")
      setHistoryIdx(-1)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (cmdHistory.length === 0) return
      const nextIdx = historyIdx === -1 ? cmdHistory.length - 1 : Math.max(0, historyIdx - 1)
      setHistoryIdx(nextIdx)
      setInput(cmdHistory[nextIdx])
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIdx === -1) return
      const nextIdx = historyIdx + 1
      if (nextIdx >= cmdHistory.length) {
        setHistoryIdx(-1)
        setInput("")
      } else {
        setHistoryIdx(nextIdx)
        setInput(cmdHistory[nextIdx])
      }
    }
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="border-border/60 flex h-[420px] cursor-text flex-col overflow-hidden rounded-lg border bg-zinc-950 font-mono text-xs text-zinc-200"
    >
      <header className="border-border/60 flex h-7 items-center gap-1.5 border-b bg-zinc-900 px-3">
        <span className="size-2.5 rounded-full bg-red-500/70" />
        <span className="size-2.5 rounded-full bg-yellow-500/70" />
        <span className="size-2.5 rounded-full bg-green-500/70" />
        <span className="ml-2 text-[10px] text-zinc-500">guest@ai-toolbox: ~</span>
      </header>
      <div ref={containerRef} className="flex-1 overflow-y-auto p-3 leading-relaxed">
        {history.map((line, i) => {
          if (line.kind === "prompt") {
            return (
              <div key={i} className="flex gap-2">
                <span className="text-emerald-400">$</span>
                <span>{line.text}</span>
              </div>
            )
          }
          return (
            <pre
              key={i}
              className={`m-0 font-mono text-xs whitespace-pre-wrap ${
                line.kind === "err" ? "text-red-400/90" : "text-zinc-300"
              }`}
            >
              {line.text}
            </pre>
          )
        })}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            runCommand(input)
            setInput("")
            setHistoryIdx(-1)
          }}
          className="flex gap-2"
        >
          <span className="text-emerald-400">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            aria-label={term.inputAria}
            className="flex-1 border-0 bg-transparent text-zinc-200 caret-emerald-400 outline-none"
          />
        </form>
      </div>
    </div>
  )
}
