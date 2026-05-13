/**
 * Cross-tool history. Each tool optionally records its inputs + output blob to
 * localStorage so the user can revisit / re-export / re-share past runs.
 *
 * - Per-tool capped at 20 entries (oldest evicted first). Tunable per slot.
 * - Storage key: `ai-toolbox:history:<slug>`.
 * - Entry shape is generic: tool decides what to store in `input` / `output`.
 *   Keep them small — full images / PDFs should not be saved here.
 */

import { useCallback, useSyncExternalStore } from "react"

const KEY_PREFIX = "ai-toolbox:history:"
const DEFAULT_CAPACITY = 20
const CUSTOM_EVENT = "ai-toolbox:history-changed"

export type HistoryEntry<TInput = unknown, TOutput = unknown> = {
  id: string
  slug: string
  createdAt: number
  title: string
  input: TInput
  output: TOutput
}

function keyFor(slug: string) {
  return `${KEY_PREFIX}${slug}`
}

/**
 * Snapshot cache keyed by slug. `useSyncExternalStore` requires `getSnapshot`
 * to return *referentially stable* values when the underlying data has not
 * changed; otherwise React re-renders on every check and triggers
 * "Maximum update depth exceeded" in production. We key off the raw
 * localStorage string and only allocate a new array when the raw changes.
 */
const snapshotCache = new Map<string, { raw: string; entries: HistoryEntry[] }>()
const EMPTY: HistoryEntry[] = []

function readStable(slug: string): HistoryEntry[] {
  if (typeof window === "undefined") return EMPTY
  const raw = window.localStorage.getItem(keyFor(slug)) ?? ""
  const cached = snapshotCache.get(slug)
  if (cached && cached.raw === raw) return cached.entries
  let entries: HistoryEntry[] = EMPTY
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) entries = parsed as HistoryEntry[]
    } catch {
      /* corrupted localStorage — fall back to empty */
    }
  }
  snapshotCache.set(slug, { raw, entries })
  return entries
}

function writeRaw(slug: string, entries: HistoryEntry[]) {
  if (typeof window === "undefined") return
  const serialized = JSON.stringify(entries)
  window.localStorage.setItem(keyFor(slug), serialized)
  // Refresh the cache immediately so the next getSnapshot returns a new
  // stable reference and React picks up the change on the same tick.
  snapshotCache.set(slug, { raw: serialized, entries })
  window.dispatchEvent(new CustomEvent(CUSTOM_EVENT, { detail: { slug } }))
}

export function pushHistory<TInput, TOutput>(
  slug: string,
  entry: Omit<HistoryEntry<TInput, TOutput>, "id" | "createdAt" | "slug">,
  options?: { capacity?: number },
): HistoryEntry<TInput, TOutput> {
  const cap = options?.capacity ?? DEFAULT_CAPACITY
  const item: HistoryEntry<TInput, TOutput> = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    slug,
    createdAt: Date.now(),
    title: entry.title,
    input: entry.input,
    output: entry.output,
  }
  const existing = readStable(slug) as HistoryEntry<TInput, TOutput>[]
  const next = [item, ...existing].slice(0, cap)
  writeRaw(slug, next as HistoryEntry[])
  return item
}

export function clearHistory(slug: string) {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(keyFor(slug))
  snapshotCache.set(slug, { raw: "", entries: EMPTY })
  window.dispatchEvent(new CustomEvent(CUSTOM_EVENT, { detail: { slug } }))
}

export function removeHistoryEntry(slug: string, id: string) {
  const existing = readStable(slug)
  writeRaw(
    slug,
    existing.filter((e) => e.id !== id),
  )
}

function subscribe(slug: string, callback: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ slug: string }>).detail
    if (!detail || detail.slug === slug) callback()
  }
  const storageHandler = (event: StorageEvent) => {
    if (event.key === keyFor(slug)) {
      // Cross-tab write — bust cache so getSnapshot rebuilds on next call.
      snapshotCache.delete(slug)
      callback()
    }
  }
  window.addEventListener(CUSTOM_EVENT, handler)
  window.addEventListener("storage", storageHandler)
  return () => {
    window.removeEventListener(CUSTOM_EVENT, handler)
    window.removeEventListener("storage", storageHandler)
  }
}

/**
 * React hook that returns the entries for `slug`, reactive across tabs and
 * within the page (via custom event). Server snapshot is always empty.
 */
export function useHistory<TInput = unknown, TOutput = unknown>(
  slug: string,
): {
  entries: HistoryEntry<TInput, TOutput>[]
  clear: () => void
  remove: (id: string) => void
} {
  const subscribeFn = useCallback((cb: () => void) => subscribe(slug, cb), [slug])
  const getSnapshot = useCallback(
    () => readStable(slug) as HistoryEntry<TInput, TOutput>[],
    [slug],
  )
  const getServerSnapshot = useCallback(() => EMPTY as HistoryEntry<TInput, TOutput>[], [])
  const entries = useSyncExternalStore(subscribeFn, getSnapshot, getServerSnapshot)
  const clear = useCallback(() => clearHistory(slug), [slug])
  const remove = useCallback((id: string) => removeHistoryEntry(slug, id), [slug])
  return { entries, clear, remove }
}
