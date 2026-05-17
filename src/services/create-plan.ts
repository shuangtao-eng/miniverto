import type { LearningContent, Project, RecommendedReference, Task } from '@/types'
import type { buildPlanInput } from '@/data/plan-input'
import type { PlanJsonResponse } from './plan-prompt'
import { buildDiagnosticSummary } from './diagnostic-assessment'

type PlanInput = ReturnType<typeof buildPlanInput>
type PlanInputMaterial = PlanInput['materials'][number]

interface CreateProjectOptions {
  id?: string
  nowLabel?: string
}

export function createProjectFromPlanInput(input: PlanInput, options: CreateProjectOptions = {}): Project {
  const id = options.id ?? `project-${Date.now()}`
  const title = input.learner.goalText || '新的学习计划'
  const methodNames = input.methods.map((method) => method.title).join('、')
  const diagnosticSummary = buildDiagnosticSummary(input.learner.diagnostic)
  const materialSummary = input.materials.length > 0
    ? `参考 ${input.materials.length} 份学习资料。`
    : '暂未加入学习资料。'
  const profileSummary = buildProfileSummary(input.learner.profile)
  const makeTask = (suffix: string, kind: Task['kind'], taskTitle: string, estimatedMinutes: number) =>
    task(`${id}-${suffix}`, kind, taskTitle, estimatedMinutes, input)

  const milestoneList = [
    {
      id: `${id}-m1`,
      title: '建立知识地图与真实起点',
      successCriteria: '能说清学习范围、关键术语、已掌握内容和最需要补强的薄弱点。',
      tasks: [
        makeTask('t1', 'reading', '梳理核心资料、术语和学习地图', 45),
        makeTask('t2', 'practice', '完成起点摸底和薄弱点定位', 30),
        makeTask('t3', 'reflection', '写下最不清楚的 3 个问题', 20),
      ],
    },
    {
      id: `${id}-m2`,
      title: '精讲学习与交错练习',
      successCriteria: '能在混合题型或真实场景中稳定完成关键任务。',
      tasks: [
        makeTask('t4', 'reading', `按 ${methodNames || '推荐学习法'} 学习第一组核心内容`, 60),
        makeTask('t5', 'practice', '完成 MIT/PSET 风格问题集', 90),
        makeTask('t6', 'practice', '进行主动回忆和错题回收', 45),
      ],
    },
    {
      id: `${id}-m3`,
      title: '产出、评估与重规划',
      successCriteria: '完成一个可验证产出，并能说明下一轮改进方向。',
      tasks: [
        makeTask('t7', 'practice', '完成阶段项目或模拟考试', 120),
        makeTask('t8', 'reflection', '闭卷讲解关键概念并记录卡点', 40),
        makeTask('t9', 'other', '让 Miniverto 根据结果重规划下一轮', 20),
      ],
    },
  ]

  return {
    id,
    emoji: input.learner.goalType === 'exam' ? 'E' : 'L',
    title,
    goalSummary: [
      `${input.learner.level} · ${input.learner.intensity} · ${input.learner.timeBudget}。${materialSummary}`,
      profileSummary,
      diagnosticSummary,
    ].filter(Boolean).join(' '),
    status: 'active',
    milestoneList,
    completedTasks: 0,
    totalTasks: milestoneList.reduce((sum, milestone) => sum + milestone.tasks.length, 0),
    criticScore: 8.5,
    criticDimensions: [
      { label: '结构性', score: 9, maxScore: 10 },
      { label: '可执行性', score: 8, maxScore: 10 },
      { label: '资料贴合度', score: input.materials.length > 0 ? 9 : 7, maxScore: 10 },
    ],
    lastActive: options.nowLabel ?? '刚刚',
  }
}

export function createProjectFromPlanResponse(response: PlanJsonResponse, options: CreateProjectOptions = {}): Project {
  const id = options.id ?? `project-${Date.now()}`
  const milestoneList = response.milestones.map((milestone, milestoneIndex) => ({
    id: `${id}-m${milestoneIndex + 1}`,
    title: milestone.title,
    successCriteria: milestone.successCriteria,
    tasks: milestone.tasks.map((responseTask, taskIndex): Task => ({
      id: `${id}-m${milestoneIndex + 1}-t${taskIndex + 1}`,
      kind: responseTask.kind,
      title: responseTask.title,
      description: responseTask.description,
      estimatedMinutes: responseTask.estimatedMinutes,
      suggestedDate: responseTask.suggestedDate,
      acceptanceCriteria: responseTask.acceptanceCriteria,
      learningContent: responseTask.learningContent,
      recommendedReferences: responseTask.recommendedReferences,
      status: responseTask.status,
    })),
  }))

  return {
    id,
    emoji: response.emoji,
    title: response.title,
    goalSummary: response.goalSummary,
    status: 'active',
    milestoneList,
    completedTasks: 0,
    totalTasks: milestoneList.reduce((sum, milestone) => sum + milestone.tasks.length, 0),
    criticScore: response.criticScore,
    lastActive: options.nowLabel ?? '刚刚',
  }
}

