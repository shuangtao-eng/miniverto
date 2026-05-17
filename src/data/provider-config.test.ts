import { describe, expect, test } from 'vitest'
import { getDefaultProviderConfig, isLocalhostEndpoint, validateProviderConfig } from './provider-config'

describe('provider config', () => {
  test('provides OpenRelay as OpenAI-compatible proxy with localhost desktop default', () => {
    const config = getDefaultProviderConfig('openrelay')

    expect(config.providerId).toBe('openrelay')
    expect(config.protocol).toBe('openai-compatible')
    expect(config.baseUrl).toContain('/v1')
    expect(config.desktopLocalDefault).toBe(true)
  })

  test('detects localhost endpoints', () => {
    expect(isLocalhostEndpoint('http://127.0.0.1:3456/v1')).toBe(true)
    expect(isLocalhostEndpoint('http://localhost:3456/v1')).toBe(true)
    expect(isLocalhostEndpoint('https://relay.example.com/v1')).toBe(false)
  })

  test('warns when OpenRelay localhost is used for mobile target', () => {
    const config = getDefaultProviderConfig('openrelay')
    const result = validateProviderConfig(config, 'mobile')

    expect(result.ok).toBe(false)
    expect(result.message).toContain('mobile')
  })
})
