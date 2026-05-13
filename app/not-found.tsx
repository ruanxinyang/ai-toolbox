import Link from "next/link"
import type { Metadata } from "next"

import { buttonVariants } from "@/components/ui/button"
import { getServerMessages } from "@/lib/i18n/server"

export const metadata: Metadata = {
  title: "404",
}

export default async function NotFound() {
  const { t } = await getServerMessages()
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="text-muted-foreground font-mono text-sm">{t.notFound.code}</p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.notFound.title}</h1>
      <p className="text-muted-foreground">{t.notFound.body}</p>
      <Link href="/" className={buttonVariants()}>
        {t.notFound.cta}
      </Link>
    </section>
  )
}