function buildProfileSummary(profile: PlanInput['learner']['profile']): string {
  if (!profile) return ''
  const parts = [
    profile.purposeDetails ? `目的：${profile.purposeDetails}` : '',
    profile.currentSituation ? `现状：${profile.currentSituation}` : '',
    profile.blockers ? `主要障碍：${profile.blockers}` : '',
    profile.successDefinition ? `成功标准：${profile.successDefinition}` : '',
  ].filter(Boolean)
  return parts.length > 0 ? `用户画像：${parts.join('；')}` : ''
}

function buildProfilePlanningHint(profile: PlanInput['learner']['profile']): string {
  if (!profile) return ''
  const parts = [
    profile.role ? `身份/角色：${profile.role}` : '',
    profile.purposeDetails ? `学习目的：${profile.purposeDetails}` : '',
    profile.targetScenario ? `目标场景：${profile.targetScenario}` : '',
    profile.currentSituation ? `当前情况：${profile.currentSituation}` : '',
    profile.priorBackground ? `已有背景：${profile.priorBackground}` : '',
    profile.schedulePattern ? `可用时间：${profile.schedulePattern}` : '',
    profile.sessionLength ? `单次学习时长：${profile.sessionLength}` : '',
    profile.deviceContext ? `设备和场景：${profile.deviceContext}` : '',
    profile.learningPreferenceDetail ? `学习偏好细节：${profile.learningPreferenceDetail}` : '',
    profile.supportPreference ? `支持方式：${profile.supportPreference}` : '',
    profile.baselineConfidence ? `基础信心：${profile.baselineConfidence}` : '',
    profile.studyHabits ? `学习习惯：${profile.studyHabits}` : '',
    profile.devices ? `使用设备：${profile.devices}` : '',
    profile.learningEnvironment ? `学习环境：${profile.learningEnvironment}` : '',
    profile.blockers ? `需要规避的障碍：${profile.blockers}` : '',
    profile.feedbackPreference ? `反馈偏好：${profile.feedbackPreference}` : '',
    profile.contentDepth ? `内容深度：${profile.contentDepth}` : '',
    profile.successDefinition ? `验收方式：${profile.successDefinition}` : '',
  ].filter(Boolean)
  return parts.length > 0 ? `个性化要求：${parts.join('；')}。` : ''
}

function buildLessonPersonalizationNotes(profile: PlanInput['learner']['profile']): string | undefined {
  if (!profile) return undefined
  const notes = [
    profile.purposeDetails ? `围绕「${profile.purposeDetails}」安排学习任务` : '',
    profile.targetScenario ? `目标场景是「${profile.targetScenario}」` : '',
    profile.schedulePattern ? `按「${profile.schedulePattern}」拆成可执行学习块` : '',
    profile.sessionLength ? `单次学习按「${profile.sessionLength}」控制` : '',
    profile.deviceContext ? `主要设备和场景是「${profile.deviceContext}」` : '',
    profile.learningPreferenceDetail ? `学习顺序采用「${profile.learningPreferenceDetail}」` : '',
    profile.supportPreference ? `支持方式采用「${profile.supportPreference}」` : '',
    profile.baselineConfidence ? `基础判断：${profile.baselineConfidence}` : '',
    profile.feedbackPreference ? `反馈方式采用「${profile.feedbackPreference}」` : '',
    profile.contentDepth ? `内容颗粒度采用「${profile.contentDepth}」` : '',
    profile.blockers ? `特别规避：${profile.blockers}` : '',
    profile.successDefinition ? `验收对齐：${profile.successDefinition}` : '',
    profile.purposeDetails?.includes('转行') || profile.successDefinition?.includes('作品集')
      ? '每周加入作品集检查、面试讲解和可展示项目产出。'
      : '',
    profile.purposeDetails?.includes('考试') || profile.targetScenario?.includes('考试')
      ? '每节课加入模拟题、错题回收和考点辨析。'
      : '',
  ].filter(Boolean)
  return notes.length > 0 ? notes.join('；') : undefined
}

function task(
  id: string,
  kind: Task['kind'],
  title: string,
  estimatedMinutes: number,
  input: PlanInput,
): Task {
  const methodNames = input.methods.map((method) => method.title).join('、') || '主动回忆、间隔复习和项目练习'
  const materialNames = input.materials.map((material) => material.name).join('、')
  const materialHint = materialNames ? `优先参考已选择资料：${materialNames}。` : '先使用你已有的教材、课程笔记或可信资料。'
  const diagnosticHint = buildDiagnosticSummary(input.learner.diagnostic)
  const profileHint = buildProfilePlanningHint(input.learner.profile)
  const planningHint = [materialHint, diagnosticHint, profileHint].filter(Boolean).join(' ')

  return {
    id,
    kind,
    title,
    description: guidanceDescription(kind, title, input.learner.goalText, methodNames, planningHint),
    estimatedMinutes,
    resources: [
      {
        id: `${id}-method`,
        type: 'article',
        title: `学习方法：${methodNames}`,
      },
      {
        id: `${id}-materials`,
        type: 'link',
        title: planningHint,
      },
    ],
    learningContent: buildLearningContent(
      id,
      kind,
      title,
      input.learner.goalText,
      methodNames,
      planningHint,
      input.materials,
      input.learner.profile,
    ),
    recommendedReferences: buildRecommendedReferences(id, input.learner.goalText, kind),
    acceptanceCriteria: acceptanceCriteria(kind, title, input.learner.goalText),
    status: 'pending',
  }
}

