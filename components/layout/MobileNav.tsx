"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, Menu, Sparkles } from "lucide-react"

import { GithubIcon } from "@/components/icons/GithubIcon"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { navLinks, siteConfig } from "@/lib/site"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="打开导航菜单" className="md:hidden" />
        }
      >
        <Menu aria-hidden className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0">
        <SheetHeader className="border-border/60 border-b">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="bg-primary/10 text-primary inline-flex size-7 items-center justify-center rounded-md"
            >
              <Sparkles className="size-4" />
            </span>
            <SheetTitle>{siteConfig.shortName}</SheetTitle>
          </div>
          <SheetDescription>{siteConfig.description}</SheetDescription>
        </SheetHeader>

        <nav aria-label="移动端导航" className="flex flex-col gap-1 p-2">
          {navLinks.map((link) => (
            <SheetClose
              key={link.href}
              render={
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="hover:bg-muted text-foreground/90 flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
                >
                  <span>{link.label}</span>
                  <span className="text-muted-foreground font-mono text-xs">{link.href}</span>
                </Link>
              }
            />
          ))}
        </nav>

        <div className="border-border/60 mt-auto flex flex-col gap-1 border-t p-2">
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="hover:bg-muted text-muted-foreground flex items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors"
          >
            <GithubIcon className="size-4" />
            <span>GitHub 源码</span>
          </a>
          <a
            href={`mailto:${siteConfig.authorEmail}`}
            onClick={() => setOpen(false)}
            className="hover:bg-muted text-muted-foreground flex items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors"
          >
            <Mail className="size-4" />
            <span>邮件联系</span>
          </a>
        </div>
      </SheetContent>
    </Sheet>
  )
}
