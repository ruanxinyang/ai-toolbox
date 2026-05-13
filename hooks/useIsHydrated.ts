"use client"

import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/**
 * Returns `false` during SSR / initial render, `true` after hydration.
 * Replacement for the `useEffect(() => setMounted(true), [])` pattern,
 * which is flagged by the React 19.2 `set-state-in-effect` lint rule.
 */
export function useIsHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