function buildLearningContent(
  id: string,
  kind: Task['kind'],
  title: string,
  goal: string,
  methodNames: string,
  materialHint: string,
  materials: PlanInputMaterial[],
  profile: PlanInput['learner']['profile'],
): LearningContent {
  const mediaSuggestions = buildMediaSuggestions(id, title, goal, kind, profile)
  const materialCitations = buildMaterialCitations(id, title, materials)
  const citationIds = materialCitations.map((citation) => citation.id)
  const personalizationNotes = buildLessonPersonalizationNotes(profile)
  return {
    overview: `Miniverto 学习课：本节围绕「${title}」，服务于目标「${goal}」。${materialHint}`,
    personalizationNotes,
    prerequisites: buildPrerequisites(kind, title, profile),
    glossary: buildGlossary(title, goal),
    deliverable: buildLessonDeliverable(kind, title, goal, profile),
    teachingScript: buildTeachingScript(id, kind, title, goal, profile),
    answerKey: buildAnswerKey(id, title, goal, profile),
    reviewCards: buildReviewCards(kind, title, goal, profile),
    nextStepHint: buildNextStepHint(kind, title, goal, profile),
    keyPoints: [
      '先明确本任务要解决的核心问题，避免直接堆资料。',
      `使用 ${methodNames} 把学习变成可回忆、可检查、可复盘的过程。`,
      personalizationNotes || '根据当前目标，把每节课都落到一个可检查的小产出上。',
      '每次学习都留下可检查产出，后续测评和强化计划会用到它。',
    ],
    steps: stepsFor(kind, title),
    exercises: exercisesFor(kind, title),
    reviewPrompt: `闭卷用 3 分钟解释「${title}」和「${goal}」的关系，并写下一个仍不确定的问题。`,
    learningObjectives: buildLearningObjectives(id, kind, title, goal),
    conceptMap: buildConceptMap(id, title, goal),
    workedExample: buildWorkedExample(kind, title, goal),
    practiceSet: buildPracticeSet(id, kind, title, goal, profile),
    commonMistakes: buildCommonMistakes(kind, title),
    completionRubric: buildCompletionRubric(kind, title, goal),
    lessonBlocks: buildLessonBlocks(id, kind, title, goal, mediaSuggestions.map((media) => media.id), citationIds, profile),
    materialCitations,
    mediaSuggestions,
    quickCheck: [
      `这节内容解决「${goal}」中的哪个具体问题？`,
      `如果不看资料，你能复述「${title}」的 3 个关键点吗？`,
      '你现在最容易出错或卡住的步骤是什么？',
    ],
  }
}

function buildTeachingScript(
  id: string,
  kind: Task['kind'],
  title: string,
  goal: string,
  profile: PlanInput['learner']['profile'],
): NonNullable<LearningContent['teachingScript']> {
  const learnerMode = isExamProfile(profile)
    ? '考试场景下要把概念转成判断规则。'
    : isCareerProfile(profile)
      ? '求职场景下要把知识转成可展示项目解释。'
      : '普通学习场景下要先理解，再练习，再复盘。'

  return [
    {
      id: `${id}-teach-why`,
      title: '为什么这一节重要',
      body: `「${title}」是推进「${goal}」的一个小闭环：先理解关键概念，再完成可检查产出。${learnerMode}`,
      example: kind === 'practice'
        ? '如果这是练习任务，先写成功标准，再做最小可行版本。'
        : '如果这是阅读任务，先把定义、例子、反例各写一句。',
    },
    {
      id: `${id}-teach-how`,
      title: '怎么学这一节',
      body: '按“预测答案、学习材料、闭卷复述、完成练习、记录错因”的顺序推进，避免只看懂但不会用。',
      example: `学完后用自己的话解释「${title}」，再把它用于「${goal}」中的一个真实场景。`,
    },
  ]
}

function buildAnswerKey(
  id: string,
  title: string,
  goal: string,
  profile: PlanInput['learner']['profile'],
): NonNullable<LearningContent['answerKey']> {
  if (isCareerProfile(profile)) {
    return [
      {
        practiceId: `${id}-practice-application`,
        expectedAnswer: `A portfolio-ready explanation showing the problem, choices, result, and lesson learned for "${goal}".`,
        checkMethod: 'The answer can be spoken as a one-minute interview story with a concrete tradeoff.',
      },
      {
        practiceId: `${id}-practice-challenge`,
        expectedAnswer: `A small artifact or note that can be reused in a portfolio review for "${title}".`,
        checkMethod: 'The artifact states context, implementation choice, measurable result, and next improvement.',
      },
    ]
  }

  if (isExamProfile(profile)) {
    return [
      {
        practiceId: `${id}-practice-application`,
        expectedAnswer: `A timed answer for "${title}" with the selected rule and reason.`,
        checkMethod: 'The answer names the wrong option trap and the review rule for similar questions.',
      },
      {
        practiceId: `${id}-practice-challenge`,
        expectedAnswer: `A mock-question variation connected to "${goal}" with a corrected explanation.`,
        checkMethod: 'The answer is completed under time pressure and logs at least one wrong-answer pattern.',
      },
    ]
  }

  return [
    {
      practiceId: `${id}-practice-foundation`,
      expectedAnswer: `A plain-language explanation of the three most important ideas in "${title}".`,
      checkMethod: 'The explanation is understandable without opening the source material.',
    },
    {
      practiceId: `${id}-practice-application`,
      expectedAnswer: `One concrete use of "${title}" inside the larger goal "${goal}".`,
      checkMethod: 'The answer includes a situation, action, result, and remaining question.',
    },
  ]
}

