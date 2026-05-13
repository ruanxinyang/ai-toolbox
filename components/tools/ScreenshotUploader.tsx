"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { Image as ImageIcon, Upload, X } from "lucide-react"
import { toast } from "sonner"

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"]
const MAX_BYTES = 5 * 1024 * 1024

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"))
    reader.readAsDataURL(file)
  })
}

export function ScreenshotUploader({
  image,
  onImage,
}: {
  image: string | null
  onImage: (dataUrl: string | null) => void
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        toast.error("不支持的图片格式", { description: "只支持 PNG / JPEG / WebP" })
        return
      }
      if (file.size > MAX_BYTES) {
        toast.error("图片过大", {
          description: `≤ 5MB，当前 ${(file.size / 1024 / 1024).toFixed(1)}MB`,
        })
        return
      }
      try {
        const dataUrl = await readAsDataURL(file)
        onImage(dataUrl)
      } catch {
        toast.error("图片读取失败")
      }
    },
    [onImage],
  )

  // Global paste handler (only active when component is mounted).
  useEffect(() => {
    const handler = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) {
            event.preventDefault()
            void handleFile(file)
            return
          }
        }
      }
    }
    document.addEventListener("paste", handler)
    return () => document.removeEventListener("paste", handler)
  }, [handleFile])

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`group border-border/70 bg-background/40 hover:border-primary/50 hover:bg-primary/5 relative flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
          dragOver ? "border-primary bg-primary/10" : ""
        }`}
      >
        {image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt="待识别的截图"
              className="absolute inset-0 size-full rounded-lg object-contain p-2"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                onImage(null)
                if (inputRef.current) inputRef.current.value = ""
              }}
              aria-label="移除图片"
              className="bg-background/80 hover:bg-destructive/10 hover:text-destructive border-border absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-md border backdrop-blur transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <>
            <Upload aria-hidden className="text-muted-foreground size-6" />
            <div className="flex flex-col items-center gap-0.5 text-center">
              <span className="text-sm font-medium">点击 · 拖拽 · 粘贴上传</span>
              <span className="text-muted-foreground font-mono text-xs">
                PNG / JPEG / WebP · ≤ 5MB
              </span>
            </div>
          </>
        )}
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
      </label>
      {!image && (
        <p className="text-muted-foreground inline-flex items-center gap-1 font-mono text-xs">
          <ImageIcon className="size-3" />
          <kbd className="border-border bg-muted rounded border px-1 py-0.5 text-[10px]">⌘V</kbd>
          粘贴图片即可
        </p>
      )}
    </div>
  )
}
