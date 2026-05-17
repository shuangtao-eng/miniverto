import { describe, expect, test } from 'vitest'
import type { Task } from '@/types'
import { getTaskGuidance, getTaskAcceptanceCriteria } from './task-guidance'

const task: Task = {
  id: 't1',
  kind: 'practice',
  title: '完成练习题',
  estimatedMinutes: 45,
  status: 'pending',
}

describe('task guidance', () => {
  test('provides fallback guidance when generated task has no detail fields', () => {
    expect(getTaskGuidance(task)).toContain('Miniverto')
    expect(getTaskGuidance(task)).toContain('完成练习题')
    expect(getTaskAcceptanceCriteria(task)).toContain('可检查产出')
  })

  test('keeps model-generated detail when available', () => {
    const detailedTask = {
      ...task,
      description: 'Model detail',
      acceptanceCriteria: 'Model acceptance',
    }

    expect(getTaskGuidance(detailedTask)).toBe('Model detail')
    expect(getTaskAcceptanceCriteria(detailedTask)).toBe('Model acceptance')
  })
})
