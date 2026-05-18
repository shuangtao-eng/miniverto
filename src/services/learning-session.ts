import type { LearningContent, MaterialCitation, MediaSuggestion, Task } from '@/types'

export interface LearningSessionBlock {
  id: string
  type: NonNullable<LearningContent['lessonBlocks']>[number]['type']
  title: string
  body: string
  bullets: string[]
  media: MediaSuggestion[]
  citations: MaterialCitation[]
}

export interface LearningSession {
  title: string
  estimatedMinutes: number
  outline: string[]
  overview: string
  personalizationNotes?: string
  prerequisites: NonNullable<LearningContent['prerequisites']>
  glossary: NonNullable<LearningContent['glossary']>
  deliverable?: LearningContent['deliverable']
  teachingScript: NonNullable<LearningContent['teachingScript']>
  answerKey: NonNullable<LearningContent['answerKey']>
  reviewCards: NonNullable<LearningContent['reviewCards']>
  nextStepHint?: string
  learningObjectives: NonNullable<LearningContent['learningObjectives']>
  conceptMap: NonNullable<LearningContent['conceptMap']>
  workedExample?: LearningContent['workedExample']
  practiceSet: NonNullable<LearningContent['practiceSet']>
  commonMistakes: NonNullable<LearningContent['commonMistakes']>
  completionRubric: NonNullable<LearningContent['completionRubric']>
  blocks: LearningSessionBlock[]
  citations: MaterialCitation[]
  quickCheck: string[]
  reviewPrompt: string
}

export function buildLearningSession(task: Task): LearningSession {
  const content = task.learningContent
  const media = content?.mediaSuggestions ?? []
  const citations = content?.materialCitations ?? []
  const blocks = content?.lessonBlocks?.map((block): LearningSessionBlock => ({
    id: block.id,
    type: block.type,
    title: block.title,
    body: block.body,
    bullets: block.bullets ?? [],
    media: media.filter((item) => block.mediaSuggestionIds?.includes(item.id)),
    citations: citations.filter((item) => block.citationIds?.includes(item.id)),
  })) ?? fallbackBlocks(task)

  return {
    title: task.title,
    estimatedMinutes: task.estimatedMinutes,
    outline: blocks.map((block) => block.title),
    overview: content?.overview ?? task.description ?? 'No detailed lesson content is available for this task yet.',
    personalizationNotes: content?.personalizationNotes,
    prerequisites: content?.prerequisites ?? [],
    glossary: content?.glossary ?? [],
    deliverable: content?.deliverable,
    teachingScript: content?.teachingScript ?? [],
    answerKey: content?.answerKey ?? [],
    reviewCards: content?.reviewCards ?? [],
    nextStepHint: content?.nextStepHint,
    learningObjectives: content?.learningObjectives ?? [],
    conceptMap: content?.conceptMap ?? [],
    workedExample: content?.workedExample,
    practiceSet: content?.practiceSet ?? [],
    commonMistakes: content?.commonMistakes ?? [],
    completionRubric: content?.completionRubric ?? [],
    blocks,
    citations,
    quickCheck: content?.quickCheck ?? content?.exercises ?? [],
    reviewPrompt: content?.reviewPrompt ?? task.acceptanceCriteria ?? '',
  }
}

function fallbackBlocks(task: Task): LearningSessionBlock[] {
  return [
    {
      id: `${task.id}-overview`,
      type: 'concept',
      title: 'Task briefing',
      body: task.description ?? 'Read the task brief first, then complete the practice and review steps.',
      bullets: task.learningContent?.keyPoints ?? [],
      media: task.learningContent?.mediaSuggestions ?? [],
      citations: task.learningContent?.materialCitations ?? [],
    },
  ]
}