function buildReviewCards(
  kind: Task['kind'],
  title: string,
  goal: string,
  profile: PlanInput['learner']['profile'],
): NonNullable<LearningContent['reviewCards']> {
  const tag = isExamProfile(profile) ? 'exam-review' : isCareerProfile(profile) ? 'portfolio-review' : 'active-recall'
  return [
    {
      front: `What problem does "${title}" solve?`,
      back: `It helps move "${goal}" forward by creating a checkable understanding or output.`,
      tag,
    },
    {
      front: `What is the most likely mistake in "${title}"?`,
      back: kind === 'practice'
        ? 'Looking at hints too early instead of trying independently first.'
        : 'Reading or summarizing without reconstructing the idea from memory.',
      tag,
    },
  ]
}

function buildNextStepHint(
  kind: Task['kind'],
  title: string,
  goal: string,
  profile: PlanInput['learner']['profile'],
) {
  if (isCareerProfile(profile)) {
    return `把「${title}」的产出加入作品集材料，并准备一段面试讲解，再继续推进「${goal}」。`
  }
  if (isExamProfile(profile)) {
    return `把「${title}」里的错题规则加入复习卡，下一节继续做限时模拟和错题回收。`
  }
  if (kind === 'reflection') {
    return '把本节复盘沉淀到长期笔记，下一次学习先用它做主动回忆。'
  }
  return `先用 3 分钟闭卷复述「${title}」，再进入下一节与「${goal}」更接近的练习。`
}

function buildPrerequisites(
  kind: Task['kind'],
  title: string,
  profile: PlanInput['learner']['profile'],
): NonNullable<LearningContent['prerequisites']> {
  const checks = [
    `已经知道本节为什么要学习「${title}」，并能说出它服务的具体目标。`,
    kind === 'practice'
      ? '已经准备好独立尝试 10 分钟后再查看提示。'
      : '已经准备好把资料内容转成自己的解释，而不是只做摘抄。',
  ]

  if (isCareerProfile(profile)) {
    checks.push('已经准备好把本节输出整理成作品集证据或面试讲解素材。')
  } else if (isExamProfile(profile)) {
    checks.push('已经准备好限时作答，并把错题原因写成可复习规则。')
  } else if (profile?.schedulePattern) {
    checks.push(`已经为本节留出学习时间：${profile.schedulePattern}。`)
  }

  return checks
}

function buildGlossary(title: string, goal: string): NonNullable<LearningContent['glossary']> {
  return [
    {
      term: '核心概念',
      meaning: `本节必须真正理解并能迁移使用的关键想法，围绕「${title}」展开。`,
      example: `学习「${title}」时，不只背定义，还要能用它解释「${goal}」中的一个真实场景。`,
    },
    {
      term: '可检查产出',
      meaning: '能证明学习发生过的具体作品、答案、讲解、笔记或练习结果。',
      example: '完成后留下一个别人可以检查的说明、题解、项目片段或错题复盘。',
    },
    {
      term: '主动回忆',
      meaning: '合上资料后从记忆中重建内容，用遗忘暴露理解漏洞。',
      example: `学完「${title}」后闭卷讲 3 分钟，再回看资料补掉遗漏点。`,
    },
  ]
}

function buildLessonDeliverable(
  kind: Task['kind'],
  title: string,
  goal: string,
  profile: PlanInput['learner']['profile'],
): NonNullable<LearningContent['deliverable']> {
  if (isCareerProfile(profile)) {
    return {
      title: `Portfolio artifact for ${title}`,
      format: 'portfolio note + interview explanation',
      acceptanceCheck: `The portfolio artifact explains the problem, your choices, the result, and a one-minute interview story connected to "${goal}".`,
    }
  }

  if (isExamProfile(profile)) {
    return {
      title: `Timed mock drill for ${title}`,
      format: 'timed mock answers + wrong-answer log',
      acceptanceCheck: `Finish a timed mock item, mark every wrong-answer trap, and write the review rule for the next mock practice on "${goal}".`,
    }
  }

  if (kind === 'practice') {
    return {
      title: `完成一个「${title}」小练习`,
      format: '练习结果 + 错因记录',
      acceptanceCheck: `产出能被他人复查，并清楚写出它如何推进「${goal}」以及下一次要避免的错误。`,
    }
  }

  if (kind === 'reflection') {
    return {
      title: `沉淀一张「${title}」长期笔记`,
      format: '问题、答案、例子、下次复习触发器',
      acceptanceCheck: '这张笔记下周仍能直接用于复习，并包含一个例子、一个反例和一个待解决问题。',
    }
  }

  return {
    title: `写出「${title}」的可复述说明`,
    format: '3 分钟闭卷讲解稿 + 关键点清单',
    acceptanceCheck: `不看资料也能解释 3 个关键点，并说明它们如何服务于「${goal}」。`,
  }
}

