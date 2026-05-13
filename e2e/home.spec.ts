import { expect, test } from "@playwright/test"

test.describe("home + global layout", () => {
  test("homepage renders hero and 8 tools", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/AI 工具箱/)
    await expect(page.getByRole("heading", { level: 1 })).toContainText("AI 工具箱")

    // Scroll to the tools grid (Hero CTA jumps there).
    await page.locator("#tools").scrollIntoViewIfNeeded()
    const cards = page.locator("#tools li")
    await expect(cards).toHaveCount(8)

    // Each card has the tool name visible.
    for (const expected of [
      "截图转代码",
      "URL 速读",
      "多模型对比",
      "代码解释器",
      "Mermaid 自动生成",
      "PDF 问答",
      "API 调试器",
      "会议纪要",
    ]) {
      await expect(cards.filter({ hasText: expected })).toHaveCount(1)
    }
  })

  test("/about, /stats, /lab, /tools all return 200", async ({ page }) => {
    for (const path of ["/about", "/stats", "/lab", "/tools"]) {
      const response = await page.goto(path)
      expect(response?.status(), `expected 200 for ${path}`).toBeLessThan(400)
    }
  })

  test("unknown path renders 404 fallback", async ({ page }) => {
    const response = await page.goto("/this-path-does-not-exist")
    expect(response?.status()).toBe(404)
    await expect(page.getByText("404 · NOT_FOUND")).toBeVisible()
  })

  test("sitemap + robots are served", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml")
    expect(sitemap.status()).toBe(200)
    expect(await sitemap.text()).toContain("<urlset")
    const robots = await request.get("/robots.txt")
    expect(robots.status()).toBe(200)
    expect(await robots.text()).toContain("User-Agent")
  })
})
