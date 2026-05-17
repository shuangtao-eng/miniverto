import type { ReviewTrigger } from './assessment-insights'
import type { LearningContent, Project, Task } from '@/types'

interface ReinforcementTaskOptions {
  id?: string
  nowLabel?: string
}

export function addReinforcementTaskToProject(
  project: Project,
  trigger: ReviewTrigger,
  options: ReinforcementTaskOptions = {},
): Project {
  const reinforcementId = options.id ?? `${trigger.taskId}-reinforce`
  if (project.milestoneList.some((milestone) => milestone.tasks.some((task) => task.id === reinforcementId))) {
    return project
  }

  let added = false
  const milestoneList = project.milestoneList.map((milestone) => {
    const sourceIndex = milestone.tasks.findIndex((task) => task.id === trigger.taskId)
    if (sourceIndex < 0) return milestone

    const sourceTask = milestone.tasks[sourceIndex]!
    const reinforcementTask = buildReinforcementTask(sourceTask, trigger, reinforcementId)
    added = true

    return {
      ...milestone,
      tasks: [
        ...milestone.tasks.slice(0, sourceIndex + 1),
        reinforcementTask,
        ...milestone.tasks.slice(sourceIndex + 1),
      ],
    }
  })

  if (!added) return project
  const tasks = milestoneList.flatMap((milestone) => milestone.tasks)

  return {
    ...project,
    milestoneList,
    completedTasks: tasks.filter((task) => task.status === 'completed').length,
    totalTasks: tasks.length,
    lastActive: options.nowLabel ?? project.lastActive,
  }
}

function buildReinforcementTask(sourceTask: Task, trigger: ReviewTrigger, id: string): Task {
  return {
    id,
    kind: 'practice',
    title: `强化练习：${sourceTask.title}`,
    description: [
      `Miniverto根据课后测评 ${trigger.scorePct}% 生成本补弱任务。`,
      `重点补齐：${trigger.focus.join('、') || '本节关键能力'}。`,
      `建议动作：${trigger.action}`,
    ].join(' '),
    estimatedMinutes: Math.max(25, Math.min(60, sourceTask.estimatedMinutes)),
    status: 'pending',
    resources: sourceTask.resources,
    learningContent: buildReinforcementLearningContent(sourceTask, trigger, id),
    recommendedReferences: sourceTask.recommendedReferences,
    acceptanceCriteria: `完成后重新解释「${sourceTask.title}」，并把课后测评分数从 ${trigger.scorePct}% 提升到 80% 以上。`,
  }
}

function buildReinforcementLearningContent(
  sourceTask: Task,
  trigger: ReviewTrigger,
  id: string,
): LearningContent {
  const focusText = trigger.focus.join('、') || '本节薄弱能力'
  const keyPoints = sourceTask.learningContent?.keyPoints ?? [sourceTask.title, focusText, trigger.action]

  return {
    overview: `Miniverto补弱课：围绕「${sourceTask.title}」中测评未稳的部分进行短程强化。当前分数 ${trigger.scorePct}%，本节目标是补齐 ${focusText}。`,
    keyPoints,
    steps: [
      '先闭卷复述原任务的核心概念，标出卡住的位置。',
      trigger.action,
      '完成分层练习后，再用自己的话写下错误原因和修正方法。',
    ],
    exercises: [
      `用 3 句话重新解释「${sourceTask.title}」。`,
      `针对「${focusText}」完成一个小变式练习。`,
      '列出下一次遇到同类问题时的处理步骤。',
    ],
    reviewPrompt: `24小时后重新完成「${sourceTask.title}」课后测评，目标达到 80% 以上。`,
    learningObjectives: [
      {
        id: `${id}-objective-recall`,
        outcome: `补齐「${sourceTask.title}」的薄弱理解。`,
        evidence: '能闭卷复述关键概念，并指出之前错误的原因。',
      },
      {
        id: `${id}-objective-transfer`,
        outcome: `把「${focusText}」迁移到一个新例子中。`,
        evidence: '完成应用题并记录一个可复用策略。',
      },
    ],
    conceptMap: [
      {
        id: `${id}-concept-source`,
        title: sourceTask.title,
        description: '原任务中需要重新巩固的主题。',
        links: [`${id}-concept-focus`, `${id}-concept-output`],
      },
      {
        id: `${id}-concept-focus`,
        title: focusText,
        description: '课后测评暴露出的薄弱能力。',
        links: [`${id}-concept-source`],
      },
      {
        id: `${id}-concept-output`,
        title: '强化产出',
        description: '一段闭卷解释、一个变式练习和一个错因记录。',
        links: [`${id}-concept-focus`],
      },
    ],
    workedExample: {
      title: `补弱示范：${sourceTask.title}`,
      scenario: `针对测评分数 ${trigger.scorePct}% 的薄弱点做一次小范围重练。`,
      steps: [
        '先写下原题为什么出错或不确定。',
        '只看最小提示，重新完成一个类似例子。',
        '把修正后的思路压缩成一句可复用规则。',
      ],
      takeaway: '补弱不是重读全部资料，而是定位错误、重做变式、沉淀规则。',
    },
    practiceSet: [
      {
        id: `${id}-practice-foundation`,
        level: 'foundation',
        prompt: `闭卷写出「${sourceTask.title}」的3个关键点。`,
        expectedOutcome: '关键点完整、没有明显概念混淆。',
      },
      {
        id: `${id}-practice-application`,
        level: 'application',
        prompt: trigger.action,
        expectedOutcome: '能独立完成并解释选择理由。',
      },
      {
        id: `${id}-practice-challenge`,
        level: 'challenge',
        prompt: '自己设计一个新场景，说明本节方法是否仍然适用。',
        expectedOutcome: '能说清适用边界和一个反例。',
      },
    ],
    commonMistakes: [
      {
        mistake: '只重读资料，没有重做导致失分的能力点。',
        correction: '用原测评弱项反推练习：错在哪里，就练哪里。',
      },
      {
        mistake: '做对一次就立刻跳过复测。',
        correction: '隔24小时复测一次，确认不是短时记忆。',
      },
    ],
    completionRubric: [
      {
        criterion: '复述',
        target: `能闭卷解释「${sourceTask.title}」并指出薄弱点已如何修正。`,
      },
      {
        criterion: '应用',
        target: '能完成一个新变式练习，并记录错误原因。',
      },
      {
        criterion: '复测',
        target: '再次课后测评达到80%以上。',
      },
    ],
    quickCheck: [
      `这次 ${trigger.scorePct}% 的主要失分点是什么？`,
      `你现在能如何解释「${focusText}」？`,
      '下一次遇到同类问题时，第一步应该做什么？',
    ],
  }
}
