import { describe, expect, test } from 'vitest'
import { buildPlanInput } from './plan-input'
import { LEARNING_METHODS } from './learning-methods'
import { MODEL_OPTIONS } from './model-options'
import type { LearningMaterial } from './materials'

describe('buildPlanInput', () => {
  test('keeps selected ready material summaries and excludes unsupported material', () => {
    const materials: LearningMaterial[] = [
      {
        id: 'm1',
        name: 'course-notes.md',
        kind: 'text',
        sizeBytes: 120,
        status: 'ready',
        selected: true,
        source: 'pasted',
        note: 'Important notes about linear regression.',
      },
      {
        id: 'm2',
        name: 'archive.zip',
        kind: 'unsupported',
        sizeBytes: 999,
        status: 'unsupported',
        selected: true,
        source: 'file',
      },
    ]

    const input = buildPlanInput({
      goalType: 'exam',
      goalText: 'Prepare for a machine learning final',
      level: 'beginner',
      intensity: 'focused',
      timeBudget: '5-7h',
      deadline: '6 weeks',
      preferences: ['problem_sets', 'quizzes'],
      extraNotes: 'Prefer Chinese explanations.',
      learnerProfile: {
        ageRange: '25-34',
        role: 'software engineer',
        purposeDetails: 'Use Rust at work',
        currentSituation: 'Knows TypeScript, new to systems programming',
        priorBackground: 'Has built CLI tools in Node.js',
        studyHabits: 'Prefers evening sessions on desktop',
        devices: 'Windows laptop and Android phone',
        learningEnvironment: 'Commute and quiet home office',
        blockers: 'Limited weekday time',
        successDefinition: 'Ship a working internal CLI',
      },
      methods: LEARNING_METHODS.slice(0, 2),
      model: MODEL_OPTIONS[0]!,
      materials,
    })

    expect(input.materials).toHaveLength(1)
    expect(input.materials[0]).toMatchObject({
      id: 'm1',
      name: 'course-notes.md',
      kind: 'text',
    })
    expect(input.constraints.sendFullFiles).toBe(false)
    expect(input.model.id).toBe('openai-gpt-4o')
    expect(input.learner.profile).toMatchObject({
      ageRange: '25-34',
      role: 'software engineer',
      currentSituation: 'Knows TypeScript, new to systems programming',
      successDefinition: 'Ship a working internal CLI',
    })
  })

  test('includes diagnostic result when provided', () => {
    const input = buildPlanInput({
      goalType: 'project',
      goalText: 'Learn databases',
      level: 'intermediate',
      intensity: 'steady',
      timeBudget: '5-7h',
      deadline: '',
      preferences: ['hands_on'],
      extraNotes: '',
      diagnostic: {
        scorePct: 75,
        levelSignal: 'ready',
        strengths: ['concept', 'application'],
        gaps: ['troubleshooting'],
        evidence: 'Used SQL before but slow at indexing decisions.',
      },
      methods: LEARNING_METHODS.slice(0, 1),
      model: MODEL_OPTIONS[0]!,
      materials: [],
    })

    expect(input.learner.diagnostic?.scorePct).toBe(75)
    expect(input.learner.diagnostic?.gaps).toEqual(['troubleshooting'])
  })
})
