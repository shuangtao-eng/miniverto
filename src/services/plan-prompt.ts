import type { LearningContent, RecommendedReference, Task } from '@/types'
import type { buildPlanInput } from '@/data/plan-input'

type PlanInput = ReturnType<typeof buildPlanInput>

export interface PlanResponseTask {
  kind: Task['kind']
  title: string
  description?: string
  estimatedMinutes: number
  suggestedDate?: string
  acceptanceCriteria?: string
  learningContent?: LearningContent
  recommendedReferences?: RecommendedReference[]
  status: Task['status']
}

export interface PlanResponseMilestone {
  title: string
  successCriteria: string
  tasks: PlanResponseTask[]
}

export interface PlanJsonResponse {
  title: string
  emoji: string
  goalSummary: string
  criticScore?: number
  milestones: PlanResponseMilestone[]
}

export function buildPlanPromptPayload(input: PlanInput) {
  return {
    system: [
      'You are Miniverto, a learning-plan engine and in-app lesson designer.',
      'Create evidence-informed learning plans from structured choices, diagnostic results, and selected material summaries.',
      'You must tailor the plan to the learner profile, especially purpose, schedule, current level, blockers, target scenario, preferred feedback, and requested content depth.',
      'Use retrieval practice, spaced repetition, interleaving, project work, and MIT/PSET-style practice when appropriate.',
      'For every task, create concrete in-app learning content that is specific enough to study directly, with visual or video suggestions.',
      'Return only JSON matching the response schema. Do not include markdown.',
    ].join(' '),
    input,
    responseSchema: {
      version: 2,
      type: 'object',
      required: ['title', 'emoji', 'goalSummary', 'milestones'],
      properties: {
        title: 'string',
        emoji: 'string',
        goalSummary: 'string',
        criticScore: 'number optional, 0-10',
        milestones: [
          {
            title: 'string',
            successCriteria: 'string',
            tasks: [
              {
                kind: 'reading | practice | reflection | other',
                title: 'string',
                description: 'string optional',
                estimatedMinutes: 'number',
                suggestedDate: 'string optional',
                acceptanceCriteria: 'string optional',
                learningContent: {
                  overview: 'string, in-app lesson introduction',
                  personalizationNotes: 'string optional, how this lesson adapts to the learner profile',
                  prerequisites: 'string[] optional, what the user should confirm before starting this lesson',
                  glossary: [
                    {
                      term: 'string, important term used in the lesson',
                      meaning: 'string, plain-language explanation',
                      example: 'string, concrete example tied to the task',
                    },
                  ],
                  deliverable: {
                    title: 'string, concrete output the user creates in this lesson',
                    format: 'string, artifact format such as note, checklist, demo, essay, code, quiz result',
                    acceptanceCheck: 'string, how the user knows this output is good enough',
                  },
                  teachingScript: [
                    {
                      id: 'string',
                      title: 'string, teachable section title',
                      body: 'string, direct lesson explanation',
                      example: 'string, concrete example tied to this task',
                    },
                  ],
                  answerKey: [
                    {
                      practiceId: 'string, id of a practiceSet item when available',
                      expectedAnswer: 'string, reference answer or expected output',
                      checkMethod: 'string, how the user can self-check quality',
                    },
                  ],
                  reviewCards: [
                    {
                      front: 'string, active recall question',
                      back: 'string, concise answer',
                      tag: 'string, review category',
                    },
                  ],
                  nextStepHint: 'string optional, what to do after this lesson',
                  keyPoints: 'string[] with 3-6 key ideas',
                  steps: 'string[] concrete study steps',
                  exercises: 'string[] small exercises or reflection prompts',
                  reviewPrompt: 'string for later active recall',
                  learningObjectives: [
                    {
                      id: 'string',
                      outcome: 'string, what the user can do after this task',
                      evidence: 'string, observable proof of mastery',
                    },
                  ],
                  conceptMap: [
                    {
                      id: 'string',
                      title: 'string',
                      description: 'string',
                      links: 'string[] of related concept ids',
                    },
                  ],
                  workedExample: {
                    title: 'string',
                    scenario: 'string',
                    steps: 'string[] with at least 3 steps',
                    takeaway: 'string',
                  },
                  practiceSet: [
                    {
                      id: 'string',
                      level: 'foundation | application | challenge',
                      prompt: 'string',
                      expectedOutcome: 'string',
                    },
                  ],
                  commonMistakes: [
                    {
                      mistake: 'string',
                      correction: 'string',
                    },
                  ],
                  completionRubric: [
                    {
                      criterion: 'string',
                      target: 'string',
                    },
                  ],
                  lessonBlocks: [
                    {
                      id: 'string',
                      type: 'hook | concept | example | steps | exercise | reflection | quiz',
                      title: 'string',
                      body: 'string, concrete lesson content users can learn in-app',
                      bullets: 'string[] optional',
                      mediaSuggestionIds: 'string[] optional, references mediaSuggestions ids',
                      citationIds: 'string[] optional, references materialCitations ids',
                    },
                  ],
                  materialCitations: [
                    {
                      id: 'string',
                      materialId: 'string, selected material id from input.materials',
                      materialName: 'string',
                      summary: 'string, concise evidence from the selected material summary',
                      reason: 'string, why this material supports this task',
                    },
                  ],
                  mediaSuggestions: [
                    {
                      id: 'string',
                      type: 'image | diagram | video',
                      title: 'string',
                      purpose: 'string, why this visual/video helps',
                      promptOrQuery: 'string, image prompt or video search query',
                      placement: 'string, where it belongs in the lesson',
                    },
                  ],
                  quickCheck: 'string[] with 3-5 short self-check questions',
                },
                recommendedReferences: [
                  {
                    id: 'string',
                    type: 'official | book | paper | course | article | video',
                    title: 'string',
                    reason: 'string, why this reference fits the learner and task',
                    difficulty: 'beginner | intermediate | advanced',
                    url: 'string optional',
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  }
}

export function parsePlanJsonResponse(json: string): PlanJsonResponse {
  const value = JSON.parse(json) as unknown
  if (!isObject(value)) throw new Error('Plan response must be an object')
  const milestones = value.milestones
  if (!Array.isArray(milestones) || milestones.length === 0) {
    throw new Error('Plan response must include milestones')
  }

  return {
    title: readString(value, 'title'),
    emoji: readString(value, 'emoji'),
    goalSummary: readString(value, 'goalSummary'),
    criticScore: typeof value.criticScore === 'number' ? value.criticScore : undefined,
    milestones: milestones.map(parseMilestone),
  }
}

function parseMilestone(value: unknown): PlanResponseMilestone {
  if (!isObject(value)) throw new Error('Milestone must be an object')
  const tasks = value.tasks
  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new Error('Milestone must include tasks')
  }

  return {
    title: readString(value, 'title'),
    successCriteria: readString(value, 'successCriteria'),
    tasks: tasks.map(parseTask),
  }
}

function parseTask(value: unknown): PlanResponseTask {
  if (!isObject(value)) throw new Error('Task must be an object')
  const kind = readString(value, 'kind')
  if (!['reading', 'practice', 'reflection', 'other'].includes(kind)) {
    throw new Error(`Unsupported task kind: ${kind}`)
  }
  const estimatedMinutes = value.estimatedMinutes
  if (typeof estimatedMinutes !== 'number' || estimatedMinutes <= 0) {
    throw new Error('Task estimatedMinutes must be a positive number')
  }

  return {
    kind: kind as Task['kind'],
    title: readString(value, 'title'),
    description: readOptionalString(value, 'description'),
    estimatedMinutes,
    suggestedDate: readOptionalString(value, 'suggestedDate'),
    acceptanceCriteria: readOptionalString(value, 'acceptanceCriteria'),
    learningContent: parseOptionalLearningContent(value.learningContent),
    recommendedReferences: parseOptionalReferences(value.recommendedReferences),
    status: 'pending',
  }
}

function parseOptionalLearningContent(value: unknown): LearningContent | undefined {
  if (value == null) return undefined
  if (!isObject(value)) throw new Error('Task learningContent must be an object')

  return {
    overview: readString(value, 'overview'),
    personalizationNotes: readOptionalString(value, 'personalizationNotes'),
    prerequisites: value.prerequisites == null ? undefined : readStringArray(value, 'prerequisites'),
    glossary: parseOptionalGlossary(value.glossary),
    deliverable: parseOptionalDeliverable(value.deliverable),
    teachingScript: parseOptionalTeachingScript(value.teachingScript),
    answerKey: parseOptionalAnswerKey(value.answerKey),
    reviewCards: parseOptionalReviewCards(value.reviewCards),
    nextStepHint: readOptionalString(value, 'nextStepHint'),
    keyPoints: readStringArray(value, 'keyPoints'),
    steps: readStringArray(value, 'steps'),
    exercises: readStringArray(value, 'exercises'),
    reviewPrompt: readString(value, 'reviewPrompt'),
    learningObjectives: parseOptionalLearningObjectives(value.learningObjectives),
    conceptMap: parseOptionalConceptMap(value.conceptMap),
    workedExample: parseOptionalWorkedExample(value.workedExample),
    practiceSet: parseOptionalPracticeSet(value.practiceSet),
    commonMistakes: parseOptionalCommonMistakes(value.commonMistakes),
    completionRubric: parseOptionalCompletionRubric(value.completionRubric),
    lessonBlocks: parseOptionalLessonBlocks(value.lessonBlocks),
    materialCitations: parseOptionalMaterialCitations(value.materialCitations),
    mediaSuggestions: parseOptionalMediaSuggestions(value.mediaSuggestions),
    quickCheck: value.quickCheck == null ? undefined : readStringArray(value, 'quickCheck'),
  }
}

function parseOptionalTeachingScript(value: unknown): LearningContent['teachingScript'] {
  if (value == null) return undefined
  if (!Array.isArray(value)) throw new Error('Task teachingScript must be an array')
  return value.map((item) => {
    if (!isObject(item)) throw new Error('Teaching section must be an object')
    return {
      id: readString(item, 'id'),
      title: readString(item, 'title'),
      body: readString(item, 'body'),
      example: readString(item, 'example'),
    }
  })
}

function parseOptionalAnswerKey(value: unknown): LearningContent['answerKey'] {
  if (value == null) return undefined
  if (!Array.isArray(value)) throw new Error('Task answerKey must be an array')
  return value.map((item) => {
    if (!isObject(item)) throw new Error('Answer key item must be an object')
    return {
      practiceId: readString(item, 'practiceId'),
      expectedAnswer: readString(item, 'expectedAnswer'),
      checkMethod: readString(item, 'checkMethod'),
    }
  })
}

function parseOptionalReviewCards(value: unknown): LearningContent['reviewCards'] {
  if (value == null) return undefined
  if (!Array.isArray(value)) throw new Error('Task reviewCards must be an array')
  return value.map((item) => {
    if (!isObject(item)) throw new Error('Review card must be an object')
    return {
      front: readString(item, 'front'),
      back: readString(item, 'back'),
      tag: readString(item, 'tag'),
    }
  })
}

function parseOptionalGlossary(value: unknown): LearningContent['glossary'] {
  if (value == null) return undefined
  if (!Array.isArray(value)) throw new Error('Task glossary must be an array')
  return value.map((item) => {
    if (!isObject(item)) throw new Error('Glossary item must be an object')
    return {
      term: readString(item, 'term'),
      meaning: readString(item, 'meaning'),
      example: readString(item, 'example'),
    }
  })
}

function parseOptionalDeliverable(value: unknown): LearningContent['deliverable'] {
  if (value == null) return undefined
  if (!isObject(value)) throw new Error('Task deliverable must be an object')
  return {
    title: readString(value, 'title'),
    format: readString(value, 'format'),
    acceptanceCheck: readString(value, 'acceptanceCheck'),
  }
}

function parseOptionalLessonBlocks(value: unknown): LearningContent['lessonBlocks'] {
  if (value == null) return undefined
  if (!Array.isArray(value)) throw new Error('Task lessonBlocks must be an array')
  return value.map((item) => {
    if (!isObject(item)) throw new Error('Lesson block must be an object')
    const type = readString(item, 'type')
    if (!['hook', 'concept', 'example', 'steps', 'exercise', 'reflection', 'quiz'].includes(type)) {
      throw new Error(`Unsupported lesson block type: ${type}`)
    }
    return {
      id: readString(item, 'id'),
      type: type as NonNullable<LearningContent['lessonBlocks']>[number]['type'],
      title: readString(item, 'title'),
      body: readString(item, 'body'),
      bullets: item.bullets == null ? undefined : readStringArray(item, 'bullets'),
      mediaSuggestionIds: item.mediaSuggestionIds == null ? undefined : readStringArray(item, 'mediaSuggestionIds'),
      citationIds: item.citationIds == null ? undefined : readStringArray(item, 'citationIds'),
    }
  })
}

function parseOptionalMaterialCitations(value: unknown): LearningContent['materialCitations'] {
  if (value == null) return undefined
  if (!Array.isArray(value)) throw new Error('Task materialCitations must be an array')
  return value.map((item) => {
    if (!isObject(item)) throw new Error('Material citation must be an object')
    return {
      id: readString(item, 'id'),
      materialId: readString(item, 'materialId'),
      materialName: readString(item, 'materialName'),
      summary: readString(item, 'summary'),
      reason: readString(item, 'reason'),
    }
  })
}

function parseOptionalLearningObjectives(value: unknown): LearningContent['learningObjectives'] {
  if (value == null) return undefined
  if (!Array.isArray(value)) throw new Error('Task learningObjectives must be an array')
  return value.map((item) => {
    if (!isObject(item)) throw new Error('Learning objective must be an object')
    return {
      id: readString(item, 'id'),
      outcome: readString(item, 'outcome'),
      evidence: readString(item, 'evidence'),
    }
  })
}

function parseOptionalConceptMap(value: unknown): LearningContent['conceptMap'] {
  if (value == null) return undefined
  if (!Array.isArray(value)) throw new Error('Task conceptMap must be an array')
  return value.map((item) => {
    if (!isObject(item)) throw new Error('Concept map item must be an object')
    return {
      id: readString(item, 'id'),
      title: readString(item, 'title'),
      description: readString(item, 'description'),
      links: readStringArray(item, 'links'),
    }
  })
}

function parseOptionalWorkedExample(value: unknown): LearningContent['workedExample'] {
  if (value == null) return undefined
  if (!isObject(value)) throw new Error('Task workedExample must be an object')
  return {
    title: readString(value, 'title'),
    scenario: readString(value, 'scenario'),
    steps: readStringArray(value, 'steps'),
    takeaway: readString(value, 'takeaway'),
  }
}

function parseOptionalPracticeSet(value: unknown): LearningContent['practiceSet'] {
  if (value == null) return undefined
  if (!Array.isArray(value)) throw new Error('Task practiceSet must be an array')
  return value.map((item) => {
    if (!isObject(item)) throw new Error('Practice prompt must be an object')
    const level = readString(item, 'level')
    if (!['foundation', 'application', 'challenge'].includes(level)) {
      throw new Error(`Unsupported practice level: ${level}`)
    }
    return {
      id: readString(item, 'id'),
      level: level as NonNullable<LearningContent['practiceSet']>[number]['level'],
      prompt: readString(item, 'prompt'),
      expectedOutcome: readString(item, 'expectedOutcome'),
    }
  })
}

function parseOptionalCommonMistakes(value: unknown): LearningContent['commonMistakes'] {
  if (value == null) return undefined
  if (!Array.isArray(value)) throw new Error('Task commonMistakes must be an array')
  return value.map((item) => {
    if (!isObject(item)) throw new Error('Common mistake must be an object')
    return {
      mistake: readString(item, 'mistake'),
      correction: readString(item, 'correction'),
    }
  })
}

function parseOptionalCompletionRubric(value: unknown): LearningContent['completionRubric'] {
  if (value == null) return undefined
  if (!Array.isArray(value)) throw new Error('Task completionRubric must be an array')
  return value.map((item) => {
    if (!isObject(item)) throw new Error('Rubric criterion must be an object')
    return {
      criterion: readString(item, 'criterion'),
      target: readString(item, 'target'),
    }
  })
}

function parseOptionalMediaSuggestions(value: unknown): LearningContent['mediaSuggestions'] {
  if (value == null) return undefined
  if (!Array.isArray(value)) throw new Error('Task mediaSuggestions must be an array')
  return value.map((item) => {
    if (!isObject(item)) throw new Error('Media suggestion must be an object')
    const type = readString(item, 'type')
    if (!['image', 'diagram', 'video'].includes(type)) {
      throw new Error(`Unsupported media suggestion type: ${type}`)
    }
    return {
      id: readString(item, 'id'),
      type: type as NonNullable<LearningContent['mediaSuggestions']>[number]['type'],
      title: readString(item, 'title'),
      purpose: readString(item, 'purpose'),
      promptOrQuery: readString(item, 'promptOrQuery'),
      placement: readString(item, 'placement'),
    }
  })
}

function parseOptionalReferences(value: unknown): RecommendedReference[] | undefined {
  if (value == null) return undefined
  if (!Array.isArray(value)) throw new Error('Task recommendedReferences must be an array')
  return value.map((item): RecommendedReference => {
    if (!isObject(item)) throw new Error('Reference must be an object')
    const type = readString(item, 'type')
    const difficulty = readString(item, 'difficulty')
    if (!['official', 'book', 'paper', 'course', 'article', 'video'].includes(type)) {
      throw new Error(`Unsupported reference type: ${type}`)
    }
    if (!['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
      throw new Error(`Unsupported reference difficulty: ${difficulty}`)
    }
    return {
      id: readString(item, 'id'),
      type: type as RecommendedReference['type'],
      title: readString(item, 'title'),
      reason: readString(item, 'reason'),
      difficulty: difficulty as RecommendedReference['difficulty'],
      url: readOptionalString(item, 'url'),
    }
  })
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(value: Record<string, unknown>, key: string): string {
  const prop = value[key]
  if (typeof prop !== 'string' || prop.trim() === '') {
    throw new Error(`Plan response missing string field: ${key}`)
  }
  return prop
}

function readOptionalString(value: Record<string, unknown>, key: string): string | undefined {
  const prop = value[key]
  return typeof prop === 'string' && prop.trim() !== '' ? prop : undefined
}

function readStringArray(value: Record<string, unknown>, key: string): string[] {
  const prop = value[key]
  if (!Array.isArray(prop) || prop.some((item) => typeof item !== 'string' || item.trim() === '')) {
    throw new Error(`Plan response missing string array field: ${key}`)
  }
  return prop
}
