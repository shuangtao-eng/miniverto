import { describe, expect, test } from 'vitest'
import { buildPlanPromptPayload, parsePlanJsonResponse } from './plan-prompt'
import { buildPlanInput } from '@/data/plan-input'
import { LEARNING_METHODS } from '@/data/learning-methods'
import { MODEL_OPTIONS } from '@/data/model-options'

const planInput = buildPlanInput({
  goalType: 'project',
  goalText: 'Learn Rust by building a CLI',
  level: 'beginner',
  intensity: 'steady',
  timeBudget: '5-7h',
  deadline: '6 weeks',
  preferences: ['hands_on', 'quizzes'],
  extraNotes: 'Prefer Chinese explanations.',
  methods: LEARNING_METHODS.slice(0, 3),
  model: MODEL_OPTIONS[0]!,
  materials: [],
})

const personalizedInput = buildPlanInput({
  goalType: 'career',
  goalText: 'Become a frontend engineer',
  level: 'intermediate',
  intensity: 'focused',
  timeBudget: '8-12h',
  deadline: '10 weeks',
  preferences: ['hands_on'],
  extraNotes: '',
  learnerProfile: {
    purposeDetails: '转行求职：需要作品集和面试准备',
    blockers: '时间少、缺少反馈',
    schedulePattern: '工作日晚间 45 分钟，周末 3 小时',
    sessionLength: '25 minutes per session',
    deviceContext: 'Windows laptop and phone during commute',
    learningPreferenceDetail: '先看例子，再做项目练习',
    supportPreference: '每一步都需要检查点和提示',
    baselineConfidence: 'can read examples but cannot build alone',
    targetScenario: '3 个月内投递初级前端岗位',
    contentDepth: '需要直接可学的课程内容',
  },
  methods: LEARNING_METHODS.slice(0, 2),
  model: MODEL_OPTIONS[0]!,
  materials: [],
})

