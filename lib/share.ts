/**
 * UTF-8-safe base64 encode/decode for sharing generated code via URL hash.
 * Native `btoa` only handles Latin-1; this round-trips arbitrary unicode.
 *
 * URL hash is used (not query) so the payload never reaches the server.
 */

export function encodeShare(text: string): string {
  if (typeof window === "undefined") return ""
  const bytes = new TextEncoder().encode(text)
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return window.btoa(binary).replace(/=+$/, "")
}

export function decodeShare(b64: string): string {
  if (typeof window === "undefined") return ""
  // Restore base64 padding then decode.
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4)
  const binary = window.atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

export const SHARE_HASH_PREFIX = "#share="

/** Build a full shareable URL for the current page with `text` encoded. */
export function buildShareUrl(text: string): string {
  if (typeof window === "undefined") return ""
  const { origin, pathname } = window.location
  return `${origin}${pathname}${SHARE_HASH_PREFIX}${encodeShare(text)}`
}

/** Update the current URL's hash to embed `text` without a navigation. */
export function setShareHash(text: string): void {
  if (typeof window === "undefined") return
  const next = `${window.location.pathname}${SHARE_HASH_PREFIX}${encodeShare(text)}`
  window.history.replaceState(null, "", next)
  // Fire hashchange so useSyncExternalStore-based subscribers see it.
  window.dispatchEvent(new HashChangeEvent("hashchange"))
}

/** Clear any share=... hash from the URL. */
export function clearShareHash(): void {
  if (typeof window === "undefined") return
  if (!window.location.hash.startsWith(SHARE_HASH_PREFIX)) return
  window.history.replaceState(null, "", window.location.pathname)
  window.dispatchEvent(new HashChangeEvent("hashchange"))
}
