import { describe, expect, test, vi } from 'vitest'
import { listSavedProviderConfigs, saveProviderConfig } from './provider-settings'
import { getDefaultProviderConfig } from '@/data/provider-config'

describe('provider settings service', () => {
  test('returns empty list without Tauri invoke', async () => {
    await expect(listSavedProviderConfigs(undefined)).resolves.toEqual([])
  })

  test('saves non-sensitive provider config through Tauri', async () => {
    const invoke = vi.fn().mockResolvedValue(undefined)
    const config = {
      ...getDefaultProviderConfig('openrelay'),
      isDefault: true,
      enabled: true,
      updatedAt: 1000,
    }

    await saveProviderConfig(config, invoke)

    expect(invoke).toHaveBeenCalledWith('upsert_provider_config', {
      config: {
        provider_id: 'openrelay',
        base_url: 'http://127.0.0.1:3456/v1',
        model: 'openrelay-auto',
        enabled: true,
        is_default: true,
        updated_at: 1000,
      },
    })
  })
})
