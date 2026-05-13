import Link from "next/link"
import { KeyRound, Sparkles } from "lucide-react"

import { BYOKDialog } from "@/components/BYOKDialog"
import { CommandMenu } from "@/components/CommandMenu"
import { GithubIcon } from "@/components/icons/GithubIcon"
import { MobileNav } from "@/components/layout/MobileNav"
import { LocaleSwitcher } from "@/components/LocaleSwitcher"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Button, buttonVariants } from "@/components/ui/button"
import type { Messages } from "@/lib/i18n/dictionary"
import { getServerMessages } from "@/lib/i18n/server"
import { navLinks, siteConfig } from "@/lib/site"

function getLinkLabel(href: string, t: Messages): string {
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

export async function SiteHeader() {
  const { t } = await getServerMessages()

  return (
    <header className="border-border/60 bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <MobileNav />
        <Link
          href="/"
          className="group flex items-center gap-2 font-semibold tracking-tight"
          aria-label={siteConfig.shortName}
        >
          <span
            aria-hidden
            className="bg-primary/10 text-primary group-hover:bg-primary/15 inline-flex size-7 items-center justify-center rounded-md transition-colors"
          >
            <Sparkles className="size-4" />
          </span>
          <span className="text-sm sm:text-base">{siteConfig.shortName}</span>
        </Link>

        <nav aria-label="primary" className="hidden flex-1 items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {getLinkLabel(link.href, t)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <CommandMenu />
          <BYOKDialog
            trigger={
              <Button
                variant="ghost"
                size="icon"
                aria-label={t.nav.settings}
                className="hidden md:inline-flex"
              >
                <KeyRound className="size-4" />
              </Button>
            }
          />
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.nav.github}
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <GithubIcon className="size-4" />
          </a>
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
