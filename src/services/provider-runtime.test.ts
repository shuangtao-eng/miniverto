import { describe, expect, test, vi } from 'vitest'
import { resolveDefaultRuntimeProvider } from './provider-runtime'

describe('provider runtime resolution', () => {
  test('returns null when no persisted provider exists', async () => {
    const invoke = vi.fn().mockResolvedValue(null)

    await expect(resolveDefaultRuntimeProvider(invoke)).resolves.toBeNull()
  })

  test('allows OpenRelay without api key', async () => {
    const invoke = vi.fn().mockResolvedValue({
      provider_id: 'openrelay',
      base_url: 'http://127.0.0.1:3456/v1',
      model: 'openrelay-auto',
      enabled: true,
      is_default: true,
      updated_at: 1000,
    })

    const provider = await resolveDefaultRuntimeProvider(invoke)

    expect(provider).toMatchObject({
      providerId: 'openrelay',
      baseUrl: 'http://127.0.0.1:3456/v1',
      model: 'openrelay-auto',
      apiKey: '',
    })
  })

  test('requires saved api key for OpenAI-compatible cloud providers', async () => {
    const invoke = vi.fn()
      .mockResolvedValueOnce({
        provider_id: 'openai',
        base_url: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        enabled: true,
        is_default: true,
        updated_at: 1000,
      })
      .mockResolvedValueOnce(false)

    await expect(resolveDefaultRuntimeProvider(invoke)).resolves.toBeNull()
    expect(invoke).toHaveBeenNthCalledWith(2, 'has_api_key', { providerId: 'openai' })
  })
})
