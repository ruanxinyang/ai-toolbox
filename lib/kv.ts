/**
 * Vercel KV (Upstash Redis under the hood) wrapper with graceful degradation.
 *
 * If `KV_REST_API_URL` / `KV_REST_API_TOKEN` are missing, every operation is
 * a no-op (cache misses, counter returns 0). This lets local dev work without
 * KV credentials, and lets the stats page show "no data yet" cleanly.
 *
 * `@vercel/kv@3` is deprecated upstream in favor of an Upstash Redis Vercel
 * Marketplace integration. The API surface is identical, so switching later
 * is just a swap of the import.
 */

const KV_ENABLED = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

type KvLike = {
  get: <T>(key: string) => Promise<T | null>
  set: (key: string, value: unknown, opts?: { ex?: number }) => Promise<unknown>
  incrby: (key: string, by: number) => Promise<number>
}

let kvInstance: KvLike | null | undefined

async function getKv(): Promise<KvLike | null> {
  if (!KV_ENABLED) return null
  if (kvInstance !== undefined) return kvInstance
  try {
    const mod = await import("@vercel/kv")
    kvInstance = mod.kv as unknown as KvLike
    return kvInstance
  } catch (err) {
    console.warn("[kv] failed to initialize:", err)
    kvInstance = null
    return null
  }
}

/** Returns the cached value, or `null` on miss / disabled / error. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const kv = await getKv()
  if (!kv) return null
  try {
    return (await kv.get<T>(key)) ?? null
  } catch (err) {
    console.warn(`[kv] get(${key}) failed:`, err)
    return null
  }
}

/** Write to cache with optional TTL in seconds. Silent on disabled / error. */
export async function cacheSet<T>(
  key: string,
  value: T,
  options?: { ttlSec?: number },
): Promise<void> {
  const kv = await getKv()
  if (!kv) return
  try {
    if (options?.ttlSec) {
      await kv.set(key, value, { ex: options.ttlSec })
    } else {
      await kv.set(key, value)
    }
  } catch (err) {
    console.warn(`[kv] set(${key}) failed:`, err)
  }
}

/** Atomically increment a counter. Returns new value, or `null` on disabled / error. */
export async function counterIncr(key: string, by = 1): Promise<number | null> {
  const kv = await getKv()
  if (!kv) return null
  try {
    return await kv.incrby(key, by)
  } catch (err) {
    console.warn(`[kv] incrby(${key}) failed:`, err)
    return null
  }
}

/** Read a counter. Returns 0 on disabled / miss / error. */
export async function counterGet(key: string): Promise<number> {
  const value = await cacheGet<number>(key)
  return typeof value === "number" ? value : 0
}

/**
 * Track per-model token usage. Writes two counters:
 *   `tokens:<modelId>:input`  · `tokens:<modelId>:output`
 *
 * Safe to call fire-and-forget — never throws.
 */
export async function trackUsage(
  modelId: string,
  inputTokens: number | undefined | null,
  outputTokens: number | undefined | null,
): Promise<void> {
  if (!KV_ENABLED) return
  const input = Number(inputTokens) || 0
  const output = Number(outputTokens) || 0
  if (input === 0 && output === 0) return
  try {
    await Promise.all([
      input > 0 ? counterIncr(`tokens:${modelId}:input`, input) : null,
      output > 0 ? counterIncr(`tokens:${modelId}:output`, output) : null,
    ])
  } catch (err) {
    console.warn(`[kv] trackUsage(${modelId}) failed:`, err)
  }
}

/**
 * Return today's date as `YYYY-MM-DD` in UTC so daily buckets are stable
 * regardless of the server region.
 */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Track a call: bumps the lifetime counter, today's per-tool bucket, and
 * today's overall bucket. Used by API routes to power the /stats trend chart.
 *
 * Safe to call fire-and-forget.
 */
export async function trackCall(slug: string): Promise<void> {
  if (!KV_ENABLED) return
  const day = todayKey()
  try {
    await Promise.all([
      counterIncr(`calls:${slug}`),
      counterIncr(`calls:${slug}:${day}`),
      counterIncr(`calls:total:${day}`),
    ])
  } catch (err) {
    console.warn(`[kv] trackCall(${slug}) failed:`, err)
  }
}

/**
 * Read N days of call counts for a slug (or `total`), ending today. Returns
 * `[ { day, count }, ... ]` with index 0 being the oldest day.
 */
export async function readCallTrend(
  slug: string,
  days: number,
): Promise<Array<{ day: string; count: number }>> {
  const today = new Date()
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  const counts = await Promise.all(dates.map((day) => counterGet(`calls:${slug}:${day}`)))
  return dates.map((day, i) => ({ day, count: counts[i] }))
}

export const kvEnabled = KV_ENABLED
