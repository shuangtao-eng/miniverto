import { describe, expect, test, vi } from 'vitest'
import { deleteApiKey, hasApiKey, saveApiKey } from './api-key'

describe('api key service', () => {
  test('no-ops safely without Tauri invoke', async () => {
    await expect(saveApiKey('openai', 'sk-test', undefined)).resolves.toBeUndefined()
    await expect(hasApiKey('openai', undefined)).resolves.toBe(false)
    await expect(deleteApiKey('openai', undefined)).resolves.toBeUndefined()
  })

  test('uses Tauri commands without returning plaintext', async () => {
    const invoke = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(undefined)

    await saveApiKey('openrouter', 'sk-secret', invoke)
    const exists = await hasApiKey('openrouter', invoke)
    await deleteApiKey('openrouter', invoke)

    expect(exists).toBe(true)
    expect(invoke).toHaveBeenNthCalledWith(1, 'save_api_key', {
      providerId: 'openrouter',
      apiKey: 'sk-secret',
    })
    expect(invoke).toHaveBeenNthCalledWith(2, 'has_api_key', {
      providerId: 'openrouter',
    })
    expect(invoke).toHaveBeenNthCalledWith(3, 'delete_api_key', {
      providerId: 'openrouter',
    })
  })
})
