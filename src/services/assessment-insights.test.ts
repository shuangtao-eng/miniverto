import { describe, expect, test } from 'vitest'
import type { Project } from '@/types'
import { buildAssessmentInsights } from './assessment-insights'

const project: Project = {
  id: 'project-1',
  emoji: 'R',
  title: 'Learn Rust',
  goalSummary: 'Build a CLI',
  status: 'active',
  completedTasks: 2,
  totalTasks: 3,
  lastActive: 'today',
  milestoneList: [
    {
      id: 'm1',
      title: 'Basics',
      successCriteria: 'Explain ownership',
      tasks: [
        {
          id: 't1',
          kind: 'reading',
          title: 'Ownership basics',
          estimatedMinutes: 30,
          status: 'completed',
          assessmentHistory: [
            {
              id: 'r1',
              taskId: 't1',
              createdAt: '2026-04-28T08:00:00.000Z',
              correct: 6,
              total: 10,
              scorePct: 60,
              level: 'basic',
              levelLabel: 'Basic',
              passed: false,
              masterySummary: 'Needs work',
              weakBands: ['concept'],
              needsReinforcement: true,
              nextPlan: {
                title: 'Review ownership',
                focus: ['Concept'],
                actions: ['Explain owner and move'],
                durationDays: 3,
              },
            },
            {
              id: 'r2',
              taskId: 't1',
              createdAt: '2026-04-29T08:00:00.000Z',
              correct: 8,
              total: 10,
              scorePct: 80,
              level: 'mostly-achieved',
              levelLabel: 'Mostly achieved',
              passed: true,
              masterySummary: 'Improved',
              weakBands: [],
              needsReinforcement: false,
              nextPlan: {
                title: 'Transfer practice',
                focus: ['Application'],
                actions: ['Solve another example'],
                durationDays: 7,
              },
            },
          ],
        },
        {
          id: 't2',
          kind: 'practice',
          title: 'Borrowing practice',
          estimatedMinutes: 45,
          status: 'completed',
          assessmentHistory: [
            {
              id: 'r3',
              taskId: 't2',
              createdAt: '2026-04-30T08:00:00.000Z',
              correct: 7,
              total: 10,
              scorePct: 70,
              level: 'mostly-achieved',
              levelLabel: 'Mostly achieved',
              passed: false,
              masterySummary: 'Needs application review',
              weakBands: ['application'],
              needsReinforcement: true,
              nextPlan: {
                title: 'Review borrowing',
                focus: ['Application'],
                actions: ['Redo application practice'],
                durationDays: 3,
              },
            },
          ],
        },
        {
          id: 't3',
          kind: 'reflection',
          title: 'Explain tradeoffs',
          estimatedMinutes: 20,
          status: 'pending',
        },
      ],
    },
  ],
}

describe('assessment insights', () => {
  test('builds ordered mastery trend points from task assessment history', () => {
    const insights = buildAssessmentInsights(project)

    expect(insights.points.map((point) => point.recordId)).toEqual(['r1', 'r2', 'r3'])
    expect(insights.latestScorePct).toBe(70)
    expect(insights.averageScorePct).toBe(70)
    expect(insights.completedAssessmentCount).toBe(3)
    expect(insights.masteryLabel).toBe('需要加强')
  })

  test('detects review triggers from latest task results below threshold', () => {
    const insights = buildAssessmentInsights(project, { thresholdPct: 80 })

    expect(insights.reviewTriggers).toEqual([
      expect.objectContaining({
        taskId: 't2',
        taskTitle: 'Borrowing practice',
        scorePct: 70,
        focus: ['Application'],
        action: 'Redo application practice',
      }),
    ])
  })
})