function buildLessonBlocks(
  id: string,
  kind: Task['kind'],
  title: string,
  goal: string,
  mediaIds: string[],
  citationIds: string[],
  profile: PlanInput['learner']['profile'],
): NonNullable<LearningContent['lessonBlocks']> {
  const personalizationNotes = buildLessonPersonalizationNotes(profile)
  const adaptiveBullets = adaptiveLessonBullets(profile)
  return [
    {
      id: `${id}-hook`,
      type: 'hook',
      title: '为什么现在学这一节',
      body: [
        `这一节不是孤立知识点，而是为了让你离「${goal}」更近一步。先把它当成一个要解决的问题：完成「${title}」以后，你应该能产出一段解释、一道练习或一个可检查的小成果。`,
        personalizationNotes ? `本节按用户画像调整：${personalizationNotes}` : '',
      ].filter(Boolean).join(' '),
      bullets: ['先看目标', '再看例子', '最后做小产出', ...adaptiveBullets],
      mediaSuggestionIds: compactIds(mediaIds[0]),
      citationIds,
    },
    {
      id: `${id}-concept`,
      type: 'concept',
      title: '核心概念拆解',
      body: `把「${title}」拆成定义、适用场景、常见误区三层。学习时先写下你以为它是什么，再对照资料修正，这样比被动阅读更容易暴露真实理解差距。`,
      bullets: ['定义：用一句话说明', '场景：什么时候用', '误区：什么时候会误用'],
      mediaSuggestionIds: compactIds(mediaIds[0]),
      citationIds,
    },
    {
      id: `${id}-example`,
      type: 'example',
      title: '示例演练',
      body: `选择一个与你目标最接近的小例子，先观察输入、限制和输出，再解释每一步为什么这样做。不要急着追求完整，先让例子小到可以闭卷复述。`,
      bullets: exampleBullets(kind),
      mediaSuggestionIds: compactIds(mediaIds[1]),
      citationIds,
    },
    {
      id: `${id}-steps`,
      type: 'steps',
      title: '操作路径',
      body: '按“预判答案 -> 学习资料 -> 闭卷复述 -> 小练习 -> 记录卡点”的顺序走一遍。这个顺序会让学习从阅读变成可验证的训练。',
      bullets: stepsFor(kind, title),
      citationIds,
    },
    {
      id: `${id}-exercise`,
      type: 'exercise',
      title: '马上练一下',
      body: [
        '完成下面的小练习后再标记任务进度。练习不追求难，而是要让你立刻知道自己是否真的会用。',
        personalizationNotes ? `练习会对齐：${personalizationNotes}` : '',
      ].filter(Boolean).join(' '),
      bullets: [...exercisesFor(kind, title), ...adaptiveExerciseBullets(profile)],
      citationIds,
    },
    {
      id: `${id}-reflection`,
      type: 'reflection',
      title: '复盘沉淀',
      body: '最后把本节最有价值的一句话、一个例子、一个仍然不确定的问题写进笔记。后续可以转成长期知识库笔记。',
      bullets: ['一句话总结', '一个例子', '一个待解决问题'],
    },
  ]
}

function buildMediaSuggestions(
  id: string,
  title: string,
  goal: string,
  kind: Task['kind'],
  profile?: PlanInput['learner']['profile'],
): NonNullable<LearningContent['mediaSuggestions']> {
  const visualFocus = profile?.purposeDetails?.includes('考试') || profile?.targetScenario?.includes('考试')
    ? '突出考点、错题陷阱和模拟题判断路径'
    : profile?.purposeDetails?.includes('转行') || profile?.successDefinition?.includes('作品集')
      ? '突出作品集产出、项目流程和面试讲解'
      : '突出关键概念、练习路径和常见误区'
  return [
    {
      id: `${id}-diagram`,
      type: 'diagram',
      title: '概念关系图',
      purpose: `帮助用户把术语、步骤和目标之间的关系看清楚，并${visualFocus}。`,
      promptOrQuery: `为「${title}」生成一张中文概念关系图，中心是「${goal}」，${visualFocus}。`,
      placement: '核心概念拆解',
    },
    {
      id: `${id}-video`,
      type: 'video',
      title: kind === 'practice' ? '实操演示视频' : '短讲解视频',
      purpose: `用 5-12 分钟的演示降低理解门槛，再回到 App 内练习；视频重点应${visualFocus}。`,
      promptOrQuery: `${goal} ${title} ${visualFocus} 演示 10分钟`,
      placement: '示例演练',
    },
  ]
}

