"use client"

import { createContext, useContext, useMemo } from "react"

import { getMessages, type Locale, type Messages } from "./dictionary"

const I18nContext = createContext<{ locale: Locale; t: Messages } | null>(null)

/**
 * Server passes only `locale` (a primitive) to avoid the RSC→client serialization
 * boundary choking on the function values in the dictionary (e.g. `(n) => "${n} days"`).
 * The client provider re-derives `t` from the bundled dictionary.
 */
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  const value = useMemo(() => ({ locale, t: getMessages(locale) }), [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>")
  return ctx
}
