"use client"

import { useState } from "react"
import { History as HistoryIcon, Share2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useHistory, type HistoryEntry } from "@/lib/history"
import { useI18n } from "@/lib/i18n/client"
import { buildShareUrl } from "@/lib/share"

function timeAgo(ts: number, locale: string): string {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60_000)
  const isZh = locale === "zh"
  if (minutes < 1) return isZh ? "刚刚" : "just now"
  if (minutes < 60) return isZh ? `${minutes} 分钟前` : `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return isZh ? `${hours} 小时前` : `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return isZh ? `${days} 天前` : `${days}d ago`
  return new Date(ts).toLocaleDateString()
}

/**
 * Generic per-tool history viewer. Tool supplies a `renderShareable` to extract
 * the shareable text (usually the output) for the share button.
 */
export function HistoryDialog<TInput, TOutput>({
  slug,
  onRestore,
  renderShareable,
  triggerLabel,
}: {
  slug: string
  onRestore: (entry: HistoryEntry<TInput, TOutput>) => void
  renderShareable?: (entry: HistoryEntry<TInput, TOutput>) => string
  triggerLabel?: string
}) {
  const { entries, clear, remove } = useHistory<TInput, TOutput>(slug)
  const [open, setOpen] = useState(false)
  const { t, locale } = useI18n()
  const label = triggerLabel ?? t.tools.actions.history

  const handleShare = async (entry: HistoryEntry<TInput, TOutput>) => {
    const text = renderShareable?.(entry)
    if (!text) {
      toast.error(t.tools.forms.noShareSupport)
      return
    }
    try {
      await navigator.clipboard.writeText(buildShareUrl(text))
      toast.success(t.tools.forms.shareCopied)
    } catch {
      toast.error(t.tools.forms.shareFailed)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label={label}
            disabled={entries.length === 0}
          >
            <HistoryIcon />
            <span>
              {label} {entries.length > 0 ? `(${entries.length})` : ""}
            </span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>{t.tools.forms.historyHint}</DialogDescription>
        </DialogHeader>

        <ul className="divide-border/40 max-h-96 divide-y overflow-y-auto">
          {entries.length === 0 ? (
            <li className="text-muted-foreground py-8 text-center text-sm">
              {t.tools.forms.historyEmpty}
            </li>
          ) : (
            entries.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 py-3 text-sm">
                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                  <span className="text-foreground/90 truncate font-medium">{entry.title}</span>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {timeAgo(entry.createdAt, locale)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => {
                      onRestore(entry)
                      setOpen(false)
                    }}
                    aria-label={t.tools.forms.restoreLabel}
                  >
                    <span aria-hidden>↻</span>
                  </Button>
                  {renderShareable && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleShare(entry)}
                      aria-label={t.tools.actions.share}
                    >
                      <Share2 />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => remove(entry.id)}
                    aria-label={t.tools.forms.deleteLabel}
                    className="hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>

        {entries.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clear()
                toast.info(t.tools.forms.historyClearedToast)
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 />
              {t.tools.forms.historyClearAll}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
