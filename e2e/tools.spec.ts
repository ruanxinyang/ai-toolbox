import { expect, test } from "@playwright/test"

const TOOL_PATHS = [
  { path: "/tools/screenshot-to-code", heading: "截图转代码" },
  { path: "/tools/url-digest", heading: "URL 速读" },
  { path: "/tools/model-compare", heading: "多模型对比" },
  { path: "/tools/code-explain", heading: "代码解释器" },
  { path: "/tools/mermaid-gen", heading: "Mermaid 自动生成" },
  { path: "/tools/pdf-qa", heading: "PDF 问答" },
  { path: "/tools/api-debug", heading: "API 调试器" },
  { path: "/tools/meeting-notes", heading: "会议纪要" },
]

test.describe("tool pages render their entry UI", () => {
  for (const { path, heading } of TOOL_PATHS) {
    test(`${path} renders heading "${heading}"`, async ({ page }) => {
      await page.goto(path)
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading)
    })
  }
})

test("API debugger sends a real request and shows response body", async ({ page }) => {
  await page.goto("/tools/api-debug")
  // Hit a public, CORS-friendly endpoint.
  const urlInput = page.getByPlaceholder("https://api.example.com/...")
  await urlInput.fill("https://httpbin.org/get?ai-toolbox=ok")
  await page.getByRole("button", { name: /发送/ }).click()
  // Wait for the status badge (e.g., "200 OK").
  await expect(page.getByText(/^2\d\d /)).toBeVisible({ timeout: 15_000 })
  // Body should contain the query echo.
  await expect(page.locator("pre")).toContainText(/ai-toolbox/)
})

test("locale switch flips Hero text to English", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: /切换语言|Switch language/ }).click()
  await expect(page.getByRole("heading", { level: 1 })).toContainText("AI tools built for")
})
