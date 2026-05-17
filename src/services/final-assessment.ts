import type { LearningMaterial } from '@/data/materials'
import type { Project, Task } from '@/types'

export type AssessmentBand = 'concept' | 'application' | 'synthesis' | 'reflection'
export type FinalAssessmentLevel =
  | 'not-ready'
  | 'basic'
  | 'mostly-achieved'
  | 'achieved'

export interface FinalAssessmentQuestion {
  id: string
  band: AssessmentBand
  prompt: string
  options: Array<{ id: string; text: string }>
  correctOptionId: string
  sourceHint?: string
}

export interface FinalAssessment {
  projectId: string
  title: string
  questions: FinalAssessmentQuestion[]
}

export interface FinalAssessmentContext {
  materials?: LearningMaterial[]
}

export interface FinalAssessmentPromptPayload {
  system: string
  input: {
    project: Pick<Project, 'id' | 'title' | 'goalSummary' | 'completedTasks' | 'totalTasks'>
    evidence: AssessmentEvidence[]
  }
  responseSchema: {
    version: number
    type: 'object'
    required: string[]
    properties: {
      questions: {
        length: number
        item: Record<string, string | string[]>
      }
    }
  }
}

export interface FinalAssessmentResult {
  correct: number
  total: number
  scorePct: number
  level: FinalAssessmentLevel
  levelLabel: string
  masterySummary: string
  weakBands: AssessmentBand[]
  needsContinuation: boolean
  nextPlan: {
    title: string
    focus: string[]
    durationDays: number
  }
}

interface AssessmentEvidence {
  label: string
  text: string
}

const BAND_LABELS: Record<AssessmentBand, string> = {
  concept: '基础概念',
  application: '应用迁移',
  synthesis: '综合场景',
  reflection: '自解释反思',
}

export function buildFinalAssessment(
  project: Project,
  context: FinalAssessmentContext = {},
): FinalAssessment {
  const specs: AssessmentBand[] = [
    'concept', 'concept', 'concept', 'concept',
    'application', 'application', 'application',
    'synthesis', 'synthesis',
    'reflection',
  ]
  const evidence = collectEvidence(project, context.materials)

  return {
    projectId: project.id,
    title: `${project.title} 终局测评`,
    questions: specs.map((band, index) => {
      const source = evidence[index % evidence.length]!
      return {
        id: `final-q${index + 1}`,
        band,
        prompt: questionPrompt(project.title, band, index + 1, source),
        options: [
          { id: 'a', text: optionText(project.title, band, source, true) },
          { id: 'b', text: optionText(project.title, band, source, false) },
          { id: 'c', text: '我不确定，需要回看资料。' },
        ],
        correctOptionId: 'a',
        sourceHint: `${source.label}: ${source.text}`,
      }
    }),
  }
}

export function gradeFinalAssessment(
  assessment: FinalAssessment,
  answers: Record<string, string>,
): FinalAssessmentResult {
  const total = assessment.questions.length
  const correct = assessment.questions.filter((q) => answers[q.id] === q.correctOptionId).length
  const scorePct = Math.round((correct / total) * 100)
  const weakBands = getWeakBands(assessment, answers)
  const level = levelFromScore(scorePct)
  const needsContinuation = scorePct < 85 || weakBands.length > 0

  return {
    correct,
    total,
    scorePct,
    level,
    levelLabel: levelLabel(level),
    masterySummary: masterySummary(scorePct, weakBands),
    weakBands,
    needsContinuation,
    nextPlan: {
      title: needsContinuation ? '7 天补弱强化方案' : '进阶挑战方案',
      focus: weakBands.length > 0 ? weakBands.map((band) => BAND_LABELS[band]) : ['项目实战', '迁移应用'],
      durationDays: needsContinuation ? 7 : 14,
    },
  }
}

export function buildFinalAssessmentPromptPayload(
  project: Project,
  context: FinalAssessmentContext = {},
): FinalAssessmentPromptPayload {
  return {
    system: [
      'You are Miniverto, a final-assessment engine.',
      'Create exactly 10 multiple-choice questions that verify whether the learner achieved the stated goal.',
      'Use the project evidence, selected material summaries, retrieval practice, transfer, synthesis, and self-explanation.',
      'Return only JSON matching the schema. Do not include markdown.',
    ].join(' '),
    input: {
      project: {
        id: project.id,
        title: project.title,
        goalSummary: project.goalSummary,
        completedTasks: project.completedTasks,
        totalTasks: project.totalTasks,
      },
      evidence: collectEvidence(project, context.materials),
    },
    responseSchema: {
      version: 1,
      type: 'object',
      required: ['questions'],
      properties: {
        questions: {
          length: 10,
          item: {
            id: 'string',
            band: ['concept', 'application', 'synthesis', 'reflection'],
            prompt: 'string',
            options: 'array of at least 3 objects: { id: string, text: string }',
            correctOptionId: 'string matching one option id',
            sourceHint: 'string optional',
          },
        },
      },
    },
  }
}

export function parseFinalAssessmentJsonResponse(
  projectId: string,
  title: string,
  json: string,
): FinalAssessment {
  const value = JSON.parse(json) as unknown
  if (!isObject(value)) throw new Error('Final assessment response must be an object')
  const questions = value.questions
  if (!Array.isArray(questions) || questions.length !== 10) {
    throw new Error('Final assessment response must include exactly 10 questions')
  }

  return {
    projectId,
    title,
    questions: questions.map(parseQuestion),
  }
}

