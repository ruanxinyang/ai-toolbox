import type { ProviderId } from "./providers"

export type ModelInfo = {
  id: string // "<provider>:<modelName>"
  provider: ProviderId
  name: string
  /** Cost per 1M input tokens in USD. */
  inputCostPer1M: number
  /** Cost per 1M output tokens in USD. */
  outputCostPer1M: number
  /** Total context window in tokens. */
  contextWindow: number
  supportsVision: boolean
  /** Short positioning tagline for the UI. */
  tagline: string
}

export const MODELS: ModelInfo[] = [
  {
    id: "anthropic:claude-opus-4-7",
    provider: "anthropic",
    name: "Claude Opus 4.7",
    inputCostPer1M: 15,
    outputCostPer1M: 75,
    contextWindow: 1_000_000,
    supportsVision: true,
    tagline: "顶配旗舰 · 复杂推理",
  },
  {
    id: "anthropic:claude-sonnet-4-6",
    provider: "anthropic",
    name: "Claude Sonnet 4.6",
    inputCostPer1M: 3,
    outputCostPer1M: 15,
    contextWindow: 200_000,
    supportsVision: true,
    tagline: "性价比首选 · 视觉强",
  },
  {
    id: "anthropic:claude-haiku-4-5-20251001",
    provider: "anthropic",
    name: "Claude Haiku 4.5",
    inputCostPer1M: 1,
    outputCostPer1M: 5,
    contextWindow: 200_000,
    supportsVision: true,
    tagline: "快且便宜 · 速读首选",
  },
  {
    id: "openai:gpt-4o",
    provider: "openai",
    name: "GPT-4o",
    inputCostPer1M: 2.5,
    outputCostPer1M: 10,
    contextWindow: 128_000,
    supportsVision: true,
    tagline: "OpenAI 通用主力",
  },
  {
    id: "openai:gpt-4o-mini",
    provider: "openai",
    name: "GPT-4o mini",
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    contextWindow: 128_000,
    supportsVision: true,
    tagline: "极致便宜 · 批量任务",
  },
  {
    id: "google:gemini-2.5-pro",
    provider: "google",
    name: "Gemini 2.5 Pro",
    inputCostPer1M: 1.25,
    outputCostPer1M: 10,
    contextWindow: 2_000_000,
    supportsVision: true,
    tagline: "超长上下文 · 多模态",
  },
  {
    id: "google:gemini-2.5-flash",
    provider: "google",
    name: "Gemini 2.5 Flash",
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.3,
    contextWindow: 1_000_000,
    supportsVision: true,
    tagline: "Google 性价比 · 长上下文",
  },
  {
    id: "deepseek:deepseek-chat",
    provider: "deepseek",
    name: "DeepSeek V4",
    inputCostPer1M: 0.27,
    outputCostPer1M: 1.1,
    contextWindow: 128_000,
    supportsVision: false,
    tagline: "中文场景 · 性价比极佳",
  },
]

export const MODELS_BY_ID = new Map(MODELS.map((m) => [m.id, m]))

export function getModelInfo(id: string): ModelInfo | undefined {
  return MODELS_BY_ID.get(id)
}

/**
 * Estimate USD cost from token counts. Returns `null` if model is unknown.
 */
export function estimateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number,
): number | null {
  const info = MODELS_BY_ID.get(modelId)
  if (!info) return null
  return (
    (promptTokens / 1_000_000) * info.inputCostPer1M +
    (completionTokens / 1_000_000) * info.outputCostPer1M
  )
}

/** Default model for each tool — tunable here without touching API routes. */
export const DEFAULT_MODELS = {
  screenshotToCode: "anthropic:claude-sonnet-4-6",
  urlDigest: "anthropic:claude-haiku-4-5-20251001",
  modelCompareInitial: [
    "anthropic:claude-sonnet-4-6",
    "openai:gpt-4o",
    "google:gemini-2.5-flash",
    "deepseek:deepseek-chat",
  ],
} as const
