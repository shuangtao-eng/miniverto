import { buildPlanInput } from '@/data/plan-input'
import { LEARNING_METHODS, type LearningMethod } from '@/data/learning-methods'
import { getBestPlanningModel } from '@/data/model-options'
import type { Project } from '@/types'
import type { PersistedFinalAssessmentResult } from './assessment-results'
import { createProjectFromPlanInput } from './create-plan'

const BAND_LABELS = {
  concept: '基础概念',
  application: '应用迁移',
  synthesis: '综合场景',
  reflection: '自解释反思',
} as const

interface ReinforcementProjectOptions {
  id?: string
  nowLabel?: string
}

export function buildReinforcementPlanInput(
  sourceProject: Project,
  assessment: PersistedFinalAssessmentResult,
) {
  const focus = assessment.nextPlan.focus.length > 0
    ? assessment.nextPlan.focus
    : assessment.weakBands.map((band) => BAND_LABELS[band])
  const focusText = focus.join('、') || '迁移应用与闭卷解释'

  return buildPlanInput({
    goalType: 'project',
    goalText: `${sourceProject.title} 强化：围绕 ${focusText} 补齐短板，并重新通过终局测评`,
    level: assessment.scorePct >= 70 ? 'intermediate' : 'beginner',
    intensity: assessment.needsContinuation ? 'focused' : 'steady',
    timeBudget: '5-7h',
    deadline: `${assessment.nextPlan.durationDays} 天`,
    preferences: ['problem_sets', 'quizzes', 'hands_on'],
    extraNotes: [
      `源项目：${sourceProject.title}`,
      `上次终局测评分数：${assessment.scorePct}%（${assessment.levelLabel}）`,
      `Miniverto 测评摘要：${assessment.masterySummary}`,
      `强化重点：${focusText}`,
    ].join('\n'),
    methods: selectReinforcementMethods(assessment),
    model: getBestPlanningModel(),
    materials: [],
  })
}

export function createReinforcementProject(
  sourceProject: Project,
  assessment: PersistedFinalAssessmentResult,
  options: ReinforcementProjectOptions = {},
): Project {
  const input = buildReinforcementPlanInput(sourceProject, assessment)
  const project = createProjectFromPlanInput(input, {
    id: options.id,
    nowLabel: options.nowLabel,
  })

  return {
    ...project,
    emoji: '↻',
    title: `${sourceProject.title} 强化计划`,
    goalSummary: [
      `源项目：${sourceProject.title}`,
      `上次测评：${assessment.scorePct}%（${assessment.levelLabel}）`,
      `强化重点：${input.learner.extraNotes?.split('强化重点：')[1] ?? assessment.nextPlan.focus.join('、')}`,
    ].join(' · '),
  }
}

function selectReinforcementMethods(assessment: PersistedFinalAssessmentResult): LearningMethod[] {
  const ids = new Set<LearningMethod['id']>(['retrieval', 'interleaving', 'coaching'])
  if (assessment.weakBands.includes('concept')) ids.add('spaced')
  if (assessment.weakBands.includes('synthesis')) ids.add('project')
  if (assessment.weakBands.includes('application')) ids.add('mit_pset')

  const ordered = ['retrieval', 'interleaving', 'project', 'mit_pset', 'spaced', 'coaching']
  return ordered
    .filter((id): id is LearningMethod['id'] => ids.has(id as LearningMethod['id']))
    .map((id) => LEARNING_METHODS.find((method) => method.id === id)!)
    .slice(0, 4)
}
