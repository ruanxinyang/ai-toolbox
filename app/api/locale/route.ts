import { NextResponse } from "next/server"
import { z } from "zod"

import { LOCALES } from "@/lib/i18n/dictionary"
import { LOCALE_COOKIE } from "@/lib/i18n/server"

const schema = z.object({
  locale: z.enum(LOCALES as unknown as [string, ...string[]]),
})

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "INVALID_INPUT" } }, { status: 400 })
  }
  const res = NextResponse.json({ ok: true, locale: parsed.data.locale })
  res.cookies.set(LOCALE_COOKIE, parsed.data.locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
    sameSite: "lax",
  })
  return res
}
