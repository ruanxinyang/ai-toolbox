import type { MetadataRoute } from "next"

import { siteConfig, tools } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "")
  const now = new Date()
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/tools`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/playground`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/lab`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/stats`, lastModified: now, changeFrequency: "daily", priority: 0.4 },
  ]
  const toolRoutes: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: `${base}${tool.href}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }))
  return [...staticRoutes, ...toolRoutes]
}
