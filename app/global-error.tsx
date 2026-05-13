"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

/**
 * Global React render-error boundary. Sentry captures the error so it shows
 * up in the dashboard. Renders a minimal page (no shadcn — we may be in a
 * state where styles failed to load).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="zh-CN">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        }}
      >
        <p
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 12,
            color: "rgba(250,250,250,0.5)",
          }}
        >
          500 · UNEXPECTED_ERROR
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}>出了点问题</h1>
        <p
          style={{
            color: "rgba(250,250,250,0.7)",
            maxWidth: 480,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          页面渲染失败，已上报给 Sentry。可以尝试重试，或回首页看看其他工具。
        </p>
        {error.digest && (
          <p
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 10,
              color: "rgba(250,250,250,0.3)",
            }}
          >
            digest: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "rgb(138, 92, 246)",
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            重试
          </button>
          {/* Global error boundary runs outside the router — plain <a> is intentional. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid rgba(250,250,250,0.2)",
              color: "#fafafa",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            回首页
          </a>
        </div>
      </body>
    </html>
  )
}