describe('plan prompt layer', () => {
  test('builds a stable Miniverto prompt payload without full files', () => {
    const payload = buildPlanPromptPayload(planInput)

    expect(payload.system).toContain('Miniverto')
    expect(payload.responseSchema.version).toBe(2)
    expect(payload.input.constraints.sendFullFiles).toBe(false)
    expect(payload.input.learner.goalText).toBe('Learn Rust by building a CLI')
    expect(JSON.stringify(payload.responseSchema)).toContain('learningContent')
    expect(JSON.stringify(payload.responseSchema)).toContain('lessonBlocks')
    expect(JSON.stringify(payload.responseSchema)).toContain('mediaSuggestions')
    expect(JSON.stringify(payload.responseSchema)).toContain('learningObjectives')
    expect(JSON.stringify(payload.responseSchema)).toContain('workedExample')
    expect(JSON.stringify(payload.responseSchema)).toContain('practiceSet')
    expect(JSON.stringify(payload.responseSchema)).toContain('commonMistakes')
    expect(JSON.stringify(payload.responseSchema)).toContain('completionRubric')
    expect(JSON.stringify(payload.responseSchema)).toContain('materialCitations')
    expect(JSON.stringify(payload.responseSchema)).toContain('citationIds')
    expect(JSON.stringify(payload.responseSchema)).toContain('recommendedReferences')
    expect(JSON.stringify(payload.responseSchema)).toContain('prerequisites')
    expect(JSON.stringify(payload.responseSchema)).toContain('glossary')
    expect(JSON.stringify(payload.responseSchema)).toContain('deliverable')
    expect(JSON.stringify(payload.responseSchema)).toContain('teachingScript')
    expect(JSON.stringify(payload.responseSchema)).toContain('answerKey')
    expect(JSON.stringify(payload.responseSchema)).toContain('reviewCards')
    expect(JSON.stringify(payload.responseSchema)).toContain('nextStepHint')
  })

  test('asks the model to tailor lessons from detailed learner profile', () => {
    const payload = buildPlanPromptPayload(personalizedInput)
    const serialized = JSON.stringify(payload)

    expect(payload.system).toContain('tailor')
    expect(payload.system).toContain('learner profile')
    expect(serialized).toContain('工作日晚间 45 分钟，周末 3 小时')
    expect(serialized).toContain('targetScenario')
    expect(serialized).toContain('contentDepth')
    expect(serialized).toContain('sessionLength')
    expect(serialized).toContain('deviceContext')
    expect(serialized).toContain('baselineConfidence')
    expect(serialized).toContain('25 minutes per session')
    expect(serialized).toContain('Windows laptop and phone during commute')
    expect(serialized).toContain('can read examples but cannot build alone')
    expect(serialized).toContain('personalizationNotes')
  })

  test('parses valid plan JSON response', () => {
    const response = parsePlanJsonResponse(JSON.stringify({
      title: 'Learn Rust by building a CLI',
      emoji: 'R',
      goalSummary: 'Build a CLI in six weeks.',
      criticScore: 8.8,
      milestones: [
        {
          title: 'Basics',
          successCriteria: 'Explain ownership',
          tasks: [
            {
              kind: 'reading',
              title: 'Read ownership chapter',
              estimatedMinutes: 60,
              learningContent: {
                overview: 'Miniverto guide to ownership.',
                prerequisites: ['Can explain what a variable binding is'],
                glossary: [
                  {
                    term: 'Ownership',
                    meaning: 'The rule that each value has exactly one owner.',
                    example: 'let b = a moves ownership when the value is not Copy.',
                  },
                ],
                deliverable: {
                  title: 'Ownership error explanation',
                  format: 'Short annotated code note',
                  acceptanceCheck: 'Explains why the old binding cannot be used after the move.',
                },
                teachingScript: [
                  {
                    id: 'teach-1',
                    title: 'Ownership rule',
                    body: 'Each value has one active owner, and moves transfer that owner.',
                    example: 'After let b = a, b owns the String and a cannot be used.',
                  },
                ],
                answerKey: [
                  {
                    practiceId: 'practice-1',
                    expectedAnswer: 'The new binding owns the value after the move.',
                    checkMethod: 'The answer names the active owner after each line.',
                  },
                ],
                reviewCards: [
                  {
                    front: 'What happens after a move?',
                    back: 'The new binding owns the value and the old binding is invalid.',
                    tag: 'ownership',
                  },
                ],
                nextStepHint: 'Practice borrowing next so ownership transfer is not overused.',
                keyPoints: ['Moves', 'Borrowing', 'Lifetimes'],
                steps: ['Read the core example', 'Explain it without notes'],
                exercises: ['Predict whether a move compiles'],
                reviewPrompt: 'Explain ownership in one minute.',
                learningObjectives: [
                  {
                    id: 'objective-1',
                    outcome: 'Explain why moves invalidate the previous binding.',
                    evidence: 'Correctly annotate two move examples.',
                  },
                ],
                conceptMap: [
                  {
                    id: 'owner',
                    title: 'Owner',
                    description: 'The binding responsible for cleanup.',
                    links: ['move'],
                  },
                  {
                    id: 'move',
                    title: 'Move',
                    description: 'Transfers ownership to another binding.',
                    links: ['owner'],
                  },
                ],
                workedExample: {
                  title: 'Trace a String move',
                  scenario: 'A String is assigned to another variable.',
                  steps: ['Create the value', 'Move it to the new binding', 'Reject access from the old binding'],
                  takeaway: 'After a move, only the new binding owns the value.',
                },
                practiceSet: [
                  {
                    id: 'practice-1',
                    level: 'foundation',
                    prompt: 'Mark the owner after each line.',
                    expectedOutcome: 'The learner identifies the active owner.',
                  },
                  {
                    id: 'practice-2',
                    level: 'application',
                    prompt: 'Rewrite a snippet to borrow instead of move.',
                    expectedOutcome: 'The code keeps the original binding usable.',
                  },
                  {
                    id: 'practice-3',
                    level: 'challenge',
                    prompt: 'Explain a compiler error about moved value.',
                    expectedOutcome: 'The learner explains and fixes the error.',
                  },
                ],
                commonMistakes: [
                  {
                    mistake: 'Treating a move like a copy.',
                    correction: 'Check whether the type implements Copy before reusing the old binding.',
                  },
                ],
                completionRubric: [
                  {
                    criterion: 'Concept recall',
                    target: 'Explains owner, move, and borrow without notes.',
                  },
                ],
                lessonBlocks: [
                  {
                    id: 'concept',
                    type: 'concept',
                    title: 'Ownership mental model',
                    body: 'Ownership decides who is responsible for cleanup.',
                    bullets: ['One owner at a time'],
                    mediaSuggestionIds: ['diagram-1'],
                    citationIds: ['citation-1'],
                  },
                ],
                materialCitations: [
                  {
                    id: 'citation-1',
                    materialId: 'material-1',
                    materialName: 'Ownership workshop notes.md',
                    summary: 'The learner confuses moves with copies.',
                    reason: 'Use this note to focus the explanation on transfer mistakes.',
                  },
                ],
                mediaSuggestions: [
                  {
                    id: 'diagram-1',
                    type: 'diagram',
                    title: 'Ownership transfer diagram',
                    purpose: 'Show move semantics visually.',
                    promptOrQuery: 'Rust ownership transfer diagram',
                    placement: 'concept',
                  },
                ],
                quickCheck: ['Who owns the value after a move?'],
              },
              recommendedReferences: [
                {
                  id: 'rust-book',
                  type: 'book',
                  title: 'The Rust Book',
                  reason: 'Official beginner-friendly reference.',
                  difficulty: 'beginner',
                },
              ],
            },
          ],
        },
      ],
    }))

    expect(response.milestones[0]?.tasks[0]).toMatchObject({
      kind: 'reading',
      estimatedMinutes: 60,
      status: 'pending',
      learningContent: expect.objectContaining({
        overview: 'Miniverto guide to ownership.',
        prerequisites: ['Can explain what a variable binding is'],
        glossary: expect.arrayContaining([
          expect.objectContaining({ term: 'Ownership' }),
        ]),
        deliverable: expect.objectContaining({
          title: 'Ownership error explanation',
          format: 'Short annotated code note',
        }),
        teachingScript: expect.arrayContaining([
          expect.objectContaining({ title: 'Ownership rule' }),
        ]),
        answerKey: expect.arrayContaining([
          expect.objectContaining({ practiceId: 'practice-1' }),
        ]),
        reviewCards: expect.arrayContaining([
          expect.objectContaining({ tag: 'ownership' }),
        ]),
        nextStepHint: 'Practice borrowing next so ownership transfer is not overused.',
        learningObjectives: expect.arrayContaining([
          expect.objectContaining({ outcome: 'Explain why moves invalidate the previous binding.' }),
        ]),
        conceptMap: expect.arrayContaining([
          expect.objectContaining({ title: 'Owner' }),
        ]),
        workedExample: expect.objectContaining({
          title: 'Trace a String move',
          steps: ['Create the value', 'Move it to the new binding', 'Reject access from the old binding'],
        }),
        practiceSet: expect.arrayContaining([
          expect.objectContaining({ level: 'challenge' }),
        ]),
        commonMistakes: expect.arrayContaining([
          expect.objectContaining({ mistake: 'Treating a move like a copy.' }),
        ]),
        completionRubric: expect.arrayContaining([
          expect.objectContaining({ criterion: 'Concept recall' }),
        ]),
        lessonBlocks: expect.arrayContaining([
          expect.objectContaining({
            title: 'Ownership mental model',
            citationIds: ['citation-1'],
          }),
        ]),
        materialCitations: expect.arrayContaining([
          expect.objectContaining({
            materialName: 'Ownership workshop notes.md',
          }),
        ]),
        mediaSuggestions: expect.arrayContaining([
          expect.objectContaining({ type: 'diagram' }),
        ]),
      }),
      recommendedReferences: [
        expect.objectContaining({
          title: 'The Rust Book',
        }),
      ],
    })
  })

  test('rejects malformed plan JSON response', () => {
    expect(() => parsePlanJsonResponse('{"title":"bad"}')).toThrow(/milestones/)
  })
})
