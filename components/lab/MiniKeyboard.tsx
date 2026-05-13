"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Volume2 } from "lucide-react"

type Note = {
  name: string
  freq: number
  key: string
  black?: boolean
}

const NOTES: Note[] = [
  { name: "C", freq: 261.63, key: "a" },
  { name: "C♯", freq: 277.18, key: "w", black: true },
  { name: "D", freq: 293.66, key: "s" },
  { name: "D♯", freq: 311.13, key: "e", black: true },
  { name: "E", freq: 329.63, key: "d" },
  { name: "F", freq: 349.23, key: "f" },
  { name: "F♯", freq: 369.99, key: "t", black: true },
  { name: "G", freq: 392.0, key: "g" },
  { name: "G♯", freq: 415.3, key: "y", black: true },
  { name: "A", freq: 440.0, key: "h" },
  { name: "A♯", freq: 466.16, key: "u", black: true },
  { name: "B", freq: 493.88, key: "j" },
  { name: "C", freq: 523.25, key: "k" },
]

const WAVES = ["sine", "square", "triangle", "sawtooth"] as const
type WaveType = (typeof WAVES)[number]

export function MiniKeyboard() {
  const ctxRef = useRef<AudioContext | null>(null)
  const activeRef = useRef<Map<string, { osc: OscillatorNode; gain: GainNode }>>(new Map())
  const [pressed, setPressed] = useState<Set<string>>(new Set())
  const [wave, setWave] = useState<WaveType>("sine")
  const waveRef = useRef<WaveType>("sine")
  useEffect(() => {
    waveRef.current = wave
  }, [wave])

  const ensureContext = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctxRef.current = new Ctor()
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume()
    return ctxRef.current
  }, [])

  const playNote = useCallback(
    (note: Note) => {
      const ctx = ensureContext()
      if (!ctx) return
      if (activeRef.current.has(note.name + note.freq)) return

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = waveRef.current
      osc.frequency.value = note.freq
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02)
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      activeRef.current.set(note.name + note.freq, { osc, gain })
      setPressed((prev) => new Set(prev).add(note.name + note.freq))
    },
    [ensureContext],
  )

  const stopNote = useCallback((note: Note) => {
    const ctx = ctxRef.current
    if (!ctx) return
    const entry = activeRef.current.get(note.name + note.freq)
    if (!entry) return
    const { osc, gain } = entry
    gain.gain.cancelScheduledValues(ctx.currentTime)
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15)
    osc.stop(ctx.currentTime + 0.18)
    activeRef.current.delete(note.name + note.freq)
    setPressed((prev) => {
      const next = new Set(prev)
      next.delete(note.name + note.freq)
      return next
    })
  }, [])

  useEffect(() => {
    // Don't fire the piano when the user is typing in a text field
    // (terminal demo above lives on the same page) or using a modifier
    // shortcut like Cmd+R / Ctrl+A.
    const isTextInputTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName
      return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable
    }
    const downHandler = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (isTextInputTarget(e.target)) return
      const note = NOTES.find((n) => n.key === e.key.toLowerCase())
      if (note) {
        e.preventDefault()
        playNote(note)
      }
    }
    const upHandler = (e: KeyboardEvent) => {
      if (isTextInputTarget(e.target)) return
      const note = NOTES.find((n) => n.key === e.key.toLowerCase())
      if (note) stopNote(note)
    }
    window.addEventListener("keydown", downHandler)
    window.addEventListener("keyup", upHandler)
    return () => {
      window.removeEventListener("keydown", downHandler)
      window.removeEventListener("keyup", upHandler)
    }
  }, [playNote, stopNote])

  // Cleanup on unmount. Capture refs into locals so the cleanup doesn't read
  // ref.current at a later time (which would trip react-hooks/exhaustive-deps).
  useEffect(() => {
    const activeMap = activeRef.current
    return () => {
      for (const { osc } of activeMap.values()) {
        try {
          osc.stop()
        } catch {
          /* already stopped */
        }
      }
      activeMap.clear()
      void ctxRef.current?.close()
    }
  }, [])

  const whiteKeys = NOTES.filter((n) => !n.black)
  const blackByIndex = (i: number) => NOTES.findIndex((n) => n === whiteKeys[i] && n.black)

  return (
    <div className="bg-card/30 border-border/60 flex flex-col gap-4 rounded-lg border p-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Volume2 className="text-primary size-4" />
          <span className="font-medium">虚拟键盘</span>
          <span className="text-muted-foreground text-xs">点击或按 A-K 键演奏</span>
        </div>
        <select
          value={wave}
          onChange={(e) => setWave(e.target.value as WaveType)}
          className="border-input bg-background h-7 rounded-md border px-2 text-xs"
          aria-label="波形"
        >
          {WAVES.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </header>

      <div className="relative flex h-44 select-none">
        {whiteKeys.map((note, i) => {
          const isActive = pressed.has(note.name + note.freq)
          // Find adjacent black note (the one that comes right after this white note in NOTES).
          const blackIdx = NOTES.indexOf(note) + 1
          const blackNote = NOTES[blackIdx]?.black ? NOTES[blackIdx] : null
          return (
            <div key={i} className="relative flex-1">
              <button
                type="button"
                onPointerDown={() => playNote(note)}
                onPointerUp={() => stopNote(note)}
                onPointerLeave={() => stopNote(note)}
                className={`flex h-full w-full flex-col items-center justify-end rounded-b-md border border-zinc-300 bg-white pb-2 font-mono text-[10px] text-zinc-500 transition-colors ${
                  isActive ? "bg-primary/30" : "hover:bg-zinc-100"
                }`}
                aria-label={`音符 ${note.name}`}
              >
                <span className="text-xs">{note.key.toUpperCase()}</span>
                <span>{note.name}</span>
              </button>
              {blackNote && (
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    playNote(blackNote)
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation()
                    stopNote(blackNote)
                  }}
                  onPointerLeave={() => stopNote(blackNote)}
                  className={`absolute top-0 right-[-15%] z-10 h-[60%] w-[30%] rounded-b-md border border-zinc-900 bg-zinc-900 pb-1 text-center font-mono text-[9px] text-zinc-300 transition-colors ${
                    pressed.has(blackNote.name + blackNote.freq)
                      ? "bg-primary/70"
                      : "hover:bg-zinc-800"
                  }`}
                  aria-label={`音符 ${blackNote.name}`}
                >
                  <span className="block">{blackNote.key.toUpperCase()}</span>
                </button>
              )}
              <span className="sr-only">{blackByIndex(i)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
