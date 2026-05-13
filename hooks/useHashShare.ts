"use client"

import { useSyncExternalStore } from "react"

import { SHARE_HASH_PREFIX, decodeShare } from "@/lib/share"

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {}
  window.addEventListener("hashchange", callback)
  return () => window.removeEventListener("hashchange", callback)
}

function getSnapshot(): string {
  if (typeof window === "undefined") return ""
  const hash = window.location.hash
  if (!hash.startsWith(SHARE_HASH_PREFIX)) return ""
  try {
    return decodeShare(hash.slice(SHARE_HASH_PREFIX.length))
  } catch {
    return ""
  }
}

function getServerSnapshot(): string {
  return ""
}

/**
 * Returns the `?share=...`-encoded payload from the URL hash, or "".
 * Updates reactively when the hash changes.
 *
 * Use this for share-on-load: render the shared payload until the user
 * generates their own content.
 */
export function useHashShare(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
