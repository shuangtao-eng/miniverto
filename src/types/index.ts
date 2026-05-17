export interface Resource {
  id: string
  type: 'link' | 'book' | 'video' | 'article'
  title: string
  url?: string
}

export interface LearningContent {
  overview: string
  personalizationNotes?: string
  prerequisites?: string[]
  glossary?: GlossaryItem[]
  deliverable?: LessonDeliverable
  teachingScript?: LessonTeachingSection[]
  answerKey?: LessonAnswerKey[]
  reviewCards?: LessonReviewCard[]
  nextStepHint?: string
  keyPoints: string[]
  steps: string[]
  exercises: string[]
  reviewPrompt: string
  learningObjectives?: LearningObjective[]
  conceptMap?: ConceptMapItem[]
  workedExample?: WorkedExample
  practiceSet?: PracticePrompt[]
  commonMistakes?: CommonMistake[]
  completionRubric?: RubricCriterion[]
  lessonBlocks?: LessonBlock[]
  mediaSuggestions?: MediaSuggestion[]
  materialCitations?: MaterialCitation[]
  quickCheck?: string[]
}

export interface GlossaryItem {
  term: string
  meaning: string
  example: string
}

export interface LessonDeliverable {
  title: string
  format: string
  acceptanceCheck: string
}

export interface LessonTeachingSection {
  id: string
  title: string
  body: string
  example: string
}

export interface LessonAnswerKey {
  practiceId: string
  expectedAnswer: string
  checkMethod: string
}

export interface LessonReviewCard {
  front: string
  back: string
  tag: string
}

export interface LessonBlock {
  id: string
  type: 'hook' | 'concept' | 'example' | 'steps' | 'exercise' | 'reflection' | 'quiz'
  title: string
  body: string
  bullets?: string[]
  mediaSuggestionIds?: string[]
  citationIds?: string[]
}

export interface MediaSuggestion {
  id: string
  type: 'image' | 'diagram' | 'video'
  title: string
  purpose: string
  promptOrQuery: string
  placement: string
}

export interface MaterialCitation {
  id: string
  materialId: string
  materialName: string
  summary: string
  reason: string
}

export interface LearningObjective {
  id: string
  outcome: string
  evidence: string
}

export interface ConceptMapItem {
  id: string
  title: string
  description: string
  links: string[]
}

export interface WorkedExample {
  title: string
  scenario: string
  steps: string[]
  takeaway: string
}

export interface PracticePrompt {
  id: string
  level: 'foundation' | 'application' | 'challenge'
  prompt: string
  expectedOutcome: string
}

export interface CommonMistake {
  mistake: string
  correction: string
}

export interface RubricCriterion {
  criterion: string
  target: string
}

export interface RecommendedReference {
  id: string
  type: 'official' | 'book' | 'paper' | 'course' | 'article' | 'video'
  title: string
  reason: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  url?: string
}

export interface CriticDimension {
  label: string
  score: number
  maxScore: number
}

export type KnowledgeNoteSourceType = 'manual' | 'task' | 'material' | 'assessment'

export interface KnowledgeNote {
  id: string
  title: string
  body: string
  tags: string[]
  links: string[]
  sourceType: KnowledgeNoteSourceType
  projectId?: string
  taskId?: string
  materialId?: string
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  kind: 'reading' | 'practice' | 'reflection' | 'other'
  title: string
  description?: string
  estimatedMinutes: number
  suggestedDate?: string
  resources?: Resource[]
  learningContent?: LearningContent
  recommendedReferences?: RecommendedReference[]
  assessmentHistory?: TaskAssessmentRecord[]
  acceptanceCriteria?: string
  status: 'pending' | 'in_progress' | 'completed'
  userNote?: string
}

export interface TaskAssessmentRecord {
  id: string
  taskId: string
  createdAt: string
  correct: number
  total: number
  scorePct: number
  level: string
  levelLabel: string
  passed: boolean
  masterySummary: string
  weakBands: string[]
  needsReinforcement: boolean
  nextPlan: {
    title: string
    focus: string[]
    actions: string[]
    durationDays: number
  }
}

export interface Milestone {
  id: string
  title: string
  successCriteria: string
  tasks: Task[]
}

export type ProjectStatus = 'active' | 'completed' | 'archived' | 'paused'

export interface Project {
  id: string
  emoji: string
  title: string
  goalSummary: string
  status: ProjectStatus
  milestoneList: Milestone[]
  completedTasks: number
  totalTasks: number
  criticScore?: number
  criticDimensions?: CriticDimension[]
  lastActive: string
}

export type ModalType = 'none' | 'create' | 'replan' | 'assessment' | 'report' | 'cmd'
export type AssessmentType = 'baseline' | 'milestone' | 'final'
