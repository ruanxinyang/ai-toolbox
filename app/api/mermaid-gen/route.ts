import { generateObject } from "ai"
import { z } from "zod"

import { ApiError, apiHandler } from "@/lib/api"
import { getModelInfo } from "@/lib/ai/models"
import { getModel } from "@/lib/ai/providers"
import { trackCall, trackUsage } from "@/lib/kv"

export const runtime = "nodejs"
export const maxDuration = 30

const DIAGRAM_TYPES = [
  { value: "flowchart", label: "流程图 / Flowchart", hint: "适合算法流程、业务流程" },
  { value: "sequence", label: "时序图 / Sequence", hint: "适合 API 调用、组件交互" },
  { value: "class", label: "类图 / Class", hint: "适合 OOP 结构、数据模型" },
  { value: "state", label: "状态图 / State", hint: "适合状态机、UI 状态切换" },
  { value: "er", label: "ER 图 / ERD", hint: "适合数据库 schema" },
  { value: "mindmap", label: "思维导图 / Mindmap", hint: "适合知识树、决策树" },
  { value: "gantt", label: "甘特图 / Gantt", hint: "适合项目时间线" },
  { value: "git", label: "Git 图 / Git Graph", hint: "适合分支演示" },
] as const

const inputSchema = z.object({
  description: z.string().min(5).max(4000),
  type: z.enum(DIAGRAM_TYPES.map((t) => t.value) as [string, ...string[]]),
  modelId: z.string().optional(),
})

const llmSchema = z.object({
  mermaid: z.string().min(10),
  title: z.string(),
  explanation: z.string(),
})

const DEFAULT_MODEL = "anthropic:claude-sonnet-4-6"

const TYPE_EXAMPLES: Record<string, string> = {
  flowchart: "flowchart TD\n  A[Start] --> B{Decide}\n  B -->|Yes| C[Do thing]\n  B -->|No| D[End]",
  sequence:
    "sequenceDiagram\n  participant U as User\n  participant S as Server\n  U->>S: Request\n  S-->>U: Response",
  class:
    "classDiagram\n  class Animal {\n    +String name\n    +makeSound()\n  }\n  Animal <|-- Dog",
  state: "stateDiagram-v2\n  [*] --> Idle\n  Idle --> Loading: click\n  Loading --> Done",
  er: "erDiagram\n  USER ||--o{ ORDER : places\n  ORDER ||--|{ LINE-ITEM : contains",
  mindmap: "mindmap\n  root((Root))\n    Topic A\n      Detail 1\n    Topic B",
  gantt:
    "gantt\n  title Roadmap\n  dateFormat YYYY-MM-DD\n  section Phase 1\n  Setup :a1, 2026-01-01, 7d",
  git: "gitGraph\n  commit\n  branch develop\n  commit\n  checkout main\n  merge develop",
}

export const POST = apiHandler(inputSchema, async ({ input, byok }) => {
  const modelId = input.modelId ?? DEFAULT_MODEL
  const info = getModelInfo(modelId)
  if (!info) throw new ApiError("INVALID_INPUT", 400, `未知模型 ${modelId}`)

  const { model } = getModel(modelId, byok)

  void trackCall("mermaid-gen")

  const example = TYPE_EXAMPLES[input.type] ?? ""

  const { object, usage } = await generateObject({
    model,
    schema: llmSchema,
    temperature: 0.4,
    prompt: `Generate a valid Mermaid diagram from this description.

Diagram type: ${input.type}
Description:
${input.description}

Example syntax for this type:
${example}

Return JSON with:
- mermaid: the full Mermaid source. MUST start with the correct keyword for "${input.type}".
- title: a short Chinese title for the diagram (≤ 20 chars)
- explanation: 2-3 sentences in Chinese explaining what the diagram shows

Rules for the mermaid field:
- Use valid Mermaid syntax that renders cleanly
- Keep node labels short (≤ 30 chars), no characters that break parsing: \`<\` \`>\` \`&\` need to be in quotes
- Don't wrap output in \`\`\` markdown fences
- Don't add trailing whitespace or extra blank lines`,
  })

  void trackUsage(modelId, usage.inputTokens, usage.outputTokens)

  return Response.json(object)
})
