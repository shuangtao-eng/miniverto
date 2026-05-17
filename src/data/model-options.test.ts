import { describe, expect, test } from 'vitest'
import { getBestPlanningModel, getFreeFriendlyModels } from './model-options'

describe('model options', () => {
  test('recommends the strongest planning model by default', () => {
    const best = getBestPlanningModel()

    expect(best.id).toBe('openai-gpt-4o')
    expect(best.badges).toContain('best-planning')
  })

  test('separates free-friendly models from best-quality recommendations', () => {
    const free = getFreeFriendlyModels()

    expect(free.length).toBeGreaterThan(0)
    expect(free.every((model) => model.freeTier)).toBe(true)
    expect(free.some((model) => model.providerId === 'openrouter')).toBe(true)
  })
})
