import { PROVIDER_CONFIGS, type ProviderId } from '@/data/provider-config'
import type { OpenAICompatibleConfig } from './llm-client'
import type { InvokeFn } from './material-ingest'

interface PersistedProviderConfig {
  provider_id: ProviderId
  base_url: string
  model: string
  enabled: boolean
  is_default: boolean
}

export interface RuntimeProvider extends OpenAICompatibleConfig {
  providerId: ProviderId
}

export async function resolveDefaultRuntimeProvider(invoke?: InvokeFn): Promise<RuntimeProvider | null> {
  if (!invoke) return null
  const persisted = await invoke('get_default_provider_config') as PersistedProviderConfig | null
  if (!persisted || !persisted.enabled) return null

  const providerConfig = PROVIDER_CONFIGS[persisted.provider_id]
  if (!providerConfig) return null

  if (providerConfig.requiresApiKey) {
    const hasKey = await invoke('has_api_key', { providerId: persisted.provider_id }) as boolean
    if (!hasKey) return null
  }

  return {
    providerId: persisted.provider_id,
    baseUrl: persisted.base_url,
    model: persisted.model,
    apiKey: providerConfig.requiresApiKey ? '__KEYCHAIN__' : '',
  }
}
