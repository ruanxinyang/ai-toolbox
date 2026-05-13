"use client"

import { useCallback, useSyncExternalStore } from "react"

import { BYOK_STORAGE_KEY, readByokFromStorage, writeByokToStorage } from "@/lib/ai/byok"
import type { Keychain, ProviderId } from "@/lib/ai/providers"

const CUSTOM_EVENT = "ai-toolbox:byok-changed"

const EMPTY: Keychain = Object.freeze({})

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {}
  const handler = () => callback()
  window.addEventListener("storage", handler)
  window.addEventListener(CUSTOM_EVENT, handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener(CUSTOM_EVENT, handler)
  }
}

let cachedSnapshot: Keychain = EMPTY
let cachedSerialized = ""

function getSnapshot(): Keychain {
  if (typeof window === "undefined") return EMPTY
  const raw = window.localStorage.getItem(BYOK_STORAGE_KEY) ?? ""
  if (raw === cachedSerialized) return cachedSnapshot
  cachedSerialized = raw
  cachedSnapshot = readByokFromStorage()
  return cachedSnapshot
}

function getServerSnapshot(): Keychain {
  return EMPTY
}

export function useByok() {
  const byok = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const set = useCallback((next: Keychain) => {
    writeByokToStorage(next)
    window.dispatchEvent(new CustomEvent(CUSTOM_EVENT))
  }, [])

  const setOne = useCallback((provider: ProviderId, value: string) => {
    const current = readByokFromStorage()
    writeByokToStorage({ ...current, [provider]: value })
    window.dispatchEvent(new CustomEvent(CUSTOM_EVENT))
  }, [])

  const clearAll = useCallback(() => {
    writeByokToStorage({})
    window.dispatchEvent(new CustomEvent(CUSTOM_EVENT))
  }, [])

  return { byok, set, setOne, clearAll }
}
