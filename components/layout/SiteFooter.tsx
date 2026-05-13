import Link from "next/link"

import { GithubIcon } from "@/components/icons/GithubIcon"
import { getServerMessages } from "@/lib/i18n/server"
import { siteConfig } from "@/lib/site"

export async function SiteFooter() {
  const { t } = await getServerMessages()
  const year = new Date().getFullYear()
  return (
    <footer className="border-border/60 bg-background border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-mono text-xs">
          © {year} {siteConfig.name} · {t.footer.builtWith}.
        </p>
        <nav aria-label="footer" className="flex items-center gap-4 text-xs">
          <Link href="/about" className="hover:text-foreground transition-colors">
            {t.footer.about}
          </Link>
          <Link href="/stats" className="hover:text-foreground transition-colors">
            {t.footer.stats}
          </Link>
          <a
            href={`mailto:${siteConfig.authorEmail}`}
            className="hover:text-foreground transition-colors"
          >
            {t.footer.contact}
          </a>
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
            aria-label="GitHub"
          >
            <GithubIcon className="size-3.5" />
            <span>GitHub</span>
          </a>
        </nav>
      </div>
    </footer>
  )
}
