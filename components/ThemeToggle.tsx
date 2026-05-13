"use client"

import { Laptop, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useIsHydrated } from "@/hooks/useIsHydrated"

type Mode = "light" | "dark" | "system"

const NEXT: Record<Mode, Mode> = {
  dark: "light",
  light: "system",
  system: "dark",
}

const LABEL: Record<Mode, string> = {
  dark: "切换到浅色",
  light: "切换到跟随系统",
  system: "切换到深色",
}

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const hydrated = useIsHydrated()

  const current: Mode = hydrated ? ((theme as Mode | undefined) ?? "system") : "dark"
  const visual = (resolvedTheme ?? "dark") as Exclude<Mode, "system">

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={LABEL[current]}
      title={LABEL[current]}
      onClick={() => setTheme(NEXT[current])}
      className="relative"
    >
      {current === "system" ? (
        <Laptop aria-hidden />
      ) : visual === "dark" ? (
        <Moon aria-hidden />
      ) : (
        <Sun aria-hidden />
      )}
      <span className="sr-only">{LABEL[current]}</span>
    </Button>
  )
}
