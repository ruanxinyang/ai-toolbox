import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, "")
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // No PII or auth pages to hide; explicitly keep API out of the index.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
