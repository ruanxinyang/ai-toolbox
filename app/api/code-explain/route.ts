import { streamText } from "ai"
import { z } from "zod"

import { ApiError, apiHandler } from "@/lib/api"
import { getModelInfo } from "@/lib/ai/models"
import { getModel } from "@/lib/ai/providers"
import { trackCall, trackUsage } from "@/lib/kv"

export const runtime = "nodejs"
export const maxDuration = 60

const SYSTEM_PROMPT = `你是一名资深的全栈工程师，擅长把复杂代码解释得像和同事白板讨论一样自然。

回答规则：
- 用 Markdown 格式输出，结构清晰
- 总览先来：一句话概括这段代码在做什么
- 然后分块解释：每个关键代码块（不超过 10 个）配上"它做了什么 / 为什么这样写 / 容易踩坑的点"
- 适当用 inline code (\`foo\`) 标记函数名、变量名
- 长引用片段用 \`\`\`lang ... \`\`\` 代码块
- 末尾给一段"改进建议"（≤ 3 条）
- 全程中文，技术名词保留英文
- 不要写废话开场（不要"好的，让我来分析这段代码..."），直接进入分析`

const DEFAULT_MODEL = "anthropic:claude-sonnet-4-6"

const schema = z.object({
  code: z.string().min(1).max(20_000),
  language: z.string().max(40).optional(),
  modelId: z.string().optional(),
})

export const POST = apiHandler(schema, async ({ input, byok }) => {
  const modelId = input.modelId ?? DEFAULT_MODEL
  const info = getModelInfo(modelId)
  if (!info) throw new ApiError("INVALID_INPUT", 400, `未知模型 ${modelId}`)

  const { model } = getModel(modelId, byok)

  void trackCall("code-explain")

  const langHint = input.language ? `语言：${input.language}\n\n` : ""

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    prompt: `${langHint}代码：\n\n\`\`\`${input.language ?? ""}\n${input.code}\n\`\`\``,
    temperature: 0.3,
    onFinish: ({ usage }) => {
      void trackUsage(modelId, usage.inputTokens, usage.outputTokens)
    },
  })

  return result.toTextStreamResponse()
})