function compactIds(...ids: Array<string | undefined>) {
  return ids.filter((id): id is string => Boolean(id))
}

function isCareerProfile(profile: PlanInput['learner']['profile']): boolean {
  const text = profileText(profile)
  return [
    '转行',
    '求职',
    '作品集',
    '面试',
    'career',
    'job',
    'portfolio',
    'interview',
  ].some((keyword) => text.includes(keyword))
}

function isExamProfile(profile: PlanInput['learner']['profile']): boolean {
  const text = profileText(profile)
  return [
    '考试',
    '证书',
    '模拟题',
    '错题',
    'exam',
    'certificate',
    'mock',
    'wrong-answer',
    'wrong answer',
  ].some((keyword) => text.includes(keyword))
}

function profileText(profile: PlanInput['learner']['profile']): string {
  if (!profile) return ''
  return Object.values(profile)
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase()
}

function adaptiveLessonBullets(profile: PlanInput['learner']['profile']): string[] {
  if (!profile) return []
  const bullets: string[] = []
  if (profile.targetScenario) bullets.push(`目标场景：${profile.targetScenario}`)
  if (profile.schedulePattern) bullets.push(`时间安排：${profile.schedulePattern}`)
  if (profile.feedbackPreference) bullets.push(`反馈检查：${profile.feedbackPreference}`)
  if (profile.purposeDetails?.includes('转行') || profile.successDefinition?.includes('作品集')) {
    bullets.push('保留一个可放入作品集的证明材料')
    bullets.push('准备 1 分钟面试讲解版本')
  }
  if (profile.purposeDetails?.includes('考试') || profile.targetScenario?.includes('考试')) {
    bullets.push('完成 3 道模拟题并标注考点')
    bullets.push('把错题写成可复习的判断规则')
  }
  return bullets
}

function adaptiveExerciseBullets(profile: PlanInput['learner']['profile']): string[] {
  if (!profile) return []
  const bullets: string[] = []
  if (profile.purposeDetails?.includes('转行') || profile.successDefinition?.includes('作品集')) {
    bullets.push('把本节产出整理成作品集检查项：问题、做法、结果、下一步。')
  }
  if (profile.purposeDetails?.includes('考试') || profile.targetScenario?.includes('考试')) {
    bullets.push('做一组限时模拟题，记录错题原因和对应考点。')
  }
  if (profile.blockers?.includes('缺少反馈')) {
    bullets.push('写下希望 Miniverto 或外部反馈者检查的 1 个具体问题。')
  }
  return bullets
}

function buildMaterialCitations(
  taskId: string,
  title: string,
  materials: PlanInputMaterial[],
): NonNullable<LearningContent['materialCitations']> {
  return materials.slice(0, 3).map((material, index) => ({
    id: `${taskId}-citation-${index + 1}`,
    materialId: material.id,
    materialName: material.name,
    summary: material.summary,
    reason: `用于校准「${title}」的讲解、例子和练习，避免学习内容脱离用户已上传资料。`,
  }))
}

function buildLearningObjectives(
  id: string,
  kind: Task['kind'],
  title: string,
  goal: string,
): NonNullable<LearningContent['learningObjectives']> {
  return [
    {
      id: `${id}-objective-understand`,
      outcome: `Explain how "${title}" supports the larger goal "${goal}".`,
      evidence: 'The user can give a one-minute explanation without reading the notes.',
    },
    {
      id: `${id}-objective-apply`,
      outcome: objectiveForKind(kind, title),
      evidence: 'The user completes the in-app practice and records one concrete takeaway.',
    },
  ]
}

function buildConceptMap(
  id: string,
  title: string,
  goal: string,
): NonNullable<LearningContent['conceptMap']> {
  return [
    {
      id: `${id}-concept-goal`,
      title: goal,
      description: 'The long-term learning target this task should move toward.',
      links: [`${id}-concept-task`, `${id}-concept-output`],
    },
    {
      id: `${id}-concept-task`,
      title,
      description: 'The focused topic or skill for this learning session.',
      links: [`${id}-concept-goal`, `${id}-concept-mistake`],
    },
    {
      id: `${id}-concept-output`,
      title: 'Observable output',
      description: 'A note, solved exercise, explanation, or small project artifact that proves progress.',
      links: [`${id}-concept-task`],
    },
    {
      id: `${id}-concept-mistake`,
      title: 'Common mistake',
      description: 'The likely misunderstanding to catch before it becomes a habit.',
      links: [`${id}-concept-task`],
    },
  ]
}

