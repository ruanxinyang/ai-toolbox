"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Keyboard } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Shortcut = {
  seq: string
  label: string
  action: () => void
}

const SEQUENCE_TIMEOUT_MS = 1000

function buildShortcuts(router: ReturnType<typeof useRouter>): Shortcut[] {
  const go = (path: string) => () => router.push(path)
  return [
    { seq: "g h", label: "回首页", action: go("/") },
    { seq: "g t", label: "工具集", action: go("/tools") },
    { seq: "g l", label: "实验室", action: go("/lab") },
    { seq: "g a", label: "关于", action: go("/about") },
    { seq: "g s", label: "数据透明", action: go("/stats") },
  ]
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable
}

export function KeyboardShortcuts() {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)
  const pendingRef = useRef<{ key: string; time: number } | null>(null)

  useEffect(() => {
    const shortcuts = buildShortcuts(router)
    const byPrefix = new Map<string, Shortcut[]>()
    for (const s of shortcuts) {
      const [first] = s.seq.split(" ")
      if (!byPrefix.has(first)) byPrefix.set(first, [])
      byPrefix.get(first)!.push(s)
    }

    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return

      const key = e.key.toLowerCase()
      const now = Date.now()

      // `?` opens help (Shift+/ on US layouts, but `e.key` resolves to "?")
      if (e.key === "?") {
        e.preventDefault()
        setShowHelp((prev) => !prev)
        return
      }

      // Esc closes help when open
      if (e.key === "Escape" && showHelp) {
        setShowHelp(false)
        return
      }

      // Continuation of a pending sequence?
      if (pendingRef.current && now - pendingRef.current.time < SEQUENCE_TIMEOUT_MS) {
        const seq = `${pendingRef.current.key} ${key}`
        const match = shortcuts.find((s) => s.seq === seq)
        pendingRef.current = null
        if (match) {
          e.preventDefault()
          match.action()
        }
        return
      }

      // Start a new sequence if this key is a known prefix
      if (byPrefix.has(key)) {
        pendingRef.current = { key, time: now }
        return
      }

      pendingRef.current = null
    }

    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [router, showHelp])

  const shortcuts = buildShortcuts(router)

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="text-primary size-4" />
            键盘快捷键
          </DialogTitle>
          <DialogDescription>
            类 vim 风格的两键序列。在 1 秒内按完两个键即可跳转。
          </DialogDescription>
        </DialogHeader>

        <ul className="divide-border/60 divide-y text-sm">
          {shortcuts.map((s) => (
            <li key={s.seq} className="flex items-center justify-between gap-3 py-2">
              <span className="text-foreground/90">{s.label}</span>
              <span className="flex items-center gap-1">
                {s.seq.split(" ").map((k, i) => (
                  <kbd
                    key={i}
                    className="border-border bg-muted text-foreground inline-flex h-6 min-w-6 items-center justify-center rounded border px-1.5 font-mono text-xs"
                  >
                    {k.toUpperCase()}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-3 py-2">
            <span className="text-foreground/90">打开命令面板</span>
            <span className="flex items-center gap-1">
              <kbd className="border-border bg-muted text-foreground inline-flex h-6 min-w-6 items-center justify-center rounded border px-1.5 font-mono text-xs">
                ⌘
              </kbd>
              <kbd className="border-border bg-muted text-foreground inline-flex h-6 min-w-6 items-center justify-center rounded border px-1.5 font-mono text-xs">
                K
              </kbd>
            </span>
          </li>
          <li className="flex items-center justify-between gap-3 py-2">
            <span className="text-foreground/90">显示这个面板</span>
            <kbd className="border-border bg-muted text-foreground inline-flex h-6 min-w-6 items-center justify-center rounded border px-1.5 font-mono text-xs">
              ?
            </kbd>
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  )
}
