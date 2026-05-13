"use client"

import { SandpackLayout, SandpackPreview, SandpackProvider } from "@codesandbox/sandpack-react"
import { useTheme } from "next-themes"

import { useIsHydrated } from "@/hooks/useIsHydrated"

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Preview</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`

const INDEX_TSX = `import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`

export function LivePreview({ code }: { code: string }) {
  const { resolvedTheme } = useTheme()
  const hydrated = useIsHydrated()

  if (!code.trim()) {
    return (
      <div className="bg-card/40 border-border/60 flex h-full min-h-[320px] items-center justify-center rounded-lg border p-6 text-center">
        <p className="text-muted-foreground text-sm">代码生成完成后，预览将在这里实时渲染</p>
      </div>
    )
  }

  return (
    <div className="border-border/60 size-full min-h-[320px] overflow-hidden rounded-lg border">
      <SandpackProvider
        key={hydrated ? "client" : "server"}
        template="react-ts"
        theme={resolvedTheme === "light" ? "light" : "dark"}
        files={{
          "/App.tsx": { code },
          "/index.tsx": { code: INDEX_TSX, hidden: true },
          "/public/index.html": { code: INDEX_HTML, hidden: true },
        }}
        options={{
          recompileMode: "delayed",
          recompileDelay: 300,
          classes: {
            "sp-wrapper": "!h-full !rounded-none",
            "sp-layout": "!h-full !rounded-none !border-0",
            "sp-stack": "!h-full",
            "sp-preview": "!h-full",
          },
        }}
      >
        <SandpackLayout style={{ height: "100%" }}>
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton
            style={{ height: "100%", minHeight: 320 }}
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  )
}
