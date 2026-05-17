import type { ProviderConfig, ProviderId } from '@/data/provider-config'
import type { InvokeFn } from './material-ingest'

export interface SavedProviderConfig extends ProviderConfig {
  enabled: boolean
  isDefault: boolean
  updatedAt: number
}

interface PersistedProviderConfig {
  provider_id: ProviderId
  base_url: string
  model: string
  enabled: boolean
  is_default: boolean
  updated_at: number
}

export async function listSavedProviderConfigs(invoke?: InvokeFn): Promise<PersistedProviderConfig[]> {
  if (!invoke) return []
  return await invoke('list_provider_configs') as PersistedProviderConfig[]
}

export async function saveProviderConfig(config: SavedProviderConfig, invoke?: InvokeFn): Promise<void> {
  if (!invoke) return
  await invoke('upsert_provider_config', {
    config: {
      provider_id: config.providerId,
      base_url: config.baseUrl,
      model: config.defaultModel,
      enabled: config.enabled,
      is_default: config.isDefault,
      updated_at: config.updatedAt,
    },
  })
}
