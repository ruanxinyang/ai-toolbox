import { streamText } from "ai"
import { z } from "zod"

import { ApiError, apiHandler } from "@/lib/api"
import { getModelInfo } from "@/lib/ai/models"
import { getModel } from "@/lib/ai/providers"
import { trackCall, trackUsage } from "@/lib/kv"

export const runtime = "nodejs"
export const maxDuration = 30

// Only used by the "explain request" feature. The actual HTTP fetch is done
// client-side from the browser — no SSRF risk on our backend.

const DEFAULT_MODEL = "anthropic:claude-haiku-4-5-20251001"

const schema = z.object({
  request: z.object({
    method: z.string().max(10),
    url: z.string().url().max(2000),
    headers: z.record(z.string(), z.string()).optional(),
    body: z.string().max(10_000).optional(),
  }),
  target: z.enum(["curl", "fetch", "python", "ts-axios"]),
  modelId: z.string().optional(),
})

const SYSTEM_PROMPT = `你是一个 API 开发助手。把用户的 HTTP 请求转成目标格式的代码片段。

规则：
- 直接输出代码块（用 \`\`\` 包裹），不要加解释开场白
- 代码后用 1-2 句话说明关键点（认证 / Content-Type / 错误处理之类）
- 全程中文
- curl: 使用 -X、-H、-d；多行时用 \\ 续行
- fetch (JS/TS): async/await + 完整错误处理
- python: requests 库
- ts-axios: axios + TypeScript 类型`

export const POST = apiHandler(schema, async ({ input, byok }) => {
  const modelId = input.modelId ?? DEFAULT_MODEL
  const info = getModelInfo(modelId)
  if (!info) throw new ApiError("INVALID_INPUT", 400, `未知模型 ${modelId}`)

  const { model } = getModel(modelId, byok)

  void trackCall("api-debug")

  const prompt = `请把下面这个 HTTP 请求转成 ${input.target} 格式：

\`\`\`http
${input.request.method.toUpperCase()} ${input.request.url}
${Object.entries(input.request.headers ?? {})
  .map(([k, v]) => `${k}: ${v}`)
  .join("\n")}

${input.request.body ?? ""}
\`\`\``

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    prompt,
    temperature: 0.2,
    onFinish: ({ usage }) => {
      void trackUsage(modelId, usage.inputTokens, usage.outputTokens)
    },
  })

  return result.toTextStreamResponse()
})
