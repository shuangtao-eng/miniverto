import { describe, expect, test } from 'vitest'
import type { Project } from '@/types'
import type { PersistedFinalAssessmentResult } from './assessment-results'
import { buildReinforcementPlanInput, createReinforcementProject } from './reinforcement-plan'

const sourceProject: Project = {
  id: 'p1',
  emoji: 'R',
  title: 'Learn Rust',
  goalSummary: 'Build a reliable CLI',
  status: 'active',
  milestoneList: [],
  completedTasks: 9,
  totalTasks: 9,
  lastActive: 'today',
}

const assessment: PersistedFinalAssessmentResult = {
  id: 'a1',
  projectId: 'p1',
  createdAt: 1_775_000_001,
  correct: 7,
  total: 10,
  scorePct: 70,
  level: 'mostly-achieved',
  levelLabel: '大部分达成',
  masterySummary: 'Miniverto 判断：需要继续加强：综合场景、自解释反思。',
  weakBands: ['synthesis', 'reflection'],
  needsContinuation: true,
  nextPlan: {
    title: '7 天补弱强化方案',
    focus: ['综合场景', '自解释反思'],
    durationDays: 7,
  },
}

describe('reinforcement plan', () => {
  test('builds plan input from latest assessment weak areas', () => {
    const input = buildReinforcementPlanInput(sourceProject, assessment)

    expect(input.learner.goalText).toContain('Learn Rust')
    expect(input.learner.goalText).toContain('综合场景')
    expect(input.learner.goalText).toContain('自解释反思')
    expect(input.learner.deadline).toBe('7 天')
    expect(input.learner.preferences).toEqual(expect.arrayContaining(['problem_sets', 'quizzes']))
    expect(input.methods.map((method) => method.id)).toEqual(expect.arrayContaining(['retrieval', 'interleaving']))
  })

  test('creates a distinct reinforcement project that references the source project', () => {
    const project = createReinforcementProject(sourceProject, assessment, {
      id: 'reinforce-p1-a1',
      nowLabel: '刚刚',
    })

    expect(project.id).toBe('reinforce-p1-a1')
    expect(project.title).toContain('Learn Rust')
    expect(project.title).toContain('强化')
    expect(project.goalSummary).toContain('源项目：Learn Rust')
    expect(project.goalSummary).toContain('70%')
    expect(project.totalTasks).toBeGreaterThan(0)
  })
})