function buildWorkedExample(
  kind: Task['kind'],
  title: string,
  goal: string,
): NonNullable<LearningContent['workedExample']> {
  if (kind === 'practice') {
    return {
      title: `Worked example: solve a small version of "${title}"`,
      scenario: `Use the smallest realistic exercise that still belongs to "${goal}".`,
      steps: [
        'Write the expected input, output, and success condition before solving.',
        'Solve the simplest version first and mark every assumption.',
        'Compare the result with the success condition and record the first correction.',
      ],
      takeaway: 'A worked example is useful only when the user can explain why each step exists.',
    }
  }

  if (kind === 'reflection') {
    return {
      title: `Worked example: turn "${title}" into a usable note`,
      scenario: 'Convert one confusing point into a permanent knowledge note.',
      steps: [
        'State the confusing point as a question.',
        'Answer it with one example and one counterexample.',
        'Add the next review trigger so Miniverto can reuse it later.',
      ],
      takeaway: 'A reflection becomes useful when it creates a future retrieval cue.',
    }
  }

  return {
    title: `Worked example: learn "${title}" actively`,
    scenario: `Study one source section and convert it into a usable explanation for "${goal}".`,
    steps: [
      'Preview the section and predict the answer before reading closely.',
      'Extract the definition, one example, and one common boundary case.',
      'Close the source and reconstruct the explanation in your own words.',
    ],
    takeaway: 'Reading is complete only after the user can reconstruct the idea without the source.',
  }
}

function buildPracticeSet(
  id: string,
  kind: Task['kind'],
  title: string,
  goal: string,
  profile: PlanInput['learner']['profile'],
): NonNullable<LearningContent['practiceSet']> {
  const profileChallenge = adaptiveChallengePrompt(profile, goal)
  return [
    {
      id: `${id}-practice-foundation`,
      level: 'foundation',
      prompt: `List the three most important ideas from "${title}" and define each in one sentence.`,
      expectedOutcome: 'The user can recall the core terms without looking at the lesson text.',
    },
    {
      id: `${id}-practice-application`,
      level: 'application',
      prompt: practicePromptForKind(kind, title, goal),
      expectedOutcome: 'The user applies the idea to a realistic case instead of only repeating a definition.',
    },
    {
      id: `${id}-practice-challenge`,
      level: 'challenge',
      prompt: profileChallenge ?? `Create one unfamiliar variation related to "${goal}" and explain how "${title}" changes your approach.`,
      expectedOutcome: profileChallenge
        ? 'The user completes a profile-specific transfer task and records evidence for the next review.'
        : 'The user transfers the skill to a new situation and names the remaining gap.',
    },
  ]
}

function adaptiveChallengePrompt(profile: PlanInput['learner']['profile'], goal: string): string | null {
  if (!profile) return null
  if (profile.purposeDetails?.includes('转行') || profile.successDefinition?.includes('作品集')) {
    return `Turn this lesson into a portfolio artifact for "${goal}", then write a short interview explanation covering context, choices, and tradeoffs.`
  }
  if (profile.purposeDetails?.includes('考试') || profile.targetScenario?.includes('考试')) {
    return `Create a timed mock-question variation for "${goal}", answer it, then write the wrong-answer trap and the rule for reviewing similar mistakes.`
  }
  if (profile.targetScenario) {
    return `Apply this lesson to the target scenario "${profile.targetScenario}" and define one checkable output.`
  }
  return null
}

function buildCommonMistakes(
  kind: Task['kind'],
  title: string,
): NonNullable<LearningContent['commonMistakes']> {
  return [
    {
      mistake: `Treating "${title}" as something to read once instead of something to retrieve and use.`,
      correction: 'Close the source, reconstruct the idea, then check what was missing.',
    },
    {
      mistake: mistakeForKind(kind),
      correction: correctionForKind(kind),
    },
  ]
}

function buildCompletionRubric(
  kind: Task['kind'],
  title: string,
  goal: string,
): NonNullable<LearningContent['completionRubric']> {
  return [
    {
      criterion: 'Recall',
      target: `Explain "${title}" without notes in plain language.`,
    },
    {
      criterion: 'Application',
      target: rubricTargetForKind(kind, goal),
    },
    {
      criterion: 'Next-step clarity',
      target: 'Record one thing mastered, one weak point, and one next action.',
    },
  ]
}

function objectiveForKind(kind: Task['kind'], title: string) {
  if (kind === 'practice') return `Solve a small but complete practice task for "${title}".`
  if (kind === 'reflection') return `Turn "${title}" into a reusable long-term note.`
  if (kind === 'reading') return `Extract the definition, example, and boundary case for "${title}".`
  return `Decide whether "${title}" is complete enough to continue or needs replanning.`
}

function practicePromptForKind(kind: Task['kind'], title: string, goal: string) {
  if (kind === 'practice') return `Complete one realistic exercise for "${title}" and annotate every failed attempt.`
  if (kind === 'reflection') return `Write a short note linking "${title}" to the goal "${goal}" with one example.`
  if (kind === 'reading') return `Use "${title}" to explain a concrete case from "${goal}" to a beginner.`
  return `Review the current output for "${goal}" and decide the next adjustment.`
}

function mistakeForKind(kind: Task['kind']) {
  if (kind === 'practice') return 'Looking at hints too early and mistaking recognition for ability.'
  if (kind === 'reflection') return 'Writing a diary-style summary without an example or future review cue.'
  if (kind === 'reading') return 'Highlighting many sentences without converting them into recall questions.'
  return 'Marking the task complete without checking whether the output is usable.'
}

function correctionForKind(kind: Task['kind']) {
  if (kind === 'practice') return 'Try independently first, then use the smallest hint and record what changed.'
  if (kind === 'reflection') return 'Write one question, one answer, one example, and one next review trigger.'
  if (kind === 'reading') return 'Convert each important point into a question and answer it from memory.'
  return 'Use the rubric to decide continue, strengthen, or replan.'
}

