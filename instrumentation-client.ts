import * as Sentry from "@sentry/nextjs"

/**
 * Client-side Sentry init. Active only if `NEXT_PUBLIC_SENTRY_DSN` is set.
 * BYOK keys live in localStorage — make sure they NEVER leak to Sentry by
 * scrubbing the request body before send.
 */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
    tracesSampleRate: 0.05,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
    beforeSend(event) {
      // Scrub any x-byok-* headers that may have made it into breadcrumbs.
      if (event.request?.headers) {
        const headers = event.request.headers as Record<string, string>
        for (const key of Object.keys(headers)) {
          if (key.toLowerCase().startsWith("x-byok-")) {
            headers[key] = "[REDACTED]"
          }
        }
      }
      return event
    },
  })
}

// Required by Next.js 16 instrumentation contract.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
