/**
 * Image-only providers (Replicate, etc) live separately from the LLM
 * 4-provider abstraction because they don't fit the LanguageModel interface.
 *
 * BYOK key transport: same `x-byok-<id>` header convention as LLM providers,
 * but kept out of the typed Keychain to avoid leaking image-provider concepts
 * into pure-LLM code paths.
 */

const REPLICATE_BYOK_HEADER = "x-byok-replicate"

export class MissingReplicateKeyError extends Error {
  readonly code = "MISSING_API_KEY"
  readonly provider = "replicate" as const
  constructor() {
    super(
      "未配置 Replicate API Key。设置环境变量 REPLICATE_API_KEY 或通过 x-byok-replicate header 传入。",
    )
  }
}

/** Resolve a Replicate API key from request headers + env. BYOK overrides env. */
export function resolveReplicateKey(headers: Headers): string {
  const byok = headers.get(REPLICATE_BYOK_HEADER)?.trim()
  if (byok) return byok
  const env = process.env.REPLICATE_API_KEY?.trim()
  if (env) return env
  throw new MissingReplicateKeyError()
}
