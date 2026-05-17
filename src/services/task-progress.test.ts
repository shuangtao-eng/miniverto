import { describe, expect, test, vi } from 'vitest'
import { updatePersistedTaskProgress } from './task-progress'

describe('task progress persistence', () => {
  test('updates task status and note through invoke', async () => {
    const invoke = vi.fn().mockResolvedValue(undefined)

    await updatePersistedTaskProgress({
      taskId: 't1',
      status: 'completed',
      userNote: 'I finally understand it.',
      assessmentHistory: [
        {
          id: 'record-1',
          taskId: 't1',
          createdAt: '2026-04-28T00:00:00.000Z',
          correct: 8,
          total: 10,
          scorePct: 80,
          level: 'mostly-achieved',
          levelLabel: '大部分达标',
          passed: true,
          masterySummary: 'Miniverto判断：80%。',
          weakBands: [],
          needsReinforcement: false,
          nextPlan: {
            title: '进阶迁移方案',
            focus: ['迁移应用'],
            actions: ['做一道迁移题'],
            durationDays: 7,
          },
        },
      ],
      invoke,
    })

    expect(invoke).toHaveBeenCalledWith('update_task_progress', {
      taskId: 't1',
      status: 'completed',
      userNote: 'I finally understand it.',
      assessmentHistoryJson: expect.stringContaining('"scorePct":80'),
    })
  })
})
