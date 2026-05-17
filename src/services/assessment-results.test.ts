import { describe, expect, test, vi } from 'vitest'
import type { FinalAssessmentResult } from './final-assessment'
import {
  getLatestPersistedAssessmentResult,
  upsertPersistedAssessmentResult,
} from './assessment-results'

const result: FinalAssessmentResult = {
  correct: 7,
  total: 10,
  scorePct: 70,
  level: 'mostly-achieved',
  levelLabel: '大部分达成',
  masterySummary: 'Miniverto 判断：需要继续加强。',
  weakBands: ['synthesis', 'reflection'],
  needsContinuation: true,
  nextPlan: {
    title: '7 天补弱强化方案',
    focus: ['综合场景', '自解释反思'],
    durationDays: 7,
  },
}

describe('assessment results persistence', () => {
  test('persists assessment result through invoke using snake_case record fields', async () => {
    const invoke = vi.fn().mockResolvedValue(undefined)

    await upsertPersistedAssessmentResult({
      projectId: 'p1',
      result,
      invoke,
      now: () => 1_775_000_001,
    })

    expect(invoke).toHaveBeenCalledWith('upsert_assessment_result', {
      result: expect.objectContaining({
        project_id: 'p1',
        score_pct: 70,
        weak_bands_json: JSON.stringify(['synthesis', 'reflection']),
        next_plan_focus_json: JSON.stringify(['综合场景', '自解释反思']),
        created_at: 1_775_000_001,
      }),
    })
  })

  test('loads latest assessment result and parses JSON fields', async () => {
    const invoke = vi.fn().mockResolvedValue({
      id: 'assessment-p1-1',
      project_id: 'p1',
      score_pct: 90,
      correct: 9,
      total: 10,
      level: 'achieved',
      level_label: '目标达成',
      mastery_summary: 'Miniverto 判断：可以结项。',
      weak_bands_json: '[]',
      next_plan_title: '进阶挑战方案',
      next_plan_focus_json: '["项目实战"]',
      next_plan_duration_days: 14,
      created_at: 1_775_000_002,
    })

    const loaded = await getLatestPersistedAssessmentResult('p1', invoke)

    expect(invoke).toHaveBeenCalledWith('get_latest_assessment_result', { projectId: 'p1' })
    expect(loaded?.scorePct).toBe(90)
    expect(loaded?.weakBands).toEqual([])
    expect(loaded?.nextPlan.focus).toEqual(['项目实战'])
  })
})