function rubricTargetForKind(kind: Task['kind'], goal: string) {
  if (kind === 'practice') return `Produces a checkable exercise result that moves "${goal}" forward.`
  if (kind === 'reflection') return `Creates a note that can be reused during the next review of "${goal}".`
  if (kind === 'reading') return `Uses the source content to explain one real case from "${goal}".`
  return `Makes a clear continue, strengthen, or replan decision for "${goal}".`
}

function stepsFor(kind: Task['kind'], title: string) {
  if (kind === 'reading') {
    return [
      '先浏览标题、目录和例题，写下 2 个想解决的问题。',
      '精读核心段落，把定义、例子、反例分成三行记录。',
      '合上资料复述一遍，再回看遗漏处。',
    ]
  }

  if (kind === 'practice') {
    return [
      '先写下输入、约束和完成标准。',
      '独立完成练习，卡住 10 分钟后只看最小提示。',
      '完成后记录错因、修正方式和可复用套路。',
    ]
  }

  if (kind === 'reflection') {
    return [
      '列出今天最有价值的 3 个点。',
      '为每个点写一个例子和一个反例。',
      '把最不确定的问题放进下一次学习开头。',
    ]
  }

  return [
    `对照「${title}」检查学习产出。`,
    '列出已掌握、未掌握、需要强化的部分。',
    '决定是否进入测评或重规划。',
  ]
}

function exercisesFor(kind: Task['kind'], title: string) {
  if (kind === 'reading') return [`用自己的话解释「${title}」中的 3 个概念。`]
  if (kind === 'practice') return [`做一题同主题变式题，并说明为什么这样解。`]
  if (kind === 'reflection') return ['写一段 150 字复盘，并标出下一步行动。']
  return ['用清单判断当前计划是否需要调整。']
}

function exampleBullets(kind: Task['kind']) {
  if (kind === 'practice') return ['先做最小版本', '再做一个变式', '最后记录错因']
  if (kind === 'reading') return ['找一个定义', '配一个例子', '写一个反例']
  return ['列出现状', '判断差距', '写下下一步']
}

function buildRecommendedReferences(id: string, goal: string, kind: Task['kind']): RecommendedReference[] {
  return [
    {
      id: `${id}-official-reference`,
      type: 'official',
      title: `${goal} 官方文档或课程主页`,
      reason: '官方资料适合作为权威定义、课程要求和术语来源。',
      difficulty: 'beginner',
    },
    {
      id: `${id}-deep-reference`,
      type: kind === 'practice' ? 'course' : 'book',
      title: `${goal} 入门教材或经典教程`,
      reason: '用于补充 App 内学习内容，帮助建立系统背景和更多例题。',
      difficulty: 'intermediate',
    },
    {
      id: `${id}-video-reference`,
      type: 'video',
      title: `${goal} 可视化讲解或实操演示`,
      reason: '当文字说明不够直观时，用短视频先建立画面，再回到 Miniverto 完成练习。',
      difficulty: 'beginner',
    },
  ]
}

function guidanceDescription(
  kind: Task['kind'],
  title: string,
  goal: string,
  methodNames: string,
  materialHint: string,
) {
  if (kind === 'reading') {
    return `Miniverto 建议：围绕「${goal}」完成「${title}」。先快速浏览目录和小标题，再带着 2-3 个问题精读；阅读时整理术语、例子、反例和仍不理解的点。${materialHint} 本任务建议结合 ${methodNames}，结束前要合上资料复述一遍。`
  }

  if (kind === 'practice') {
    return `Miniverto 建议：把「${title}」当成一次可验收练习。先写下输入、约束和成功标准，再独立完成；卡住超过 10 分钟时只查看最小提示，完成后记录错因和可复用套路。${materialHint} 本任务重点使用 ${methodNames}。`
  }

  if (kind === 'reflection') {
    return `Miniverto 建议：完成「${title}」时不要总结流水账。请用自己的话解释今天学到的关键概念，写出一个例子、一个反例、一个仍不确定的问题，并标记下一次复习要先检查的内容。`
  }

  return `Miniverto 建议：把「${title}」作为阶段收束任务。先对照学习目标「${goal}」检查产出，再列出已掌握、未掌握和需要 Miniverto 重新规划的部分。`
}

function acceptanceCriteria(kind: Task['kind'], title: string, goal: string) {
  if (kind === 'reading') {
    return `完成后应能不看资料说清「${title}」的 3 个关键点，并说明它们如何服务于「${goal}」。`
  }

  if (kind === 'practice') {
    return '完成一个可检查产出；至少记录 2 个错误或卡点，并写出下次遇到同类问题的处理步骤。'
  }

  if (kind === 'reflection') {
    return '写出不少于 5 行复盘：已掌握内容、薄弱内容、一个反例、一个下一步问题和一个可执行改进行动。'
  }

  return '形成一份简短结论：是否继续、加强哪一部分、下一轮学习计划需要如何调整。'
}
