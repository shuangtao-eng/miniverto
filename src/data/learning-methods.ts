export type LearningOutcome = 'concept' | 'project' | 'exam' | 'career' | 'research'
export type LearningLevel = 'beginner' | 'intermediate' | 'advanced'
export type LearningIntensity = 'light' | 'steady' | 'focused' | 'sprint'
export type LearningPreference =
  | 'problem_sets'
  | 'quizzes'
  | 'hands_on'
  | 'reading'
  | 'video'
  | 'discussion'

export interface LearningProfile {
  outcome: LearningOutcome
  level: LearningLevel
  intensity: LearningIntensity
  preferences: LearningPreference[]
  hasMaterials: boolean
}

export interface LearningMethod {
  id: 'retrieval' | 'spaced' | 'interleaving' | 'project' | 'mit_pset' | 'coaching'
  title: string
  description: string
  bestFor: string
}

export const LEARNING_METHODS: LearningMethod[] = [
  {
    id: 'mit_pset',
    title: 'MIT/PSET 风格',
    description: '讲义阅读、密集问题集、错题讲解和复盘形成闭环。',
    bestFor: '考试、硬核理论、数学或工程课程',
  },
  {
    id: 'retrieval',
    title: '主动回忆',
    description: '用闭卷复述、快速测验和错题回收检验是否真正掌握。',
    bestFor: '概念记忆、考试准备、术语密集主题',
  },
  {
    id: 'spaced',
    title: '间隔重复',
    description: '把复习任务分布到多个时间点，减少一次性突击后的遗忘。',
    bestFor: '长期学习、语言、医学、认证考试',
  },
  {
    id: 'interleaving',
    title: '交错练习',
    description: '穿插不同题型和概念，训练迁移能力，而不是只刷同类题。',
    bestFor: '数学、编程、问题解决型技能',
  },
  {
    id: 'project',
    title: '项目驱动',
    description: '用可交付成果倒推知识点、练习和阶段检查。',
    bestFor: '编程、设计、业务技能、作品集目标',
  },
  {
    id: 'coaching',
    title: '教练式调参',
    description: '定期评估进度和难度，让 Miniverto 根据反馈重排计划。',
    bestFor: '不确定起点、时间波动、长期计划',
  },
]

const METHOD_BY_ID = Object.fromEntries(LEARNING_METHODS.map((method) => [method.id, method])) as Record<
  LearningMethod['id'],
  LearningMethod
>

export function recommendLearningMethods(profile: LearningProfile): LearningMethod[] {
  const scores: Record<LearningMethod['id'], number> = {
    mit_pset: 0,
    retrieval: 0,
    spaced: 0,
    interleaving: 0,
    project: 0,
    coaching: 1,
  }

  if (profile.outcome === 'exam') {
    scores.mit_pset += 5
    scores.retrieval += 4
    scores.spaced += 3
  }

  if (profile.outcome === 'project' || profile.outcome === 'career') {
    scores.project += 5
    scores.interleaving += 2
    scores.coaching += 2
  }

  if (profile.outcome === 'research' || profile.outcome === 'concept') {
    scores.retrieval += 3
    scores.interleaving += 3
    scores.spaced += 2
  }

  if (profile.preferences.includes('problem_sets')) scores.mit_pset += 3
  if (profile.preferences.includes('quizzes')) scores.retrieval += 3
  if (profile.preferences.includes('hands_on')) scores.project += 3
  if (profile.preferences.includes('reading')) scores.spaced += 1

  if (profile.level === 'beginner') scores.coaching += 2
  if (profile.intensity === 'focused' || profile.intensity === 'sprint') {
    scores.mit_pset += 1
    scores.retrieval += 1
  }
  if (profile.hasMaterials) {
    scores.spaced += 1
    scores.retrieval += 1
  }

  return (Object.keys(scores) as LearningMethod['id'][])
    .sort((a, b) => scores[b] - scores[a])
    .slice(0, 4)
    .map((id) => METHOD_BY_ID[id])
}
