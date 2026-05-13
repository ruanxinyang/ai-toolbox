import * as Sentry from "@sentry/nextjs"

/**
 * Sentry instrumentation entry. Activates only if `SENTRY_DSN` is set in env —
 * local dev and CI run as no-ops, no annoying console noise.
 */
export async function register() {
  if (!process.env.SENTRY_DSN) return

  const common = {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: 0.1, // 10% of requests, low to keep free-tier quota
    enableLogs: false,
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      ...common,
      // Ignore expected client errors (rate-limited, bad input) — they're not bugs.
      ignoreErrors: ["INVALID_INPUT", "RATE_LIMITED", "MISSING_API_KEY"],
    })
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init(common)
  }
}

// Required by Next.js 16: forward unhandled exceptions in nested React server
// components to Sentry. Without this, errors get swallowed.
export const onRequestError = Sentry.captureRequestError
