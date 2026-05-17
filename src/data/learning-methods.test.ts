import { describe, expect, test } from 'vitest'
import { recommendLearningMethods } from './learning-methods'

describe('recommendLearningMethods', () => {
  test('prioritizes MIT/PSET and retrieval for exam-heavy learners', () => {
    const methods = recommendLearningMethods({
      outcome: 'exam',
      level: 'beginner',
      intensity: 'focused',
      preferences: ['problem_sets', 'quizzes'],
      hasMaterials: true,
    })

    expect(methods.map((m) => m.id).slice(0, 3)).toEqual([
      'mit_pset',
      'retrieval',
      'spaced',
    ])
  })

  test('prioritizes project-based learning for build outcomes', () => {
    const methods = recommendLearningMethods({
      outcome: 'project',
      level: 'intermediate',
      intensity: 'steady',
      preferences: ['hands_on'],
      hasMaterials: false,
    })

    expect(methods[0]?.id).toBe('project')
    expect(methods.some((m) => m.id === 'coaching')).toBe(true)
  })
})
