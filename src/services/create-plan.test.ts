import { describe, expect, test } from 'vitest'
import { createProjectFromPlanInput, createProjectFromPlanResponse } from './create-plan'
import { LEARNING_METHODS } from '@/data/learning-methods'
import { MODEL_OPTIONS } from '@/data/model-options'
import { buildPlanInput } from '@/data/plan-input'

describe('createProjectFromPlanInput', () => {
  test('creates a persisted project shape from structured plan input', () => {
    const input = buildPlanInput({
      goalType: 'project',
      goalText: 'Learn Rust by building a CLI',
      level: 'beginner',
      intensity: 'steady',
      timeBudget: '5-7h',
      deadline: '6 weeks',
      preferences: ['hands_on', 'quizzes'],
      extraNotes: '',
      methods: LEARNING_METHODS.slice(0, 3),
      model: MODEL_OPTIONS[0]!,
      materials: [],
    })

    const project = createProjectFromPlanInput(input, {
      id: 'project-1',
      nowLabel: 'today',
    })

    expect(project).toMatchObject({
      id: 'project-1',
      title: 'Learn Rust by building a CLI',
      status: 'active',
      totalTasks: 9,
      completedTasks: 0,
    })
    expect(project.milestoneList).toHaveLength(3)
    expect(project.milestoneList[0]?.tasks[0]).toMatchObject({
      kind: 'reading',
      status: 'pending',
    })
  })

  test('adds rich in-app lesson guidance to every fallback task', () => {
    const input = buildPlanInput({
      goalType: 'project',
      goalText: 'Learn Rust by building a CLI',
      level: 'beginner',
      intensity: 'steady',
      timeBudget: '5-7h',
      deadline: '6 weeks',
      preferences: ['hands_on', 'quizzes'],
      extraNotes: 'I need practical steps.',
      methods: LEARNING_METHODS.slice(0, 3),
      model: MODEL_OPTIONS[0]!,
      materials: [],
    })

    const project = createProjectFromPlanInput(input, {
      id: 'project-guided',
      nowLabel: 'today',
    })
    const tasks = project.milestoneList.flatMap((milestone) => milestone.tasks)

    expect(tasks.every((task) => task.description && task.description.includes('Miniverto'))).toBe(true)
    expect(tasks.every((task) => task.acceptanceCriteria && task.acceptanceCriteria.length > 20)).toBe(true)
    expect(tasks.every((task) => task.resources && task.resources.length > 0)).toBe(true)
    expect(tasks.every((task) => task.learningContent?.overview.includes('Miniverto'))).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.keyPoints.length ?? 0) >= 3)).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.exercises.length ?? 0) >= 1)).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.lessonBlocks?.length ?? 0) >= 5)).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.mediaSuggestions?.length ?? 0) >= 2)).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.learningObjectives?.length ?? 0) >= 2)).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.conceptMap?.length ?? 0) >= 3)).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.workedExample?.steps.length ?? 0) >= 3)).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.practiceSet?.length ?? 0) >= 3)).toBe(true)
    expect(tasks.every((task) => task.learningContent?.practiceSet?.some((practice) => practice.level === 'challenge'))).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.commonMistakes?.length ?? 0) >= 2)).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.completionRubric?.length ?? 0) >= 3)).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.quickCheck?.length ?? 0) >= 3)).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.teachingScript?.length ?? 0) >= 2)).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.answerKey?.length ?? 0) >= 2)).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.reviewCards?.length ?? 0) >= 2)).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.nextStepHint?.length ?? 0) > 20)).toBe(true)
    expect(tasks.every((task) => (task.recommendedReferences?.length ?? 0) >= 2)).toBe(true)
    expect(tasks.flatMap((task) => task.recommendedReferences ?? []).some((ref) => ref.reason.includes('官方'))).toBe(true)
  })

  test('adds readiness checks, glossary, and deliverables to fallback lessons', () => {
    const input = buildPlanInput({
      goalType: 'project',
      goalText: 'Learn Python data analysis',
      level: 'beginner',
      intensity: 'steady',
      timeBudget: '5-7h',
      deadline: '8 weeks',
      preferences: ['hands_on', 'quizzes'],
      extraNotes: 'I need concrete lesson content.',
      methods: LEARNING_METHODS.slice(0, 3),
      model: MODEL_OPTIONS[0]!,
      materials: [],
    })

    const project = createProjectFromPlanInput(input, {
      id: 'project-lesson-contract',
      nowLabel: 'today',
    })
    const tasks = project.milestoneList.flatMap((milestone) => milestone.tasks)

    expect(tasks.every((task) => (task.learningContent?.prerequisites?.length ?? 0) >= 2)).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.glossary?.length ?? 0) >= 3)).toBe(true)
    expect(tasks.every((task) => task.learningContent?.glossary?.every((item) => (
      item.term.length > 0 && item.meaning.length > 10 && item.example.length > 10
    )))).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.deliverable?.title.length ?? 0) > 0)).toBe(true)
    expect(tasks.every((task) => (task.learningContent?.deliverable?.acceptanceCheck.length ?? 0) > 20)).toBe(true)
  })

  test('makes career fallback deliverables portfolio and interview oriented', () => {
    const input = buildPlanInput({
      goalType: 'career',
      goalText: 'Become a frontend engineer for SaaS products',
      level: 'intermediate',
      intensity: 'focused',
      timeBudget: '8-12h',
      deadline: '10 weeks',
      preferences: ['hands_on', 'problem_sets'],
      extraNotes: '',
      learnerProfile: {
        purposeDetails: 'career transition and job search',
        currentSituation: 'knows HTML and CSS, React is weak',
        blockers: 'short on time and lacks feedback',
        successDefinition: 'build a portfolio and pass interviews',
        targetScenario: 'apply for junior frontend roles in 3 months',
        schedulePattern: 'weekday evenings 45 minutes, weekend 3 hours',
        feedbackPreference: 'weekly reviewable output',
        contentDepth: 'directly learnable lesson content',
      },
      methods: LEARNING_METHODS.slice(0, 3),
      model: MODEL_OPTIONS[0]!,
      materials: [],
    })

    const project = createProjectFromPlanInput(input, { id: 'project-career-contract', nowLabel: 'today' })
    const firstDeliverable = project.milestoneList[0]?.tasks[0]?.learningContent?.deliverable
    const deliverableText = `${firstDeliverable?.title ?? ''} ${firstDeliverable?.format ?? ''} ${firstDeliverable?.acceptanceCheck ?? ''}`.toLowerCase()
    const careerAnswerText = project.milestoneList
      .flatMap((milestone) => milestone.tasks)
      .flatMap((task) => task.learningContent?.answerKey ?? [])
      .map((item) => `${item.expectedAnswer} ${item.checkMethod}`.toLowerCase())
      .join('\n')

    expect(deliverableText).toContain('portfolio')
    expect(deliverableText).toContain('interview')
    expect(careerAnswerText).toContain('portfolio')
    expect(careerAnswerText).toContain('interview')
  })

  test('makes exam fallback deliverables timed and mistake-driven', () => {
    const input = buildPlanInput({
      goalType: 'exam',
      goalText: 'Prepare for PMP certification',
      level: 'intermediate',
      intensity: 'sprint',
      timeBudget: '8-12h',
      deadline: '45 days',
      preferences: ['quizzes', 'problem_sets'],
      extraNotes: '',
      learnerProfile: {
        purposeDetails: 'exam and certificate',
        currentSituation: 'studied part of the material but mock scores are unstable',
        blockers: 'too many materials and weak feedback',
        successDefinition: 'score above 80 percent on mock exams',
        targetScenario: 'exam sprint',
        schedulePattern: '20-30 minutes every day',
        feedbackPreference: 'wrong-answer review',
        contentDepth: 'more examples and practice',
      },
      methods: LEARNING_METHODS.slice(0, 3),
      model: MODEL_OPTIONS[0]!,
      materials: [],
    })

    const project = createProjectFromPlanInput(input, { id: 'project-exam-contract', nowLabel: 'today' })
    const deliverableTexts = project.milestoneList
      .flatMap((milestone) => milestone.tasks)
      .map((task) => `${task.learningContent?.deliverable?.title ?? ''} ${task.learningContent?.deliverable?.acceptanceCheck ?? ''}`.toLowerCase())
      .join('\n')
    const examReviewText = project.milestoneList
      .flatMap((milestone) => milestone.tasks)
      .map((task) => [
        ...(task.learningContent?.answerKey ?? []).map((item) => `${item.expectedAnswer} ${item.checkMethod}`),
        ...(task.learningContent?.reviewCards ?? []).map((card) => `${card.front} ${card.back} ${card.tag}`),
      ].join(' '))
      .join('\n')
      .toLowerCase()

    expect(deliverableTexts).toContain('timed')
    expect(deliverableTexts).toContain('wrong')
    expect(deliverableTexts).toContain('mock')
    expect(examReviewText).toContain('timed')
    expect(examReviewText).toContain('wrong')
    expect(examReviewText).toContain('review')
  })

  test('uses selected materials as cited evidence inside fallback lessons', () => {
    const input = buildPlanInput({
      goalType: 'project',
      goalText: 'Learn Rust by building a CLI',
      level: 'beginner',
      intensity: 'steady',
      timeBudget: '5-7h',
      deadline: '6 weeks',
      preferences: ['hands_on', 'quizzes'],
      extraNotes: '',
      methods: LEARNING_METHODS.slice(0, 3),
      model: MODEL_OPTIONS[0]!,
      materials: [
        {
          id: 'material-ownership-notes',
          name: 'Ownership workshop notes.md',
          kind: 'text',
          sizeBytes: 1024,
          status: 'ready',
          selected: true,
          source: 'pasted',
          note: 'The learner confuses moves with copies and needs diagrams.',
        },
      ],
    })

    const project = createProjectFromPlanInput(input, {
      id: 'project-with-materials',
      nowLabel: 'today',
    })
    const firstTask = project.milestoneList[0]?.tasks[0]
    const citationId = firstTask?.learningContent?.materialCitations?.[0]?.id

    expect(firstTask?.learningContent?.materialCitations).toEqual([
      expect.objectContaining({
        materialId: 'material-ownership-notes',
        materialName: 'Ownership workshop notes.md',
        summary: 'The learner confuses moves with copies and needs diagrams.',
      }),
    ])
    expect(firstTask?.learningContent?.lessonBlocks?.some((block) => (
      citationId ? block.citationIds?.includes(citationId) : false
    ))).toBe(true)
  })

  test('uses diagnostic result to shape the fallback plan summary and first task', () => {
    const input = buildPlanInput({
      goalType: 'project',
      goalText: 'Learn SQL performance tuning',
      level: 'intermediate',
      intensity: 'steady',
      timeBudget: '5-7h',
      deadline: '',
      preferences: ['hands_on'],
      extraNotes: '',
      diagnostic: {
        scorePct: 75,
        levelSignal: 'ready',
        strengths: ['concept', 'application'],
        gaps: ['troubleshooting'],
        evidence: 'Can write queries but indexing is slow.',
      },
      methods: LEARNING_METHODS.slice(0, 2),
      model: MODEL_OPTIONS[0]!,
      materials: [],
    })

    const project = createProjectFromPlanInput(input, { id: 'project-diagnostic', nowLabel: 'today' })

    expect(project.goalSummary).toContain('75%')
    expect(project.milestoneList[0]?.tasks[0]?.description).toContain('troubleshooting')
  })

  test('uses detailed learner profile to personalize fallback lessons', () => {
    const input = buildPlanInput({
      goalType: 'career',
      goalText: 'Become a frontend engineer for SaaS products',
      level: 'intermediate',
      intensity: 'focused',
      timeBudget: '8-12h',
      deadline: '10 weeks',
      preferences: ['hands_on', 'problem_sets'],
      extraNotes: 'I prefer practical projects over lectures.',
      learnerProfile: {
        ageRange: '25-34',
        role: '在职转行准备：目前做运营',
        purposeDetails: '转行求职：需要作品集和面试准备',
        currentSituation: '学过一部分：会 HTML/CSS，React 不熟',
        priorBackground: '做过练习：跟过一个入门课',
        studyHabits: '项目驱动、短时多次',
        devices: 'Windows、通勤碎片时间',
        learningEnvironment: '家中安静学习、通勤路上',
        blockers: '时间少、容易拖延、缺少反馈',
        successDefinition: '完成作品集/项目：能独立讲解并用于求职',
        targetScenario: '3 个月内投递初级前端岗位',
        schedulePattern: '工作日晚间 45 分钟，周末 3 小时',
        sessionLength: '25 minutes per session',
        deviceContext: 'Windows laptop and phone during commute',
        learningPreferenceDetail: '先看例子，再做项目练习',
        supportPreference: '每一步都需要检查点和提示',
        baselineConfidence: 'can read examples but cannot build alone',
        feedbackPreference: '希望每周有一次可检查产出',
        contentDepth: '需要直接可学的课程内容，不要只给清单',
      },
      diagnostic: {
        scorePct: 62,
        levelSignal: 'developing',
        strengths: ['concept'],
        gaps: ['application', 'output'],
        evidence: 'Can copy examples but struggles to build from scratch.',
      },
      methods: LEARNING_METHODS.slice(0, 3),
      model: MODEL_OPTIONS[0]!,
      materials: [],
    })

    const project = createProjectFromPlanInput(input, { id: 'project-personalized', nowLabel: 'today' })
    const firstTask = project.milestoneList[0]?.tasks[0]
    const allLessonText = project.milestoneList
      .flatMap((milestone) => milestone.tasks)
      .map((task) => [
        task.description,
        task.learningContent?.overview,
        task.learningContent?.personalizationNotes,
        task.learningContent?.reviewPrompt,
        task.learningContent?.lessonBlocks?.map((block) => `${block.title} ${block.body} ${(block.bullets ?? []).join(' ')}`).join(' '),
        task.learningContent?.practiceSet?.map((practice) => `${practice.prompt} ${practice.expectedOutcome}`).join(' '),
        task.learningContent?.mediaSuggestions?.map((media) => `${media.title} ${media.purpose} ${media.promptOrQuery}`).join(' '),
        task.learningContent?.completionRubric?.map((item) => item.target).join(' '),
      ].filter(Boolean).join(' '))
      .join('\n')

    expect(project.goalSummary).toContain('转行求职')
    expect(project.goalSummary).toContain('时间少')
    expect(firstTask?.description).toContain('作品集')
    expect(allLessonText).toContain('工作日晚间 45 分钟，周末 3 小时')
    expect(allLessonText).toContain('缺少反馈')
    expect(allLessonText).toContain('作品集')
    expect(firstTask?.learningContent?.personalizationNotes).toContain('转行求职')
    expect(allLessonText).toContain('每周有一次可检查产出')
    expect(allLessonText).toContain('面试')
    expect(allLessonText).toContain('作品集检查')
    expect(allLessonText).toContain('25 minutes per session')
    expect(allLessonText).toContain('Windows laptop and phone during commute')
    expect(allLessonText).toContain('can read examples but cannot build alone')
  })

  test('changes fallback course content for exam-oriented learners', () => {
    const input = buildPlanInput({
      goalType: 'exam',
      goalText: 'Prepare for PMP certification',
      level: 'intermediate',
      intensity: 'sprint',
      timeBudget: '8-12h',
      deadline: '45 days',
      preferences: ['quizzes', 'problem_sets'],
      extraNotes: '',
      learnerProfile: {
        purposeDetails: '考试/证书：PMP 认证',
        currentSituation: '学过一部分：看过 PMBOK 但题目正确率不稳定',
        blockers: '资料太多、缺少反馈',
        successDefinition: '通过考试：模拟题稳定 80% 以上',
        targetScenario: '考试冲刺',
        schedulePattern: '每天 20-30 分钟',
        feedbackPreference: '错题/卡点复盘',
        contentDepth: '多例题和练习',
      },
      methods: LEARNING_METHODS.slice(0, 3),
      model: MODEL_OPTIONS[0]!,
      materials: [],
    })

    const project = createProjectFromPlanInput(input, { id: 'project-exam', nowLabel: 'today' })
    const allLessonText = project.milestoneList
      .flatMap((milestone) => milestone.tasks)
      .map((task) => [
        task.learningContent?.personalizationNotes,
        task.learningContent?.lessonBlocks?.map((block) => `${block.title} ${block.body} ${(block.bullets ?? []).join(' ')}`).join(' '),
        task.learningContent?.practiceSet?.map((practice) => `${practice.prompt} ${practice.expectedOutcome}`).join(' '),
        task.learningContent?.quickCheck?.join(' '),
      ].filter(Boolean).join(' '))
      .join('\n')

    expect(allLessonText).toContain('考试冲刺')
    expect(allLessonText).toContain('模拟题')
    expect(allLessonText).toContain('错题')
    expect(allLessonText).toContain('每天 20-30 分钟')
  })

  test('creates a project from parsed model response', () => {
    const project = createProjectFromPlanResponse({
      title: 'Rust CLI Plan',
      emoji: 'R',
      goalSummary: 'Build a CLI',
      criticScore: 9,
      milestones: [
        {
          title: 'Basics',
          successCriteria: 'Explain ownership',
          tasks: [
            {
              kind: 'reading',
              title: 'Read ownership chapter',
              estimatedMinutes: 60,
              status: 'pending',
            },
          ],
        },
      ],
    }, { id: 'from-response', nowLabel: 'today' })

    expect(project).toMatchObject({
      id: 'from-response',
      title: 'Rust CLI Plan',
      emoji: 'R',
      totalTasks: 1,
      criticScore: 9,
    })
  })
})
