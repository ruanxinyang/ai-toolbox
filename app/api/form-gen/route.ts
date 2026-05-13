import { generateObject } from "ai"
import { z } from "zod"

import { ApiError, apiHandler } from "@/lib/api"
import { getModelInfo } from "@/lib/ai/models"
import { getModel } from "@/lib/ai/providers"
import { trackCall, trackUsage } from "@/lib/kv"

export const runtime = "nodejs"
export const maxDuration = 60

const DEFAULT_MODEL = "anthropic:claude-sonnet-4-6"

const inputSchema = z.object({
  description: z.string().min(5).max(2000),
  modelId: z.string().optional(),
})

const fieldSchema = z.object({
  name: z.string().describe("camelCase 字段名"),
  label: z.string().describe("展示用 label，中文"),
  type: z.enum([
    "text",
    "email",
    "password",
    "number",
    "tel",
    "url",
    "textarea",
    "select",
    "checkbox",
    "radio",
    "date",
  ]),
  required: z.boolean(),
  placeholder: z.string().optional().nullable(),
  zod: z.string().describe("对应的 Zod 验证表达式，例如 `z.string().min(2).max(50)`"),
  options: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional()
    .nullable()
    .describe("仅 select / radio 用"),
})

const llmSchema = z.object({
  title: z.string().describe("表单标题，中文，≤ 15 字"),
  submitLabel: z.string().describe("提交按钮文案，中文，例如 '注册' / '提交反馈'"),
  fields: z.array(fieldSchema).min(1).max(15),
  notes: z.string().describe("一句话说明：这个表单适合什么场景，使用了哪些校验"),
})

export type FormGenResult = z.infer<typeof llmSchema>

export const POST = apiHandler(inputSchema, async ({ input, byok }) => {
  const modelId = input.modelId ?? DEFAULT_MODEL
  const info = getModelInfo(modelId)
  if (!info) throw new ApiError("INVALID_INPUT", 400, `未知模型 ${modelId}`)

  const { model } = getModel(modelId, byok)
  void trackCall("form-gen")

  const { object, usage } = await generateObject({
    model,
    schema: llmSchema,
    temperature: 0.3,
    prompt: `根据下面的描述生成一个 React 表单的字段定义。

描述：
${input.description}

规则：
- fields 数组最多 15 条；只包括用户描述里明确提到或合理推断需要的字段
- 字段名用 camelCase（例如 firstName，不要 first_name 或 FirstName）
- label 用中文（除非描述里特别要求英文）
- 每个字段的 zod 字段必须是有效的 Zod 表达式字符串（不是 JSON）
- 邮箱用 z.string().email()
- 手机用 z.string().regex(...).optional()
- 密码用 z.string().min(8)
- options 只在 select / radio 类型有意义
- type 必须是这十一种之一：text, email, password, number, tel, url, textarea, select, checkbox, radio, date`,
  })

  void trackUsage(modelId, usage.inputTokens, usage.outputTokens)
  return Response.json(object)
})
