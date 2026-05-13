import { createAnthropic } from "@ai-sdk/anthropic"
import { createDeepSeek } from "@ai-sdk/deepseek"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import type { LanguageModel } from "ai"

export const PROVIDER_IDS = ["openai", "anthropic", "google", "deepseek"] as const
export type ProviderId = (typeof PROVIDER_IDS)[number]

export type Keychain = Partial<Record<ProviderId, string>>

export const ENV_KEY: Record<ProviderId, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
}

export const PROVIDER_LABEL: Record<ProviderId, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  deepseek: "DeepSeek",
}

export const PROVIDER_DOCS: Record<ProviderId, string> = {
  openai: "https://platform.openai.com/api-keys",
  anthropic: "https://console.anthropic.com/settings/keys",
  google: "https://aistudio.google.com/apikey",
  deepseek: "https://platform.deepseek.com/api_keys",
}

export class MissingApiKeyError extends Error {
  readonly code = "MISSING_API_KEY"
  constructor(readonly provider: ProviderId) {
    super(
      `未配置 ${PROVIDER_LABEL[provider]} 的 API Key。在工具页面右上角的"设置 Key"中填写，或部署时设置环境变量 ${ENV_KEY[provider]}。`,
    )
  }
}

export type KeySource = "byok" | "default" | "missing"

export type KeyResolution = {
  provider: ProviderId
  key: string | undefined
  source: KeySource
}

export function resolveKey(provider: ProviderId, byok: Keychain = {}): KeyResolution {
  const userKey = byok[provider]?.trim()
  if (userKey) return { provider, key: userKey, source: "byok" }
  const envKey = process.env[ENV_KEY[provider]]?.trim()
  if (envKey) return { provider, key: envKey, source: "default" }
  return { provider, key: undefined, source: "missing" }
}

export type ResolvedModel = {
  model: LanguageModel
  provider: ProviderId
  source: KeySource
}

/**
 * Build a LanguageModel for an "<provider>:<modelName>" id.
 *
 * BYOK precedence: a key in `byok` overrides the env-var default.
 * Throws MissingApiKeyError if neither source has a key — callers should
 * surface this as a 4xx (not 5xx) since it's a configuration issue.
 */
export function getModel(modelId: string, byok: Keychain = {}): ResolvedModel {
  const [provider, ...rest] = modelId.split(":")
  if (!PROVIDER_IDS.includes(provider as ProviderId)) {
    throw new Error(`Unknown provider in model id "${modelId}"`)
  }
  const providerId = provider as ProviderId
  const modelName = rest.join(":")
  if (!modelName) {
    throw new Error(`Missing model name in model id "${modelId}" (use "provider:model")`)
  }

  const { key, source } = resolveKey(providerId, byok)
  if (!key) throw new MissingApiKeyError(providerId)

  switch (providerId) {
    case "openai":
      return { model: createOpenAI({ apiKey: key })(modelName), provider: providerId, source }
    case "anthropic":
      return { model: createAnthropic({ apiKey: key })(modelName), provider: providerId, source }
    case "google":
      return {
        model: createGoogleGenerativeAI({ apiKey: key })(modelName),
        provider: providerId,
        source,
      }
    case "deepseek":
      return { model: createDeepSeek({ apiKey: key })(modelName), provider: providerId, source }
  }
}
