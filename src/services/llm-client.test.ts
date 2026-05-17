import { describe, expect, test, vi } from 'vitest'
import { generateFinalAssessmentWithModel, generatePlanWithModel } from './llm-client'
import { buildPlanPromptPayload } from './plan-prompt'
import { buildFinalAssessment, buildFinalAssessmentPromptPayload } from './final-assessment'
import { buildPlanInput } from '@/data/plan-input'
import { LEARNING_METHODS } from '@/data/learning-methods'
import { MODEL_OPTIONS } from '@/data/model-options'
import type { Project } from '@/types'

const promptPayload = buildPlanPromptPayload(buildPlanInput({
  goalType: 'project',
  goalText: 'Learn Rust by building a CLI',
  level: 'beginner',
  intensity: 'steady',
  timeBudget: '5-7h',
  deadline: '6 weeks',
  preferences: ['hands_on'],
  extraNotes: '',
  methods: LEARNING_METHODS.slice(0, 2),
  model: MODEL_OPTIONS[0]!,
  materials: [],
}))

const project: Project = {
  id: 'p1',
  emoji: 'R',
  title: 'Learn Rust',
  goalSummary: 'Build a CLI',
  status: 'active',
  milestoneList: [],
  completedTasks: 1,
  totalTasks: 1,
  lastActive: 'today',
}

describe('llm client', () => {
  test('sends OpenAI-compatible chat completions request and parses JSON response', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Rust CLI Plan',
                emoji: 'R',
                goalSummary: 'Build a CLI.',
                milestones: [
                  {
                    title: 'Basics',
                    successCriteria: 'Explain ownership',
                    tasks: [
                      { kind: 'reading', title: 'Read chapter', estimatedMinutes: 60 },
                    ],
                  },
                ],
              }),
            },
          },
        ],
      }),
    })

    const result = await generatePlanWithModel({
      config: {
        baseUrl: 'https://api.example.com/v1',
        apiKey: 'sk-test',
        model: 'planner-model',
      },
      promptPayload,
      fetcher,
    })

    expect(fetcher).toHaveBeenCalledWith('https://api.example.com/v1/chat/completions', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer sk-test',
      }),
    }))
    expect(result.source).toBe('model')
    expect(result.plan.title).toBe('Rust CLI Plan')
  })

  test('returns fallback plan when model request fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('network down'))

    const result = await generatePlanWithModel({
      config: {
        baseUrl: 'https://api.example.com/v1',
        apiKey: 'sk-test',
        model: 'planner-model',
      },
      promptPayload,
      fetcher,
    })

    expect(result.source).toBe('fallback')
    expect(result.plan.title).toBe('Learn Rust by building a CLI')
  })

  test('generates final assessment with an OpenAI-compatible model response', async () => {
    const fallbackAssessment = buildFinalAssessment(project)
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({ questions: fallbackAssessment.questions }),
            },
          },
        ],
      }),
    })

    const result = await generateFinalAssessmentWithModel({
      config: {
        baseUrl: 'https://api.example.com/v1',
        apiKey: '',
        model: 'assessment-model',
      },
      promptPayload: buildFinalAssessmentPromptPayload(project),
      fallbackAssessment,
      fetcher,
    })

    expect(fetcher).toHaveBeenCalledWith('https://api.example.com/v1/chat/completions', expect.objectContaining({
      method: 'POST',
    }))
    expect(result.source).toBe('model')
    expect(result.assessment.questions).toHaveLength(10)
  })
})
