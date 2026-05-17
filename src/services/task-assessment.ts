import type { AssessmentBand, FinalAssessmentLevel } from './final-assessment'
import type { Project, Task, TaskAssessmentRecord } from '@/types'

export interface TaskAssessmentQuestion {
  id: string
  band: AssessmentBand
  prompt: string
  options: Array<{ id: string; text: string }>
  correctOptionId: string
  sourceHint?: string
}

export interface TaskAssessment {
  taskId: string
  projectId: string
  title: string
  questions: TaskAssessmentQuestion[]
}

export interface TaskAssessmentResult {
  correct: number
  total: number
  scorePct: number
  level: FinalAssessmentLevel
  levelLabel: string
  passed: boolean
  masterySummary: string
  weakBands: AssessmentBand[]
  needsReinforcement: boolean
  nextPlan: {
    title: string
    focus: string[]
    actions: string[]
    durationDays: number
  }
}

interface EvidenceItem {
  label: string
  text: string
}

const BAND_LABELS: Record<AssessmentBand, string> = {
  concept: '基础概念',
  application: '应用迁移',
  synthesis: '综合判断',
  reflection: '自我解释',
}

const QUESTION_BANDS: AssessmentBand[] = [
  'concept', 'concept', 'concept', 'concept',
  'application', 'application', 'application',
  'synthesis', 'synthesis',
  'reflection',
]

export function buildTaskAssessment(task: Task, project: Project): TaskAssessment {
  const evidence = collectTaskEvidence(task, project)

  return {
    taskId: task.id,
    projectId: project.id,
    title: `${task.title} 课后测评`,
    questions: QUESTION_BANDS.map((band, index) => {
      const source = evidence[index % evidence.length]!
      return {
        id: `${task.id}-post-q${index + 1}`,
        band,
        prompt: questionPrompt(task.title, project.title, band, index + 1, source),
        options: [
          { id: 'a', text: correctOptionText(band, source) },
          { id: 'b', text: distractorOptionText(band) },
          { id: 'c', text: '我还不确定，需要回到本节内容重新学习。' },
        ],
        correctOptionId: 'a',
        sourceHint: `${source.label}: ${source.text}`,
      }
    }),
  }
}

export function gradeTaskAssessment(
  assessment: TaskAssessment,
  answers: Record<string, string>,
): TaskAssessmentResult {
  const total = assessment.questions.length
  const correct = assessment.questions.filter((question) => answers[question.id] === question.correctOptionId).length
  const scorePct = Math.round((correct / total) * 100)
  const weakBands = getWeakBands(assessment, answers)
  const passed = scorePct >= 80 && weakBands.length === 0
  const level = levelFromScore(scorePct)
  const needsReinforcement = !passed

  return {
    correct,
    total,
    scorePct,
    level,
    levelLabel: levelLabel(level),
    passed,
    masterySummary: masterySummary(scorePct, weakBands, passed),
    weakBands,
    needsReinforcement,
    nextPlan: {
      title: needsReinforcement ? '课后加强方案' : '进阶迁移方案',
      focus: weakBands.length > 0 ? weakBands.map((band) => BAND_LABELS[band]) : ['迁移应用', '挑战练习'],
      actions: nextActions(needsReinforcement, weakBands),
      durationDays: needsReinforcement ? 3 : 7,
    },
  }
}

export function formatTaskAssessmentNote(existingNote: string, result: TaskAssessmentResult) {
  const previous = existingNote.trim()
  const assessmentNote = [
    'Miniverto课后测评',
    `得分：${result.scorePct}%（${result.correct}/${result.total}）`,
    `水平判断：${result.levelLabel}`,
    `是否需要继续加强：${result.needsReinforcement ? '需要' : '暂不需要'}`,
    `后续方案：${result.nextPlan.title}`,
    `重点：${result.nextPlan.focus.join('、')}`,
    `行动：${result.nextPlan.actions.join('；')}`,
  ].join('\n')

  return previous ? `${previous}\n\n${assessmentNote}` : assessmentNote
}

export function createTaskAssessmentRecord(
  taskId: string,
  result: TaskAssessmentResult,
  nowIso = new Date().toISOString(),
): TaskAssessmentRecord {
  return {
    id: `${taskId}-assessment-${nowIso}`,
    taskId,
    createdAt: nowIso,
    correct: result.correct,
    total: result.total,
    scorePct: result.scorePct,
    level: result.level,
    levelLabel: result.levelLabel,
    passed: result.passed,
    masterySummary: result.masterySummary,
    weakBands: result.weakBands,
    needsReinforcement: result.needsReinforcement,
    nextPlan: result.nextPlan,
  }
}

