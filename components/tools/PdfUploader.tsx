"use client"

import { useCallback, useId, useRef, useState } from "react"
import { FileUp, X } from "lucide-react"
import { toast } from "sonner"

const ACCEPTED = "application/pdf"
const MAX_BYTES = 15 * 1024 * 1024

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"))
    reader.readAsDataURL(file)
  })
}

export function PdfUploader({
  file,
  onFile,
}: {
  file: { name: string; size: number; dataUrl: string } | null
  onFile: (data: { name: string; size: number; dataUrl: string } | null) => void
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(
    async (raw: File) => {
      if (raw.type !== ACCEPTED) {
        toast.error("只支持 PDF 文件", { description: `当前 ${raw.type || "未知类型"}` })
        return
      }
      if (raw.size > MAX_BYTES) {
        toast.error("PDF 过大", {
          description: `≤ 15MB，当前 ${(raw.size / 1024 / 1024).toFixed(1)}MB`,
        })
        return
      }
      try {
        const dataUrl = await readAsDataURL(raw)
        onFile({ name: raw.name, size: raw.size, dataUrl })
      } catch {
        toast.error("文件读取失败")
      }
    },
    [onFile],
  )

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragOver(false)
    const f = event.dataTransfer.files?.[0]
    if (f) void handleFile(f)
  }

  if (file) {
    return (
      <div className="bg-card/40 border-border/60 flex items-center gap-3 rounded-lg border p-3">
        <FileUp aria-hidden className="text-primary size-5 shrink-0" />
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
          aria-label="移除 PDF"
          className="text-muted-foreground hover:text-destructive inline-flex size-7 items-center justify-center rounded-md transition-colors"
        >
          <X className="size-3.5" />
        </button>
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
      onDrop={handleDrop}
      className={`group border-border/70 bg-background/40 hover:border-primary/50 hover:bg-primary/5 relative flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
        dragOver ? "border-primary bg-primary/10" : ""
      }`}
    >
      <FileUp aria-hidden className="text-muted-foreground size-6" />
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-sm font-medium">点击或拖拽上传 PDF</span>
        <span className="text-muted-foreground font-mono text-xs">≤ 15MB · 论文 / 报告 / 合同</span>
      </div>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleFile(f)
        }}
      />
    </label>
  )
}
