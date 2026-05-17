export type ProviderId = 'openai' | 'openrouter' | 'openrelay' | 'ollama' | 'custom'
export type PlatformTarget = 'desktop' | 'mobile'

export interface ProviderConfig {
  providerId: ProviderId
  label: string
  protocol: 'openai-compatible'
  baseUrl: string
  defaultModel: string
  requiresApiKey: boolean
  desktopLocalDefault: boolean
  qualityNote: string
  quotaNote: string
  mobileNote: string
}

export interface ValidationResult {
  ok: boolean
  message?: string
}

export const PROVIDER_CONFIGS: Record<ProviderId, ProviderConfig> = {
  openai: {
    providerId: 'openai',
    label: 'OpenAI',
    protocol: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    requiresApiKey: true,
    desktopLocalDefault: false,
    qualityNote: '最适合复杂学习计划、结构化输出和资料摘要。',
    quotaNote: '使用用户自己的 API key 和额度。',
    mobileNote: 'Windows、macOS、iOS、Android 都可直接使用 HTTPS endpoint。',
  },
  openrouter: {
    providerId: 'openrouter',
    label: 'OpenRouter',
    protocol: 'openai-compatible',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openrouter/free',
    requiresApiKey: true,
    desktopLocalDefault: false,
    qualityNote: '适合统一访问多模型，并可选择免费模型试用。',
    quotaNote: '免费模型和限额随 OpenRouter 当前策略变化。',
    mobileNote: '移动端可直接使用 HTTPS endpoint。',
  },
  openrelay: {
    providerId: 'openrelay',
    label: 'OpenRelay',
    protocol: 'openai-compatible',
    baseUrl: 'http://127.0.0.1:3456/v1',
    defaultModel: 'openrelay-auto',
    requiresApiKey: false,
    desktopLocalDefault: true,
    qualityNote: '本地/远程聚合代理，适合接入用户已有免费额度或多模型路由。',
    quotaNote: '可用性取决于用户本机 OpenRelay、上游账号和模型额度，Miniverto 不承诺稳定免费额度。',
    mobileNote: 'iOS/Android 不应默认使用 localhost；请配置可访问的远程 HTTPS OpenRelay endpoint。',
  },
  ollama: {
    providerId: 'ollama',
    label: 'Ollama',
    protocol: 'openai-compatible',
    baseUrl: 'http://127.0.0.1:11434/v1',
    defaultModel: 'qwen2.5',
    requiresApiKey: false,
    desktopLocalDefault: true,
    qualityNote: '隐私优先，适合本地草案和离线计划。',
    quotaNote: '不消耗云端额度，但质量取决于本地模型和硬件。',
    mobileNote: '移动端通常需要连接远程 Ollama 或改用云端 provider。',
  },
  custom: {
    providerId: 'custom',
    label: 'Custom endpoint',
    protocol: 'openai-compatible',
    baseUrl: 'https://example.com/v1',
    defaultModel: 'custom-model',
    requiresApiKey: true,
    desktopLocalDefault: false,
    qualityNote: '适合高级用户接入公司或自建 OpenAI-compatible 服务。',
    quotaNote: '额度和质量由用户配置的上游服务决定。',
    mobileNote: '建议使用 HTTPS endpoint 以兼容所有平台。',
  },
}

export function getDefaultProviderConfig(providerId: ProviderId): ProviderConfig {
  return PROVIDER_CONFIGS[providerId]
}

export function isLocalhostEndpoint(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl)
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
  } catch {
    return false
  }
}

export function validateProviderConfig(config: ProviderConfig, target: PlatformTarget): ValidationResult {
  if (!config.baseUrl.endsWith('/v1')) {
    return { ok: false, message: 'OpenAI-compatible endpoints should end with /v1.' }
  }
  if (target === 'mobile' && isLocalhostEndpoint(config.baseUrl)) {
    return {
      ok: false,
      message: `${config.label} localhost endpoints are desktop-only; mobile needs a reachable HTTPS endpoint.`,
    }
  }
  return { ok: true }
}
