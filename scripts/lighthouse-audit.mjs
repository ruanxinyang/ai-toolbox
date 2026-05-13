#!/usr/bin/env node
/**
 * Lighthouse audit for the local dev server (or a deployed URL).
 *
 *   pnpm lighthouse                          # mobile @ http://localhost:3000
 *   pnpm lighthouse https://my.site          # any URL
 *   pnpm lighthouse:desktop                  # desktop preset
 *   LH_NO_PNG=1 pnpm lighthouse              # skip PNG screenshot
 *
 * Writes to docs/:
 *   lighthouse.html   — interactive report (open in browser)
 *   lighthouse.json   — machine-readable
 *   lighthouse.png    — score panel screenshot (via puppeteer-core)
 *
 * Exits with code 1 if any category < 95.
 */

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const url = process.argv[2] ?? "http://localhost:3000"
const formFactor = process.env.LH_FORM === "desktop" ? "desktop" : "mobile"
const skipPng = process.env.LH_NO_PNG === "1"
const TARGET = 95

console.log(`▸ Lighthouse audit (${formFactor}): ${url}`)

const lighthouse = (await import("lighthouse")).default
const chromeLauncher = await import("chrome-launcher")

const chrome = await chromeLauncher.launch({
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
})

try {
  const result = await lighthouse(url, {
    port: chrome.port,
    output: ["html", "json"],
    formFactor,
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    logLevel: "error",
    screenEmulation:
      formFactor === "desktop"
        ? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }
        : undefined,
  })

  if (!result) throw new Error("Lighthouse returned no result")

  const [htmlReport, jsonReport] = result.report
  await mkdir("docs", { recursive: true })
  const htmlPath = path.resolve("docs/lighthouse.html")
  await writeFile(htmlPath, htmlReport)
  await writeFile("docs/lighthouse.json", jsonReport)

  // Pretty-print scores to terminal.
  const categories = result.lhr.categories
  let allPass = true
  console.log()
  console.log("Category               Score   Status")
  console.log("─".repeat(44))
  for (const key of ["performance", "accessibility", "best-practices", "seo"]) {
    const score = Math.round((categories[key].score ?? 0) * 100)
    const label = categories[key].title.padEnd(22)
    const status = score >= TARGET ? "✓ PASS" : "✗ FAIL"
    if (score < TARGET) allPass = false
    console.log(`${label} ${String(score).padStart(3)}    ${status}`)
  }
  console.log("─".repeat(44))
  console.log()

  // Screenshot the scores panel as PNG. Reuse the already-launched Chrome via
  // puppeteer-core's connect-over-CDP — no second browser to download.
  if (!skipPng) {
    try {
      const puppeteer = (await import("puppeteer-core")).default
      const browser = await puppeteer.connect({
        browserURL: `http://localhost:${chrome.port}`,
        defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 2 },
      })
      const page = await browser.newPage()
      await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0", timeout: 30_000 })
      // Wait for Lighthouse's score-gauge components to render.
      await page.waitForSelector(".lh-scores-container", { timeout: 10_000 })
      const panel = await page.$(".lh-scores-container")
      if (panel) {
        await panel.screenshot({ path: "docs/lighthouse.png", omitBackground: false })
        console.log("Scoreboard PNG → docs/lighthouse.png")
      } else {
        console.warn("(.lh-scores-container not found; PNG skipped)")
      }
      await page.close()
      browser.disconnect()
    } catch (err) {
      console.warn("PNG screenshot failed (non-fatal):", (err && err.message) || err)
    }
  }

  console.log()
  console.log("Reports written to:")
  console.log("  docs/lighthouse.html  (open in browser for full report)")
  console.log("  docs/lighthouse.json")
  if (!skipPng) console.log("  docs/lighthouse.png   (score panel — uncomment in README)")

  process.exitCode = allPass ? 0 : 1
} finally {
  await chrome.kill()
}
