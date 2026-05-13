"use client"

import { useState } from "react"
import { ExternalLink, KeyRound, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useByok } from "@/hooks/useByok"
import {
  PROVIDER_DOCS,
  PROVIDER_IDS,
  PROVIDER_LABEL,
  type Keychain,
  type ProviderId,
} from "@/lib/ai/providers"
import { useI18n } from "@/lib/i18n/client"

export function BYOKDialog({
  trigger,
}: {
  /** Custom trigger element. Must be a single ReactElement (base-ui `render` prop). */
  trigger?: React.ReactElement
}) {
  const { t } = useI18n()
  const dialog = t.byokDialog
  const { byok, set, clearAll } = useByok()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Keychain>(byok)

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(byok)
    setOpen(next)
  }

  const handleSave = () => {
    set(draft)
    setOpen(false)
    const configured = PROVIDER_IDS.filter((id) => draft[id]?.trim()).length
    toast.success(dialog.keyUpdatedTitle, {
      description: configured === 0 ? dialog.savedNoKeys : dialog.savedConfigured(configured),
    })
  }

  const handleClear = () => {
    setDraft({})
    clearAll()
    toast.info(dialog.clearedTitle, {
      description: dialog.clearedBody,
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="outline" size="sm" aria-label={t.nav.settings}>
              <KeyRound className="size-3.5" />
              <span className="hidden sm:inline">{dialog.trigger}</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="text-primary size-4" />
            {dialog.title}
          </DialogTitle>
          <DialogDescription>
            {dialog.descriptionMain}
            <strong>{dialog.descriptionEmphasis}</strong>
            {dialog.descriptionTail}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {PROVIDER_IDS.map((id) => (
            <ProviderRow
              key={id}
              provider={id}
              value={draft[id] ?? ""}
              onChange={(value) => setDraft((d) => ({ ...d, [id]: value }))}
            />
          ))}
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            {dialog.clearAll}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              {dialog.cancel}
            </Button>
            <Button size="sm" onClick={handleSave}>
              {dialog.save}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ProviderRow({
  provider,
  value,
  onChange,
}: {
  provider: ProviderId
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useI18n()
  const docs = PROVIDER_DOCS[provider]
  const label = PROVIDER_LABEL[provider]
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="flex items-center justify-between">
        <span className="text-foreground font-medium">{label}</span>
        <a
          href={docs}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-xs transition-colors"
        >
          {t.byokDialog.getKey}
          <ExternalLink className="size-3" />
        </a>
      </span>
      <Input
        type="password"
        autoComplete="off"
        spellCheck={false}
        placeholder={t.byokDialog.placeholderTemplate(label)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-xs"
      />
    </label>
  )
}
