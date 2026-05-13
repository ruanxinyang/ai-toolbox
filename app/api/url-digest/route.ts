import { Readability } from "@mozilla/readability"
import { generateObject } from "ai"
import { JSDOM } from "jsdom"
import { z } from "zod"

import { ApiError, apiHandler } from "@/lib/api"
import { DEFAULT_MODELS } from "@/lib/ai/models"
import { getModel } from "@/lib/ai/providers"
import { cacheGet, cacheSet, trackCall, trackUsage } from "@/lib/kv"

export const runtime = "nodejs"
export const maxDuration = 30

const inputSchema = z.object({
  url: z.string().url().max(2000),
  language: z.enum(["zh", "en"]).default("zh"),
  modelId: z.string().optional(),
})

const llmSchema = z.object({
  summary: z.array(z.string().min(1)).min(3).max(5),
  mindmap: z.string().min(10),
  title: z.string(),
  author: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
})

export type UrlDigest = z.infer<typeof llmSchema> & {
  meta: {
    url: string
    wordCount: number
    readingMinutes: number
  }
  source: "cache" | "fresh"
}

async function fetchHtml(url: string): Promise<string> {
  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ai-toolbox/1.0; +https://github.com/ruanxinyang/ai-toolbox)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10_000),
      redirect: "follow",
    })
  } catch (err) {
    throw new ApiError(
      "UPSTREAM_ERROR",
      400,
      `无法访问 URL：${(err as Error).message || "网络错误"}`,
    )
  }
  if (!res.ok) {
    throw new ApiError("UPSTREAM_ERROR", 400, `URL 返回 ${res.status} ${res.statusText}`)
  }
  return await res.text()
}

type Extracted = {
  title: string
  byline: string | null
  textContent: string
  wordCount: number
  readingMinutes: number
}

function extractArticle(html: string, url: string): Extracted {
  let parsed: ReturnType<Readability["parse"]>
  try {
    const dom = new JSDOM(html, { url })
    parsed = new Readability(dom.window.document).parse()
  } catch (err) {
    throw new ApiError(
      "UPSTREAM_ERROR",
      400,
      `内容解析失败：${(err as Error).message || "未知错误"}`,
    )
  }
  if (!parsed || !parsed.textContent) {
    throw new ApiError(
      "INVALID_INPUT",
      400,
      "无法提取正文（可能是 JS 渲染页 / 付费墙 / 非文章页面）",
    )
  }
  const textContent = parsed.textContent.replace(/\s+/g, " ").trim()
  if (textContent.length < 200) {
    throw new ApiError("INVALID_INPUT", 400, "内容过短（< 200 字），无需总结")
  }
  // Word count: Latin words by whitespace + Chinese chars by codepoint.
  const latinWords = textContent.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g)?.length ?? 0
  const cjkChars = textContent.match(/[一-鿿]/g)?.length ?? 0
  const wordCount = latinWords + cjkChars
  const readingMinutes = Math.max(1, Math.round(wordCount / 300))
  return {
    title: parsed.title ?? "Untitled",
    byline: parsed.byline ?? null,
    textContent,
    wordCount,
    readingMinutes,
  }
}

export const POST = apiHandler(inputSchema, async ({ input, byok }) => {
  const cacheKey = `digest:v1:${input.url}:${input.language}`
  const cached = await cacheGet<UrlDigest>(cacheKey)
  if (cached) {
    return Response.json({ ...cached, source: "cache" satisfies UrlDigest["source"] })
  }

  const html = await fetchHtml(input.url)
  const article = extractArticle(html, input.url)

  const truncated = article.textContent.slice(0, 12_000)
  const modelId = input.modelId ?? DEFAULT_MODELS.urlDigest
  const { model } = getModel(modelId, byok)

  void trackCall("url-digest")

  const targetLang = input.language === "zh" ? "Simplified Chinese" : "English"
  const { object, usage } = await generateObject({
    model,
    schema: llmSchema,
    temperature: 0.3,
    prompt: `Analyze this article and respond in ${targetLang}.

URL: ${input.url}
Title from page: ${article.title}
${article.byline ? `Author: ${article.byline}\n` : ""}
Article content:
${truncated}

Generate JSON with these fields:
1. summary: array of 3-5 bullet points capturing the main insights (each 1-2 sentences)
2. mindmap: a valid Mermaid 'mindmap' diagram string showing article structure, at least 2 levels deep. Use this exact format:
mindmap
  root((Short title))
    Main Topic A
      Sub-point 1
      Sub-point 2
    Main Topic B
      Sub-point 3
3. title: the article's title (clean it up if the page title has noise like " | Site Name")
4. author: the author's name if mentioned, else null
5. publishedAt: ISO date (YYYY-MM-DD) if mentioned in the article, else null

Critical rules for mindmap:
- Start with "mindmap" on its own line
- Use 2-space indentation per level
- Root uses double-parens: root((Text))
- Keep node text under 40 chars, no special characters that would break Mermaid syntax`,
  })

  const result: UrlDigest = {
    ...object,
    meta: {
      url: input.url,
      wordCount: article.wordCount,
      readingMinutes: article.readingMinutes,
    },
    source: "fresh",
  }

  await cacheSet(cacheKey, result, { ttlSec: 24 * 3600 })
  void trackUsage(modelId, usage.inputTokens, usage.outputTokens)

  return Response.json(result)
})