function collectEvidence(project: Project, materials: LearningMaterial[] = []): AssessmentEvidence[] {
  const evidence: AssessmentEvidence[] = [
    { label: '学习目标', text: project.goalSummary || project.title },
  ]

  for (const milestone of project.milestoneList) {
    evidence.push({
      label: `里程碑：${milestone.title}`,
      text: milestone.successCriteria,
    })

    for (const task of milestone.tasks) {
      evidence.push({
        label: `任务：${task.title}`,
        text: taskEvidenceText(task),
      })
    }
  }

  for (const material of materials) {
    if (!material.selected || material.status === 'unsupported' || material.status === 'failed') continue
    evidence.push({
      label: `资料：${material.name}`,
      text: material.note?.trim() || `${material.kind} material selected for this learning goal`,
    })
  }

  return evidence.filter((item) => item.text.trim().length > 0)
}

function parseQuestion(value: unknown): FinalAssessmentQuestion {
  if (!isObject(value)) throw new Error('Final assessment question must be an object')

  const band = readString(value, 'band')
  if (!['concept', 'application', 'synthesis', 'reflection'].includes(band)) {
    throw new Error(`Unsupported final assessment band: ${band}`)
  }

  const optionsValue = value.options
  if (!Array.isArray(optionsValue) || optionsValue.length < 3) {
    throw new Error('Final assessment question must include at least 3 options')
  }
  const options = optionsValue.map(parseOption)
  const correctOptionId = readString(value, 'correctOptionId')
  if (!options.some((option) => option.id === correctOptionId)) {
    throw new Error('Final assessment question must include a valid correctOptionId')
  }

  return {
    id: readString(value, 'id'),
    band: band as AssessmentBand,
    prompt: readString(value, 'prompt'),
    options,
    correctOptionId,
    sourceHint: readOptionalString(value, 'sourceHint'),
  }
}

function parseOption(value: unknown) {
  if (!isObject(value)) throw new Error('Final assessment option must be an object')
  return {
    id: readString(value, 'id'),
    text: readString(value, 'text'),
  }
}

function taskEvidenceText(task: Task) {
  return [
    task.title,
    task.acceptanceCriteria,
    task.description,
  ].filter(Boolean).join(': ')
}

function questionPrompt(topic: string, band: AssessmentBand, index: number, source: AssessmentEvidence) {
  if (band === 'concept') {
    return `Q${index}. 结合「${source.text}」，关于「${topic}」的核心概念，哪种说法最准确？`
  }
  if (band === 'application') {
    return `Q${index}. 针对「${source.text}」，如果要把「${topic}」用于新场景，你会先做什么？`
  }
  if (band === 'synthesis') {
    return `Q${index}. 面对「${source.text}」这样的综合任务，怎样判断你的方案是否可靠？`
  }
  return `Q${index}. 如果你要基于「${source.text}」向别人讲清「${topic}」，最有效的方式是什么？`
}

function optionText(topic: string, band: AssessmentBand, source: AssessmentEvidence, correct: boolean) {
  if (correct) {
    if (band === 'concept') return `能说出定义、边界和一个反例，并连接到「${source.label}」。`
    if (band === 'application') return '先识别输入、约束和验收标准，再选择方法。'
    if (band === 'synthesis') return '用可验证产出、错误案例和复盘记录一起判断。'
    return `闭卷解释「${topic}」的核心概念，再用例子和卡点验证理解。`
  }
  return '直接继续刷更多资料，暂时不做检验。'
}

function getWeakBands(assessment: FinalAssessment, answers: Record<string, string>) {
  const bands: AssessmentBand[] = ['concept', 'application', 'synthesis', 'reflection']
  return bands.filter((band) => {
    const questions = assessment.questions.filter((q) => q.band === band)
    const correct = questions.filter((q) => answers[q.id] === q.correctOptionId).length
    return correct / questions.length < 0.7
  })
}

function levelFromScore(scorePct: number): FinalAssessmentLevel {
  if (scorePct < 50) return 'not-ready'
  if (scorePct < 70) return 'basic'
  if (scorePct < 85) return 'mostly-achieved'
  return 'achieved'
}

function levelLabel(level: FinalAssessmentLevel) {
  if (level === 'not-ready') return '基础未稳'
  if (level === 'basic') return '初步掌握'
  if (level === 'mostly-achieved') return '大部分达成'
  return '目标达成'
}

function masterySummary(scorePct: number, weakBands: AssessmentBand[]) {
  const weak = weakBands.map((band) => BAND_LABELS[band]).join('、')
  return weak
    ? `Miniverto 判断：你目前大约达到该学习目标的 ${scorePct}%。需要继续加强：${weak}。`
    : `Miniverto 判断：你目前大约达到该学习目标的 ${scorePct}%。可以结项或进入进阶路线。`
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(value: Record<string, unknown>, key: string): string {
  const prop = value[key]
  if (typeof prop !== 'string' || prop.trim() === '') {
    throw new Error(`Final assessment response missing string field: ${key}`)
  }
  return prop
}

function readOptionalString(value: Record<string, unknown>, key: string): string | undefined {
  const prop = value[key]
  return typeof prop === 'string' && prop.trim() !== '' ? prop : undefined
}
