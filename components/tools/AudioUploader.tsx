"use client"

import { useCallback, useId, useRef, useState } from "react"
import { FileAudio, X } from "lucide-react"
import { toast } from "sonner"

const ACCEPTED = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/webm",
  "audio/ogg",
]
const MAX_BYTES = 30 * 1024 * 1024

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"))
    reader.readAsDataURL(file)
  })
}

export type AudioFile = { name: string; size: number; dataUrl: string }

export function AudioUploader({
  file,
  onFile,
}: {
  file: AudioFile | null
  onFile: (data: AudioFile | null) => void
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(
    async (raw: File) => {
      const ok = ACCEPTED.includes(raw.type) || /\.(mp3|wav|m4a|webm|ogg|mp4)$/i.test(raw.name)
      if (!ok) {
        toast.error("不支持的音频格式", { description: "支持 MP3 / WAV / M4A / WebM / OGG" })
        return
      }
      if (raw.size > MAX_BYTES) {
        toast.error("音频过大", {
          description: `≤ 30MB，当前 ${(raw.size / 1024 / 1024).toFixed(1)}MB`,
        })
        return
      }
      try {
        const dataUrl = await readAsDataURL(raw)
        onFile({ name: raw.name, size: raw.size, dataUrl })
      } catch {
        toast.error("音频读取失败")
      }
    },
    [onFile],
  )

  if (file) {
    return (
      <div className="bg-card/40 border-border/60 flex flex-col gap-2 rounded-lg border p-3">
        <div className="flex items-center gap-3">
          <FileAudio className="text-primary size-5 shrink-0" />
          <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
            <span className="truncate text-sm font-medium">{file.name}</span>
            <span className="text-muted-foreground font-mono text-[10px]">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onFile(null)
              if (inputRef.current) inputRef.current.value = ""
            }}
            aria-label="移除音频"
            className="text-muted-foreground hover:text-destructive inline-flex size-7 items-center justify-center rounded-md transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <audio src={file.dataUrl} controls className="h-9 w-full" preload="metadata" />
      </div>
    )
  }

  return (
    <label
      htmlFor={inputId}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const f = e.dataTransfer.files?.[0]
        if (f) void handleFile(f)
      }}
      className={`group border-border/70 bg-background/40 hover:border-primary/50 hover:bg-primary/5 relative flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
        dragOver ? "border-primary bg-primary/10" : ""
      }`}
    >
      <FileAudio className="text-muted-foreground size-6" />
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-sm font-medium">点击或拖拽上传音频</span>
        <span className="text-muted-foreground font-mono text-xs">
          MP3 / WAV / M4A / WebM / OGG · ≤ 30MB
        </span>
      </div>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleFile(f)
        }}
      />
    </label>
  )
}
