import { describe, expect, test } from 'vitest'
import type { LearningMaterial } from '@/data/materials'
import type { Project } from '@/types'
import {
  buildFinalAssessment,
  buildFinalAssessmentPromptPayload,
  gradeFinalAssessment,
  parseFinalAssessmentJsonResponse,
} from './final-assessment'

const project: Project = {
  id: 'p1',
  emoji: 'R',
  title: 'Learn Rust',
  goalSummary: 'Build a CLI',
  status: 'active',
  milestoneList: [],
  completedTasks: 9,
  totalTasks: 9,
  lastActive: 'today',
}

const contextualProject: Project = {
  ...project,
  goalSummary: 'Build a reliable CLI that parses files and reports actionable errors',
  milestoneList: [
    {
      id: 'm1',
      title: 'CLI foundations',
      successCriteria: 'Can explain ownership choices and handle invalid input',
      tasks: [
        {
          id: 't1',
          kind: 'practice',
          title: 'Implement argument parsing',
          estimatedMinutes: 45,
          acceptanceCriteria: 'Program returns a helpful message for missing flags',
          status: 'completed',
        },
      ],
    },
  ],
}

const materials: LearningMaterial[] = [
  {
    id: 'mat-1',
    name: 'ownership lecture notes.md',
    kind: 'text',
    sizeBytes: 1200,
    status: 'ready',
    selected: true,
    source: 'pasted',
    note: 'Ownership notes: prefer borrowing when the CLI only needs to read parsed input.',
  },
  {
    id: 'mat-2',
    name: 'ignored draft.md',
    kind: 'text',
    sizeBytes: 100,
    status: 'ready',
    selected: false,
    source: 'pasted',
    note: 'This unselected note must not shape the assessment.',
  },
]

describe('final assessment', () => {
  test('builds exactly 10 questions across competency bands', () => {
    const assessment = buildFinalAssessment(project)

    expect(assessment.questions).toHaveLength(10)
    expect(assessment.questions.filter((q) => q.band === 'concept')).toHaveLength(4)
    expect(assessment.questions.filter((q) => q.band === 'application')).toHaveLength(3)
    expect(assessment.questions.filter((q) => q.band === 'synthesis')).toHaveLength(2)
    expect(assessment.questions.filter((q) => q.band === 'reflection')).toHaveLength(1)
  })

  test('grades mastery and recommends continuation plan', () => {
    const assessment = buildFinalAssessment(project)
    const answers = Object.fromEntries(
      assessment.questions.map((q, index) => [q.id, index < 7 ? q.correctOptionId : 'wrong']),
    )

    const result = gradeFinalAssessment(assessment, answers)

    expect(result.scorePct).toBe(70)
    expect(result.level).toBe('mostly-achieved')
    expect(result.needsContinuation).toBe(true)
    expect(result.nextPlan.title).toContain('强化')
  })

  test('personalizes questions with project tasks and selected materials', () => {
    const assessment = buildFinalAssessment(contextualProject, { materials })
    const questionText = assessment.questions.map((q) => `${q.prompt} ${q.sourceHint ?? ''}`).join('\n')

    expect(questionText).toContain('Build a reliable CLI')
    expect(questionText).toContain('Implement argument parsing')
    expect(questionText).toContain('ownership lecture notes.md')
    expect(questionText).toContain('borrowing')
    expect(questionText).not.toContain('ignored draft')
    expect(assessment.questions.every((q) => q.sourceHint)).toBe(true)
  })

  test('builds a model prompt payload with evidence and a strict 10-question schema', () => {
    const payload = buildFinalAssessmentPromptPayload(contextualProject, { materials })

    expect(payload.system).toContain('Miniverto')
    expect(JSON.stringify(payload.input)).toContain('Build a reliable CLI')
    expect(JSON.stringify(payload.input)).toContain('ownership lecture notes.md')
    expect(payload.responseSchema.required).toContain('questions')
    expect(payload.responseSchema.properties.questions.length).toBe(10)
  })

  test('parses model-generated assessment JSON only when every answer is valid', () => {
    const seed = buildFinalAssessment(project)
    const parsed = parseFinalAssessmentJsonResponse(project.id, seed.title, JSON.stringify({
      questions: seed.questions,
    }))

    expect(parsed.questions).toHaveLength(10)
    expect(parsed.questions[0]?.correctOptionId).toBe('a')
    expect(() => parseFinalAssessmentJsonResponse(project.id, seed.title, JSON.stringify({
      questions: seed.questions.map((q, index) => (
        index === 0 ? { ...q, correctOptionId: 'missing' } : q
      )),
    }))).toThrow('valid correctOptionId')
  })
})
