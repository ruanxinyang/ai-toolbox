import { ImageResponse } from "next/og"

import { siteConfig } from "@/lib/site"

export const alt = `${siteConfig.name} · 为开发者打造的 AI 工具集合`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  const violet = "rgb(138, 92, 246)" // matches --primary (oklch ~ violet-600)

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0a0a0a",
        backgroundImage:
          "radial-gradient(circle at 25% 30%, rgba(138,92,246,0.35), transparent 50%), radial-gradient(circle at 75% 70%, rgba(138,92,246,0.15), transparent 60%)",
        display: "flex",
        flexDirection: "column",
        padding: 80,
        color: "#fafafa",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
      }}
    >
      {/* Top: badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 16px",
          border: "1px solid rgba(250,250,250,0.15)",
          borderRadius: 999,
          fontSize: 22,
          color: "rgba(250,250,250,0.7)",
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
          alignSelf: "flex-start",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: violet,
          }}
        />
        <span>v0.1 · 真的能用，不是 demo</span>
      </div>

      {/* Middle: title + subtitle */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 124,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1,
          }}
        >
          {siteConfig.name}
        </div>
        <div
          style={{
            fontSize: 46,
            fontWeight: 500,
            color: violet,
            letterSpacing: -0.5,
          }}
        >
          为开发者打造的 AI 工具集合
        </div>
        <div
          style={{
            fontSize: 26,
            color: "rgba(250,250,250,0.6)",
            marginTop: 8,
            maxWidth: 900,
          }}
        >
          截图转代码 · URL 速读 · 多模型对比 · BYOK · 全程流式 · 零追踪
        </div>
      </div>

      {/* Bottom: tech footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
          fontSize: 20,
          color: "rgba(250,250,250,0.5)",
          borderTop: "1px solid rgba(250,250,250,0.1)",
          paddingTop: 24,
        }}
      >
        <span>Next.js 16 · TypeScript · Tailwind 4 · Vercel AI SDK</span>
        <span style={{ color: violet }}>{siteConfig.url.replace(/^https?:\/\//, "")}</span>
      </div>
    </div>,
    { ...size },
  )
}
