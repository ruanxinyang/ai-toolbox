"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Laptop, Mail, Moon, Search, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { GithubIcon } from "@/components/icons/GithubIcon"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useIsHydrated } from "@/hooks/useIsHydrated"
import { useI18n } from "@/lib/i18n/client"
import type { Messages } from "@/lib/i18n/dictionary"
import { navLinks, siteConfig, tools } from "@/lib/site"

const MAC_PATTERN = /Mac|iPhone|iPad/

function detectMac() {
  if (typeof navigator === "undefined") return false
  return MAC_PATTERN.test(navigator.platform || navigator.userAgent)
}

function getNavLabel(href: string, t: Messages): string {
  switch (href) {
    case "/tools":
      return t.nav.tools
    case "/playground":
      return t.nav.playground
    case "/lab":
      return t.nav.lab
    case "/about":
      return t.nav.about
    case "/stats":
      return t.nav.stats
    default:
      return href
  }
}

export function CommandMenu() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { setTheme } = useTheme()
  const hydrated = useIsHydrated()
  const isMac = hydrated && detectMac()

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const run = useCallback((fn: () => void) => {
    setOpen(false)
    // Defer to next tick so the dialog can finish closing before navigation
    requestAnimationFrame(fn)
  }, [])

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={t.commands.open}
        className="text-muted-foreground hidden gap-2 md:inline-flex"
      >
        <Search aria-hidden className="size-3.5" />
        <span>{t.commands.triggerSearch}</span>
        <kbd className="border-border bg-muted text-muted-foreground ml-2 inline-flex h-5 items-center gap-0.5 rounded border px-1.5 font-mono text-[10px]">
          <span className="text-xs">{isMac ? "⌘" : "Ctrl"}</span>
          <span>K</span>
        </kbd>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={t.commands.open}
        className="md:hidden"
      >
        <Search aria-hidden className="size-4" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t.commands.open}
        description={t.commands.placeholder}
      >
        <CommandInput placeholder={t.commands.placeholder} />
        <CommandList>
          <CommandEmpty>{t.commands.empty}</CommandEmpty>

          <CommandGroup heading={t.commands.groups.tools}>
            {tools.map((tool) => {
              const Icon = tool.icon
              const available = tool.status === "available"
              const tr = t.tools.byName[tool.slug as keyof typeof t.tools.byName] ?? {
                name: tool.name,
                description: tool.description,
              }
              return (
                <CommandItem
                  key={tool.slug}
                  value={`tool ${tr.name} ${tool.name} ${tool.slug} ${tool.tags.join(" ")} ${tr.description}`}
                  onSelect={() =>
                    run(() => {
                      if (available) {
                        router.push(tool.href)
                      } else {
                        toast.info(`${tr.name} · ${t.commands.tools.comingToast}`, {
                          description: t.commands.tools.comingToastBody,
                        })
                      }
                    })
                  }
                >
                  <Icon aria-hidden />
                  <span>{tr.name}</span>
                  <CommandShortcut>
                    {available ? t.commands.tools.online : t.commands.tools.coming}
                  </CommandShortcut>
                </CommandItem>
              )
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t.commands.groups.navigate}>
            {navLinks.map((link) => {
              const label = getNavLabel(link.href, t)
              return (
                <CommandItem
                  key={link.href}
                  value={`nav ${label} ${link.label} ${link.href}`}
                  onSelect={() => run(() => router.push(link.href))}
                >
                  <span>{label}</span>
                  <CommandShortcut>{link.href}</CommandShortcut>
                </CommandItem>
              )
            })}
            <CommandItem
              value="github repository 仓库 源码 code"
              onSelect={() =>
                run(() => window.open(siteConfig.githubUrl, "_blank", "noopener,noreferrer"))
              }
            >
              <GithubIcon className="size-4" />
              <span>{t.commands.items.github}</span>
              <CommandShortcut>↗</CommandShortcut>
            </CommandItem>
            <CommandItem
              value="email contact mail 联系 邮件"
              onSelect={() =>
                run(() => {
                  window.location.href = `mailto:${siteConfig.authorEmail}`
                })
              }
            >
              <Mail aria-hidden />
              <span>{t.commands.items.email}</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t.commands.groups.theme}>
            <CommandItem
              value="theme light 浅色 light-mode"
              onSelect={() => run(() => setTheme("light"))}
            >
              <Sun aria-hidden />
              <span>{t.commands.items.theme.light}</span>
            </CommandItem>
            <CommandItem
              value="theme dark 深色 dark-mode"
              onSelect={() => run(() => setTheme("dark"))}
            >
              <Moon aria-hidden />
              <span>{t.commands.items.theme.dark}</span>
            </CommandItem>
            <CommandItem
              value="theme system 系统 auto 跟随"
              onSelect={() => run(() => setTheme("system"))}
            >
              <Laptop aria-hidden />
              <span>{t.commands.items.theme.system}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
