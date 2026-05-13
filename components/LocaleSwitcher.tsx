"use client"

import { useTransition } from "react"
import { Languages } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/client"

export function LocaleSwitcher() {
  const { locale, t } = useI18n()
  const [pending, startTransition] = useTransition()
  const next = locale === "zh" ? "en" : "zh"

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label={t.common.switchLocale}
      title={t.common.switchLocale}
      onClick={() => {
        startTransition(async () => {
          await fetch("/api/locale", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale: next }),
          }).catch(() => {})
          // Reload to re-render server components with the new cookie.
          window.location.reload()
        })
      }}
    >
      <Languages className="size-4" />
      <span className="sr-only">
        {locale.toUpperCase()} → {next.toUpperCase()}
      </span>
    </Button>
  )
}
