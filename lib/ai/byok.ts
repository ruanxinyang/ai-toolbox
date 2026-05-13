import { PROVIDER_IDS, type Keychain, type ProviderId } from "./providers"

/**
 * Header prefix used to pass BYOK keys from client to server.
 * Example: `x-byok-openai: sk-...`
 *
 * Why headers (not body): keys don't end up in request body logs,
 * and same shape works for GET-style streaming endpoints.
 */
export const BYOK_HEADER_PREFIX = "x-byok-"

export const BYOK_STORAGE_KEY = "ai-toolbox:byok"

/** Read BYOK keys from a Request's headers (server-side). */
export function readByokFromHeaders(headers: Headers): Keychain {
  const result: Keychain = {}
  for (const provider of PROVIDER_IDS) {
    const value = headers.get(`${BYOK_HEADER_PREFIX}${provider}`)?.trim()
    if (value) result[provider] = value
  }
  return result
}

/** Build the headers object client-side from a Keychain. */
export function byokToHeaders(byok: Keychain): Record<string, string> {
  const result: Record<string, string> = {}
  for (const provider of PROVIDER_IDS) {
    const value = byok[provider]?.trim()
    if (value) result[`${BYOK_HEADER_PREFIX}${provider}`] = value
  }
  return result
}

/** Read BYOK keys from localStorage. Returns `{}` on SSR or parse failure. */
export function readByokFromStorage(): Keychain {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(BYOK_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== "object" || parsed === null) return {}
    const result: Keychain = {}
    for (const provider of PROVIDER_IDS) {
      const value = (parsed as Record<string, unknown>)[provider]
      if (typeof value === "string" && value.trim().length > 0) {
        result[provider] = value.trim()
      }
    }
    return result
  } catch {
    return {}
  }
}

/** Persist (or clear) BYOK keys in localStorage. */
export function writeByokToStorage(byok: Keychain): void {
  if (typeof window === "undefined") return
  // Drop empty entries so the stored value stays clean.
  const cleaned: Keychain = {}
  for (const provider of PROVIDER_IDS) {
    const value = byok[provider]?.trim()
    if (value) cleaned[provider] = value
  }
  if (Object.keys(cleaned).length === 0) {
    window.localStorage.removeItem(BYOK_STORAGE_KEY)
  } else {
    window.localStorage.setItem(BYOK_STORAGE_KEY, JSON.stringify(cleaned))
  }
}

/** Convenience: which providers have a usable key in the keychain. */
export function configuredProviders(byok: Keychain): ProviderId[] {
  return PROVIDER_IDS.filter((id) => Boolean(byok[id]?.trim()))
}
