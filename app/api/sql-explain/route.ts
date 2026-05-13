import { streamText } from "ai"
import { z } from "zod"

import { ApiError, apiHandler } from "@/lib/api"
import { getModelInfo } from "@/lib/ai/models"
import { getModel } from "@/lib/ai/providers"
import { trackCall, trackUsage } from "@/lib/kv"

export const runtime = "nodejs"
export const maxDuration = 30

const DEFAULT_MODEL = "anthropic:claude-sonnet-4-6"

const inputSchema = z.object({
  sql: z.string().min(10).max(10_000),
  dialect: z
    .enum(["postgres", "mysql", "sqlite", "mssql", "bigquery", "generic"])
    .default("generic"),
  modelId: z.string().optional(),
})

const SYSTEM_PROMPT = `你是一名资深 DBA + 后端工程师。用户粘了一段 SQL，你要做三件事：

1. **概览**：一句话说这条 SQL 做什么（业务视角）
2. **逐子句拆解**：用 markdown 列表把 SELECT / FROM / JOIN / WHERE / GROUP BY / ORDER BY / 子查询 / CTE 都讲清楚，每条配一句"为什么这样写 / 等价方式"
3. **审查意见**：
   - 性能：缺索引提示、笛卡尔积风险、N+1 模式、子查询能否改 JOIN、是否需要 EXPLAIN
   - 正确性：NULL 处理、JOIN 类型、隐式类型转换
   - 风格：命名 / 大小写 / 缩进
   - 没有问题就直说"这条 SQL 写得很好"

格式：
- 全程中文，技术名词保留英文
- 用 Markdown 二级标题分块
- SQL 代码块用 \`\`\`sql ... \`\`\` 包裹
- 不要废话开场白`

export const POST = apiHandler(inputSchema, async ({ input, byok }) => {
  const modelId = input.modelId ?? DEFAULT_MODEL
  const info = getModelInfo(modelId)
  if (!info) throw new ApiError("INVALID_INPUT", 400, `未知模型 ${modelId}`)

  const { model } = getModel(modelId, byok)
  void trackCall("sql-explain")

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    prompt: `Dialect: ${input.dialect}\n\nSQL:\n\`\`\`sql\n${input.sql}\n\`\`\``,
    temperature: 0.2,
    onFinish: ({ usage }) => {
      void trackUsage(modelId, usage.inputTokens, usage.outputTokens)
    },
  })

  return result.toTextStreamResponse()
})