function collectTaskEvidence(task: Task, project: Project): EvidenceItem[] {
  const content = task.learningContent
  const items: EvidenceItem[] = [
    { label: '项目目标', text: project.goalSummary || project.title },
    { label: '本节任务', text: task.title },
    { label: '验收标准', text: task.acceptanceCriteria ?? task.description ?? task.title },
    ...(content?.learningObjectives ?? []).map((objective) => ({
      label: '学习目标',
      text: `${objective.outcome} ${objective.evidence}`,
    })),
    ...(content?.keyPoints ?? []).map((point) => ({ label: '关键点', text: point })),
    ...(content?.practiceSet ?? []).map((practice) => ({
      label: `练习-${practice.level}`,
      text: `${practice.prompt} ${practice.expectedOutcome}`,
    })),
    ...(content?.completionRubric ?? []).map((criterion) => ({
      label: '达标标准',
      text: `${criterion.criterion}: ${criterion.target}`,
    })),
    ...(content?.commonMistakes ?? []).map((mistake) => ({
      label: '常见误区',
      text: `${mistake.mistake} ${mistake.correction}`,
    })),
    ...(content?.materialCitations ?? []).map((citation) => ({
      label: `资料-${citation.materialName}`,
      text: `${citation.summary} ${citation.reason}`,
    })),
  ]

  return items.filter((item) => item.text.trim().length > 0)
}

function questionPrompt(
  taskTitle: string,
  projectTitle: string,
  band: AssessmentBand,
  index: number,
  source: EvidenceItem,
) {
  if (band === 'concept') {
    return `Q${index}. 结合「${source.text}」，关于「${taskTitle}」的核心理解，哪种说法最可靠？`
  }
  if (band === 'application') {
    return `Q${index}. 如果要把「${taskTitle}」用于「${projectTitle}」的新场景，第一步应该怎么做？`
  }
  if (band === 'synthesis') {
    return `Q${index}. 面对「${source.text}」这样的综合任务，怎样判断学习结果是否合格？`
  }
  return `Q${index}. 如果要向别人讲清「${taskTitle}」，哪种自我解释方式最有效？`
}

function correctOptionText(band: AssessmentBand, source: EvidenceItem) {
  if (band === 'concept') return `能说清定义、边界和一个反例，并连接到「${source.label}」。`
  if (band === 'application') return '先识别输入、约束和验收标准，再选择方法并完成一个可检查产出。'
  if (band === 'synthesis') return '用可验证产出、错误记录和复盘结论一起判断，而不是只看是否读完。'
  return '先闭卷解释核心概念，再用例子、误区和下一步行动验证理解。'
}

function distractorOptionText(band: AssessmentBand) {
  if (band === 'concept') return '只要能认出关键词，就说明已经掌握本节内容。'
  if (band === 'application') return '先寻找更多资料，等完全理解后再开始做练习。'
  if (band === 'synthesis') return '只要按时学完，就可以直接进入下一节。'
  return '把材料重新读一遍并划重点，这就是最完整的自我解释。'
}

function getWeakBands(assessment: TaskAssessment, answers: Record<string, string>) {
  const bands: AssessmentBand[] = ['concept', 'application', 'synthesis', 'reflection']
  return bands.filter((band) => {
    const questions = assessment.questions.filter((question) => question.band === band)
    const correct = questions.filter((question) => answers[question.id] === question.correctOptionId).length
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
  if (level === 'mostly-achieved') return '大部分达标'
  return '本节达标'
}

function masterySummary(scorePct: number, weakBands: AssessmentBand[], passed: boolean) {
  const weak = weakBands.map((band) => BAND_LABELS[band]).join('、')
  if (passed) {
    return `Miniverto判断：你现在大约达到本节学习目标的 ${scorePct}%。可以完成本节，也可以进入进阶迁移练习。`
  }
  return `Miniverto判断：你现在大约达到本节学习目标的 ${scorePct}%。建议继续加强${weak ? `：${weak}` : '本节关键能力'}。`
}

function nextActions(needsReinforcement: boolean, weakBands: AssessmentBand[]) {
  if (!needsReinforcement) {
    return [
      '选择一个新场景做迁移练习',
      '把本节最关键的解释写入长期笔记',
      '在下一节开始前用闭卷方式复述一次',
    ]
  }

  const focus: AssessmentBand[] = weakBands.length > 0 ? weakBands : ['concept', 'application']
  return [
    `重学并闭卷复述：${focus.map((band) => BAND_LABELS[band]).join('、')}`,
    '重做本节基础题和应用题，各记录一个错误原因',
    '24小时内再次完成一次10题自测，目标达到80%以上',
  ]
}
