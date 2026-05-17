import { describe, expect, test } from 'vitest'
import type { Project, Task } from '@/types'
import {
  buildTaskAssessment,
  createTaskAssessmentRecord,
  formatTaskAssessmentNote,
  gradeTaskAssessment,
} from './task-assessment'

const task: Task = {
  id: 'task-1',
  kind: 'practice',
  title: 'Understand ownership transfers',
  estimatedMinutes: 45,
  acceptanceCriteria: 'Explain moves and fix a moved-value error.',
  status: 'in_progress',
  learningContent: {
    overview: 'Miniverto lesson about ownership transfers.',
    keyPoints: ['Owner', 'Move', 'Borrow'],
    steps: ['Read', 'Trace', 'Practice'],
    exercises: ['Fix a moved-value error'],
    reviewPrompt: 'Explain ownership transfer.',
    learningObjectives: [
      {
        id: 'objective-1',
        outcome: 'Explain why a moved binding cannot be reused.',
        evidence: 'Trace two snippets correctly.',
      },
    ],
    practiceSet: [
      {
        id: 'practice-1',
        level: 'challenge',
        prompt: 'Explain and fix a moved-value compiler error.',
        expectedOutcome: 'The learner uses borrowing or cloning intentionally.',
      },
    ],
    completionRubric: [
      {
        criterion: 'Transfer reasoning',
        target: 'Explains ownership transfer without notes.',
      },
    ],
    commonMistakes: [
      {
        mistake: 'Treating moves as copies.',
        correction: 'Check whether the type implements Copy.',
      },
    ],
    quickCheck: ['Who owns the value after a move?'],
  },
}

const project: Project = {
  id: 'project-1',
  emoji: 'R',
  title: 'Learn Rust by building a CLI',
  goalSummary: 'Build a CLI with safe ownership choices.',
  status: 'active',
  milestoneList: [],
  completedTasks: 0,
  totalTasks: 1,
  lastActive: 'today',
}

describe('task assessment', () => {
  test('builds exactly 10 post-lesson questions from task learning content', () => {
    const assessment = buildTaskAssessment(task, project)

    expect(assessment.taskId).toBe('task-1')
    expect(assessment.questions).toHaveLength(10)
    expect(assessment.questions.filter((q) => q.band === 'concept')).toHaveLength(4)
    expect(assessment.questions.filter((q) => q.band === 'application')).toHaveLength(3)
    expect(assessment.questions.filter((q) => q.band === 'synthesis')).toHaveLength(2)
    expect(assessment.questions.filter((q) => q.band === 'reflection')).toHaveLength(1)
    expect(assessment.questions.map((q) => `${q.prompt} ${q.sourceHint ?? ''}`).join('\n')).toContain('moved binding')
  })

  test('grades the result and recommends a follow-up plan when mastery is not enough', () => {
    const assessment = buildTaskAssessment(task, project)
    const answers = Object.fromEntries(
      assessment.questions.map((question, index) => [question.id, index < 6 ? question.correctOptionId : 'wrong']),
    )

    const result = gradeTaskAssessment(assessment, answers)

    expect(result.correct).toBe(6)
    expect(result.total).toBe(10)
    expect(result.scorePct).toBe(60)
    expect(result.passed).toBe(false)
    expect(result.needsReinforcement).toBe(true)
    expect(result.masterySummary).toContain('60%')
    expect(result.nextPlan.focus.length).toBeGreaterThan(0)
    expect(result.nextPlan.actions.length).toBeGreaterThanOrEqual(3)
  })

  test('formats assessment result into a durable task note', () => {
    const assessment = buildTaskAssessment(task, project)
    const answers = Object.fromEntries(assessment.questions.map((question) => [question.id, question.correctOptionId]))
    const result = gradeTaskAssessment(assessment, answers)

    const note = formatTaskAssessmentNote('Existing learner note.', result)

    expect(note).toContain('Existing learner note.')
    expect(note).toContain('Miniverto课后测评')
    expect(note).toContain('100%')
    expect(note).toContain(result.nextPlan.title)
  })

  test('creates a portable assessment history record from a graded result', () => {
    const assessment = buildTaskAssessment(task, project)
    const answers = Object.fromEntries(assessment.questions.map((question) => [question.id, question.correctOptionId]))
    const result = gradeTaskAssessment(assessment, answers)

    const record = createTaskAssessmentRecord('task-1', result, '2026-04-28T00:00:00.000Z')

    expect(record).toMatchObject({
      id: 'task-1-assessment-2026-04-28T00:00:00.000Z',
      taskId: 'task-1',
      createdAt: '2026-04-28T00:00:00.000Z',
      scorePct: 100,
      passed: true,
      needsReinforcement: false,
      nextPlan: expect.objectContaining({
        actions: expect.any(Array),
      }),
    })
  })
})
