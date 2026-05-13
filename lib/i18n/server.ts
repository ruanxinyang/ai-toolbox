import { cookies } from "next/headers"

import { DEFAULT_LOCALE, type Locale, getMessages, isLocale } from "./dictionary"

export const LOCALE_COOKIE = "locale"

/**
 * Server-only locale resolution. In Next.js 16 `cookies()` is async — must
 * be awaited. Cached per request so repeated calls are cheap.
 */
export async function getServerLocale(): Promise<Locale> {
  const c = await cookies()
  const value = c.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export async function getServerMessages() {
  const locale = await getServerLocale()
  return { locale, t: getMessages(locale) }
}
