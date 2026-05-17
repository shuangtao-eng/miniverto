import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StepDots } from './StepDots'
import { StreamingCursor } from './StreamingCursor'
import { useStreaming } from '@/hooks/useStreaming'
import { cn } from '@/lib/utils'
import {
  createMaterialFromFile,
  formatBytes,
  type LearningMaterial,
} from '@/data/materials'
import {
  recommendLearningMethods,
  type LearningIntensity,
  type LearningLevel,
  type LearningOutcome,
  type LearningPreference,
} from '@/data/learning-methods'
import { getBestPlanningModel, getFreeFriendlyModels } from '@/data/model-options'
import {
  getTauriInvoke,
  ingestPastedTextMaterial,
  ingestTextFileMaterial,
} from '@/services/material-ingest'
import { useMaterialStore } from '@/stores/material-store'
import { buildPlanInput } from '@/data/plan-input'
import { createProjectFromPlanInput } from '@/services/create-plan'
import { upsertPersistedProject } from '@/services/project-library'
import { useProjectStore } from '@/stores/project-store'
import { buildPlanPromptPayload } from '@/services/plan-prompt'
import { generatePlanWithModel } from '@/services/llm-client'
import { resolveDefaultRuntimeProvider } from '@/services/provider-runtime'
import {
  scoreDiagnosticAnswers,
  type DiagnosticAnswerMap,
  type DiagnosticDimension,
} from '@/services/diagnostic-assessment'

const GOAL_OPTIONS: Array<{ id: LearningOutcome; key: string }> = [
  { id: 'project', key: 'create.goal.project' },
  { id: 'exam', key: 'create.goal.exam' },
  { id: 'concept', key: 'create.goal.concept' },
  { id: 'career', key: 'create.goal.career' },
  { id: 'research', key: 'create.goal.research' },
]

const LEVEL_OPTIONS: Array<{ id: LearningLevel; key: string }> = [
  { id: 'beginner', key: 'create.level.beginner' },
  { id: 'intermediate', key: 'create.level.intermediate' },
  { id: 'advanced', key: 'create.level.advanced' },
]

const INTENSITY_OPTIONS: Array<{ id: LearningIntensity; key: string }> = [
  { id: 'light', key: 'create.intensity.light' },
  { id: 'steady', key: 'create.intensity.steady' },
  { id: 'focused', key: 'create.intensity.focused' },
  { id: 'sprint', key: 'create.intensity.sprint' },
]

const PREFERENCE_OPTIONS: Array<{ id: LearningPreference; key: string }> = [
  { id: 'problem_sets', key: 'create.preference.problemSets' },
  { id: 'quizzes', key: 'create.preference.quizzes' },
  { id: 'hands_on', key: 'create.preference.handsOn' },
  { id: 'reading', key: 'create.preference.reading' },
  { id: 'video', key: 'create.preference.video' },
  { id: 'discussion', key: 'create.preference.discussion' },
]

const SUGGESTION_CHIPS = [
  'create.chips.rust',
  'create.chips.pmp',
  'create.chips.ml',
  'create.chips.transformer',
]

const ROLE_OPTIONS = ['学生', '在职提升', '转行准备', '创业/自由职业', '兴趣学习', '其他']
const PURPOSE_OPTIONS = ['考试/证书', '工作项目', '转行求职', '研究论文', '兴趣探索', '补课提分']
const CURRENT_STAGE_OPTIONS = ['完全不了解', '知道概念但不会用', '学过一部分', '做过小项目', '需要系统进阶']
const BACKGROUND_OPTIONS = ['无相关背景', '看过课程/书', '做过练习', '做过项目', '有工作经验']
const DEVICE_OPTIONS = ['Windows', 'macOS', 'iOS', 'Android', '平板', '通勤碎片时间']
const HABIT_OPTIONS = ['视频优先', '阅读优先', '练题驱动', '项目驱动', '短时多次', '长时间深度学习']
const ENVIRONMENT_OPTIONS = ['家中安静学习', '学校/图书馆', '公司/办公室', '通勤路上', '时间不固定']
const BLOCKER_OPTIONS = ['时间少', '基础薄弱', '容易拖延', '资料太多', '英文资料压力', '缺少反馈']
const SUCCESS_OPTIONS = ['通过考试', '完成作品/项目', '能独立讲解', '能用于工作', '形成长期学习习惯']
const TARGET_SCENARIO_OPTIONS = ['考试冲刺', '作品集/项目交付', '求职面试', '工作中立即使用', '论文/研究输出', '长期兴趣探索']
const SCHEDULE_PATTERN_OPTIONS = ['每天 20-30 分钟', '工作日晚间 45 分钟', '周末集中学习', '通勤碎片时间', '时间不固定，需要弹性安排']
const SESSION_LENGTH_OPTIONS = ['15 分钟以内', '25 分钟左右', '45 分钟左右', '60 分钟以上']
const DEVICE_CONTEXT_OPTIONS = ['电脑为主', '手机碎片时间', '平板/手写笔', '多设备切换']
const LEARNING_PREFERENCE_DETAIL_OPTIONS = ['先看视频再练习', '先读材料再总结', '项目驱动', '刷题驱动', '笔记沉淀']
const SUPPORT_PREFERENCE_OPTIONS = ['先给例子', '多给提示', '直接挑战', '每步要检查点']
const BASELINE_CONFIDENCE_OPTIONS = ['完全没底', '看得懂但做不出', '能模仿完成', '能独立完成一部分']
const FEEDBACK_OPTIONS = ['每节课小测', '每周产出检查', '错题/卡点复盘', '项目成果验收', '少反馈，保持自主']
const CONTENT_DEPTH_OPTIONS = ['先给最短路径', '需要直接可学的课程内容', '多例题和练习', '图文/视频辅助更多', '挑战题和迁移任务更多']

const DIAGNOSTIC_OPTIONS: Array<{ id: DiagnosticDimension; label: string; prompt: string }> = [
  { id: 'concept', label: '概念理解', prompt: '不看资料解释核心概念' },
  { id: 'application', label: '应用能力', prompt: '把知识用到真实题目或项目' },
  { id: 'troubleshooting', label: '排错能力', prompt: '卡住时定位问题并修正' },
  { id: 'output', label: '成果经验', prompt: '做过可展示的练习、考试或项目' },
]

const DIAGNOSTIC_LEVELS = [
  { id: 'none', label: '没有' },
  { id: 'weak', label: '需要帮助' },
  { id: 'assisted', label: '能部分完成' },
  { id: 'solid', label: '能独立完成' },
] as const

interface CreateProjectDialogProps {
  onClose: () => void
  onCreated?: () => void
}

export function CreateProjectDialog({ onClose, onCreated }: CreateProjectDialogProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [goalType, setGoalType] = useState<LearningOutcome>('project')
  const [goalText, setGoalText] = useState('')
  const [level, setLevel] = useState<LearningLevel>('beginner')
  const [intensity, setIntensity] = useState<LearningIntensity>('steady')
  const [timeBudget, setTimeBudget] = useState('5-7h')
  const [deadline, setDeadline] = useState('')
  const [preferences, setPreferences] = useState<LearningPreference[]>(['hands_on', 'quizzes'])
  const [extraNotes, setExtraNotes] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [roleChoice, setRoleChoice] = useState('')
  const [roleDetail, setRoleDetail] = useState('')
  const [purposeChoice, setPurposeChoice] = useState('')
  const [purposeDetails, setPurposeDetails] = useState('')
  const [currentStage, setCurrentStage] = useState('')
  const [currentSituation, setCurrentSituation] = useState('')
  const [backgroundChoice, setBackgroundChoice] = useState('')
  const [priorBackground, setPriorBackground] = useState('')
  const [studyHabitChoices, setStudyHabitChoices] = useState<string[]>(['项目驱动'])
  const [deviceChoices, setDeviceChoices] = useState<string[]>(['Windows'])
  const [environmentChoices, setEnvironmentChoices] = useState<string[]>([])
  const [blockerChoices, setBlockerChoices] = useState<string[]>([])
  const [successChoice, setSuccessChoice] = useState('')
  const [successDefinition, setSuccessDefinition] = useState('')
  const [targetScenario, setTargetScenario] = useState('')
  const [schedulePattern, setSchedulePattern] = useState('')
  const [sessionLength, setSessionLength] = useState('')
  const [deviceContext, setDeviceContext] = useState('')
  const [learningPreferenceDetail, setLearningPreferenceDetail] = useState('')
  const [supportPreference, setSupportPreference] = useState('')
  const [baselineConfidence, setBaselineConfidence] = useState('')
  const [feedbackPreference, setFeedbackPreference] = useState('')
  const [contentDepth, setContentDepth] = useState('')
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<DiagnosticAnswerMap>({})
  const [diagnosticEvidence, setDiagnosticEvidence] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [materials, setMaterials] = useState<LearningMaterial[]>([])
  const [loadingPct, setLoadingPct] = useState(0)
  const addLibraryMaterials = useMaterialStore((s) => s.addMaterials)
  const addProject = useProjectStore((s) => s.addProject)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const methodBundle = useMemo(
    () => recommendLearningMethods({
      outcome: goalType,
      level,
      intensity,
      preferences,
      hasMaterials: materials.some((m) => m.selected),
    }),
    [goalType, intensity, level, materials, preferences],
  )
  const bestModel = getBestPlanningModel()
  const freeModels = getFreeFriendlyModels()
  const needsDeepProfile = useMemo(() => (
    level !== 'beginner'
    || ['考试/证书', '工作项目', '转行求职', '研究论文'].includes(purposeChoice)
    || ['学过一部分', '做过小项目', '需要系统进阶'].includes(currentStage)
  ), [currentStage, level, purposeChoice])
  const diagnosticResult = useMemo(
    () => needsDeepProfile ? scoreDiagnosticAnswers(diagnosticAnswers, diagnosticEvidence) : null,
    [diagnosticAnswers, diagnosticEvidence, needsDeepProfile],
  )

  const planStream = useMemo(() => {
    const methods = methodBundle.map((method) => method.title).join('、')
    const profileLine = [
      ageRange && `年龄段：${ageRange}`,
      roleChoice && `身份：${withDetail(roleChoice, roleDetail)}`,
      purposeChoice && `学习目的：${withDetail(purposeChoice, purposeDetails)}`,
      currentStage && `当前阶段：${withDetail(currentStage, currentSituation)}`,
      backgroundChoice && `相关背景：${withDetail(backgroundChoice, priorBackground)}`,
      studyHabitChoices.length > 0 && `学习习惯：${studyHabitChoices.join('、')}`,
      deviceChoices.length > 0 && `设备：${deviceChoices.join('、')}`,
      environmentChoices.length > 0 && `学习环境：${environmentChoices.join('、')}`,
      blockerChoices.length > 0 && `主要阻碍：${blockerChoices.join('、')}`,
      successChoice && `成功标准：${withDetail(successChoice, successDefinition)}`,
      targetScenario && `目标场景：${targetScenario}`,
      schedulePattern && `时间节奏：${schedulePattern}`,
      sessionLength && `单次时长：${sessionLength}`,
      deviceContext && `学习场景：${deviceContext}`,
      learningPreferenceDetail && `学习偏好细节：${learningPreferenceDetail}`,
      supportPreference && `支持方式：${supportPreference}`,
      baselineConfidence && `基础信心：${baselineConfidence}`,
      feedbackPreference && `反馈偏好：${feedbackPreference}`,
      contentDepth && `内容深度：${contentDepth}`,
    ].filter(Boolean).join('；') || '用户资料：待补充'
    const materialLine = materials.some((m) => m.selected)
      ? `资料依据：优先参考 ${materials.filter((m) => m.selected).map((m) => m.name).join('、')}`
      : '资料依据：暂未上传资料，先按目标与背景制定计划'

    return `目标：${goalText || t('create.preview.defaultGoal')}

Miniverto 方法组合：${methods}
推荐模型：${bestModel.label}：${bestModel.bestFor}
${materialLine}
${profileLine}

里程碑 1：建立知识地图与起点评估
  - 阅读核心资料并整理术语表
  - 完成主动回忆题，定位薄弱点
  - 安排第 3 天和第 7 天的间隔复习

里程碑 2：精讲学习与交错训练
  - 每个任务包含导入、概念、示例、练习和自测
  - 混合不同题型，避免只会套模板
  - 每周复盘最难的 3 个概念和修正策略

里程碑 3：产出与验证
  - 完成一个可展示成果或模拟考试
  - 用闭卷讲解检查是否能独立表达
  - Miniverto 根据评估结果生成下一轮强化建议`
  }, [
    ageRange,
    baselineConfidence,
    bestModel,
    blockerChoices,
    currentSituation,
    currentStage,
    deviceContext,
    deviceChoices,
    environmentChoices,
    feedbackPreference,
    goalText,
    learningPreferenceDetail,
    materials,
    methodBundle,
    priorBackground,
    purposeChoice,
    purposeDetails,
    roleChoice,
    roleDetail,
    sessionLength,
    studyHabitChoices,
    successChoice,
    successDefinition,
    supportPreference,
    targetScenario,
    schedulePattern,
    t,
    contentDepth,
  ])

  const { displayed: streamedPlan, done: planDone } = useStreaming(planStream, step === 4)

  useEffect(() => {
    if (step === 4 && planDone) {
      setTimeout(() => setStep(5), 600)
    }
  }, [step, planDone])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  function simulateLoading(duration: number) {
    setLoadingPct(0)
    let pct = 0
    const interval = 80
    const increment = 100 / (duration / interval)
    timerRef.current = setInterval(() => {
      pct += increment * (0.6 + Math.random())
      if (pct >= 100) {
        pct = 100
        if (timerRef.current) clearInterval(timerRef.current)
        setLoadingPct(100)
      } else {
        setLoadingPct(pct)
      }
    }, interval)
  }

  function togglePreference(id: LearningPreference) {
    setPreferences((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function toggleStringChoice(value: string, setter: (next: string[]) => void, current: string[]) {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value])
  }

  function setDiagnosticAnswer(dimension: DiagnosticDimension, value: DiagnosticAnswerMap[DiagnosticDimension]) {
    setDiagnosticAnswers((current) => ({ ...current, [dimension]: value }))
  }

  async function addPastedMaterial() {
    if (!pastedText.trim()) return
    const invoke = await getTauriInvoke()
    const material = await ingestPastedTextMaterial({ text: pastedText, invoke })
    setMaterials((current) => [...current, material])
    addLibraryMaterials([material])
    setPastedText('')
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return
    const invoke = await getTauriInvoke()
    const fileMaterials = await Promise.all(
      Array.from(files).map((file) => {
        if (file.name.match(/\.(txt|md|markdown)$/i)) {
          return ingestTextFileMaterial({ file, invoke })
        }
        return Promise.resolve(createMaterialFromFile(file))
      }),
    )
    setMaterials((current) => [...current, ...fileMaterials])
    addLibraryMaterials(fileMaterials)
  }

  function toggleMaterial(id: string) {
    setMaterials((current) =>
      current.map((material) =>
        material.id === id ? { ...material, selected: !material.selected } : material,
      ),
    )
  }

  function handleNext() {
    if (step === 3) {
      setStep(4)
      simulateLoading(3000)
      return
    }
    setStep((current) => Math.min(current + 1, 5))
  }

  async function handleCreateProject() {
    const input = buildPlanInput({
      goalType,
      goalText,
      level,
      intensity,
      timeBudget,
      deadline,
      preferences,
      extraNotes,
      learnerProfile: {
        ageRange,
        role: withDetail(roleChoice, roleDetail),
        purposeDetails: withDetail(purposeChoice, purposeDetails),
        currentSituation: withDetail(currentStage, currentSituation),
        priorBackground: withDetail(backgroundChoice, priorBackground),
        studyHabits: studyHabitChoices.join('、'),
        devices: deviceChoices.join('、'),
        learningEnvironment: environmentChoices.join('、'),
        blockers: blockerChoices.join('、'),
        successDefinition: withDetail(successChoice, successDefinition),
        targetScenario,
        schedulePattern,
        sessionLength,
        deviceContext,
        learningPreferenceDetail,
        supportPreference,
        baselineConfidence,
        feedbackPreference,
        contentDepth,
      },
      diagnostic: diagnosticResult,
      methods: methodBundle,
      model: bestModel,
      materials,
    })
    const promptPayload = buildPlanPromptPayload(input)
    const invoke = await getTauriInvoke()
    const runtimeProvider = await resolveDefaultRuntimeProvider(invoke)
    const canCallFromFrontend = runtimeProvider && runtimeProvider.apiKey === ''
    const project = canCallFromFrontend
      ? (await generatePlanWithModel({ config: runtimeProvider, promptPayload })).plan
      : createProjectFromPlanInput(input)
    addProject(project)
    await upsertPersistedProject(project, invoke)
    onCreated?.()
  }

  const canContinue = step !== 0 || goalText.trim().length > 0
  const stepTitles = ['学习目标', '用户情况细化', '方法与资料', '确认生成', '生成中', '计划已生成']
  const stepSubtitles = [
    '先明确要学什么，Miniverto 会用结构化信息生成计划。',
    '尽量用选择题收集信息，必要时再补充文字。',
    '选择学习偏好，并上传可作为依据的学习资料。',
    '确认学习方法、模型和补充要求。',
    'Miniverto 正在整理学习路径和 App 内课程内容。',
    '计划已经准备好，可以开始学习。',
  ]

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] bg-[var(--overlay)] flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-[760px] bg-surface rounded-xl shadow-lg overflow-hidden flex flex-col max-h-[calc(100vh-48px)] animate-slide-up">
        <div className="px-[26px] pt-[22px] pb-[18px] border-b border-border-2 flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-bold text-foreground font-display">{stepTitles[step]}</h2>
            <p className="text-xs text-fg-3 mt-[3px]">{stepSubtitles[step]}</p>
          </div>
          <div className="flex items-center gap-3.5">
            <StepDots total={5} current={step > 4 ? 4 : step} />
            <button onClick={onClose} className="text-fg-3 p-1.5 rounded-lg hover:text-foreground" aria-label={t('common.close')}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === 0 && (
            <div className="p-[26px] flex flex-col gap-5">
              <ChoiceGrid title={t('create.goal.title')}>
                {GOAL_OPTIONS.map((option) => (
                  <ChoiceButton key={option.id} selected={goalType === option.id} onClick={() => setGoalType(option.id)}>
                    {t(option.key)}
                  </ChoiceButton>
                ))}
              </ChoiceGrid>
              <Field label={t('create.whatToLearn')}>
                <textarea
                  autoFocus
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  placeholder={t('create.descriptionPlaceholder')}
                  className="w-full h-[110px] px-3.5 py-3 bg-bg-2 border border-border rounded-[var(--radius)] text-[13px] text-foreground leading-[1.65] resize-none outline-none transition-colors duration-fast focus:border-primary"
                />
              </Field>
              <div className="flex gap-2 flex-wrap">
                {SUGGESTION_CHIPS.map((key) => (
                  <button
                    key={key}
                    onClick={() => setGoalText(t(key))}
                    className="px-3 py-[5px] rounded-full text-[11px] bg-bg-2 border border-border text-fg-2 hover:bg-accent hover:border-accent-raw hover:text-accent-foreground transition-colors duration-fast"
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="p-[26px] flex flex-col gap-5">
              <ChoiceGrid title={t('create.level.title')}>
                {LEVEL_OPTIONS.map((option) => (
                  <ChoiceButton key={option.id} selected={level === option.id} onClick={() => setLevel(option.id)}>
                    {t(option.key)}
                  </ChoiceButton>
                ))}
              </ChoiceGrid>
              <ChoiceGrid title={t('create.intensity.title')}>
                {INTENSITY_OPTIONS.map((option) => (
                  <ChoiceButton key={option.id} selected={intensity === option.id} onClick={() => setIntensity(option.id)}>
                    {t(option.key)}
                  </ChoiceButton>
                ))}
              </ChoiceGrid>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('create.timeBudget')}>
                  <select value={timeBudget} onChange={(e) => setTimeBudget(e.target.value)} className="w-full px-3 py-2 bg-bg-2 border border-border rounded-lg text-xs text-foreground outline-none">
                    <option value="1-3h">1-3h / week</option>
                    <option value="5-7h">5-7h / week</option>
                    <option value="8-12h">8-12h / week</option>
                    <option value="12h+">12h+ / week</option>
                  </select>
                </Field>
                <Field label={t('create.deadline')}>
                  <input value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder={t('create.deadlinePlaceholder')} className="w-full px-3 py-2 bg-bg-2 border border-border rounded-lg text-xs text-foreground outline-none" />
                </Field>
              </div>

              <div className="rounded-lg border border-border bg-bg-2 p-4">
                <div className="mb-3 text-[13px] font-semibold text-foreground">用户情况细化</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="年龄段">
                    <select value={ageRange} onChange={(e) => setAgeRange(e.target.value)} className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-foreground outline-none">
                      <option value="">不填写</option>
                      <option value="18岁以下">18岁以下</option>
                      <option value="18-24">18-24</option>
                      <option value="25-34">25-34</option>
                      <option value="35-44">35-44</option>
                      <option value="45岁以上">45岁以上</option>
                    </select>
                  </Field>
                  <SingleChoice title="身份/职业" options={ROLE_OPTIONS} value={roleChoice} onChange={setRoleChoice} />
                  <SingleChoice title="学习目的" options={PURPOSE_OPTIONS} value={purposeChoice} onChange={setPurposeChoice} />
                  <SingleChoice title="当前基础" options={CURRENT_STAGE_OPTIONS} value={currentStage} onChange={setCurrentStage} />
                  <SingleChoice title="相关背景" options={BACKGROUND_OPTIONS} value={backgroundChoice} onChange={setBackgroundChoice} />
                  <SingleChoice title="成功标准" options={SUCCESS_OPTIONS} value={successChoice} onChange={setSuccessChoice} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <MultiChoice title="使用设备" options={DEVICE_OPTIONS} values={deviceChoices} onToggle={(value) => toggleStringChoice(value, setDeviceChoices, deviceChoices)} />
                  <MultiChoice title="学习习惯" options={HABIT_OPTIONS} values={studyHabitChoices} onToggle={(value) => toggleStringChoice(value, setStudyHabitChoices, studyHabitChoices)} />
                  <MultiChoice title="学习环境" options={ENVIRONMENT_OPTIONS} values={environmentChoices} onToggle={(value) => toggleStringChoice(value, setEnvironmentChoices, environmentChoices)} />
                  <MultiChoice title="主要阻碍" options={BLOCKER_OPTIONS} values={blockerChoices} onToggle={(value) => toggleStringChoice(value, setBlockerChoices, blockerChoices)} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <textarea value={roleDetail} onChange={(e) => setRoleDetail(e.target.value)} placeholder="身份补充：专业、岗位、年级、行业..." className="min-h-[64px] px-3 py-2 bg-surface border border-border rounded-lg text-xs text-foreground resize-y outline-none" />
                  <textarea value={purposeDetails} onChange={(e) => setPurposeDetails(e.target.value)} placeholder="目的补充：考试名称、项目要求、求职方向..." className="min-h-[64px] px-3 py-2 bg-surface border border-border rounded-lg text-xs text-foreground resize-y outline-none" />
                  <textarea value={currentSituation} onChange={(e) => setCurrentSituation(e.target.value)} placeholder="当前情况补充：已经学到哪里，最近卡在哪里？" className="min-h-[64px] px-3 py-2 bg-surface border border-border rounded-lg text-xs text-foreground resize-y outline-none" />
                  <textarea value={priorBackground} onChange={(e) => setPriorBackground(e.target.value)} placeholder="背景补充：做过什么课程、题目或项目？" className="min-h-[64px] px-3 py-2 bg-surface border border-border rounded-lg text-xs text-foreground resize-y outline-none" />
                  <textarea value={successDefinition} onChange={(e) => setSuccessDefinition(e.target.value)} placeholder="成功标准补充：怎样算这次学习成功？" className="col-span-2 min-h-[64px] px-3 py-2 bg-surface border border-border rounded-lg text-xs text-foreground resize-y outline-none" />
                </div>

                {needsDeepProfile && (
                  <div className="mt-4 rounded-lg border border-primary/30 bg-surface px-3 py-3">
                    <div className="mb-1 text-[13px] font-semibold text-foreground">智能追加追问</div>
                    <p className="mb-3 text-[11px] leading-relaxed text-fg-3">
                      因为你选择了有基础、考试/项目/转行/研究等目标，Miniverto 会多问几项，让计划更像量身定制。
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <SingleChoice title="目标场景" options={TARGET_SCENARIO_OPTIONS} value={targetScenario} onChange={setTargetScenario} />
                      <SingleChoice title="时间节奏" options={SCHEDULE_PATTERN_OPTIONS} value={schedulePattern} onChange={setSchedulePattern} />
                      <SingleChoice title="单次时长" options={SESSION_LENGTH_OPTIONS} value={sessionLength} onChange={setSessionLength} />
                      <SingleChoice title="设备场景" options={DEVICE_CONTEXT_OPTIONS} value={deviceContext} onChange={setDeviceContext} />
                      <SingleChoice title="学习偏好细节" options={LEARNING_PREFERENCE_DETAIL_OPTIONS} value={learningPreferenceDetail} onChange={setLearningPreferenceDetail} />
                      <SingleChoice title="支持方式" options={SUPPORT_PREFERENCE_OPTIONS} value={supportPreference} onChange={setSupportPreference} />
                      <SingleChoice title="基础信心" options={BASELINE_CONFIDENCE_OPTIONS} value={baselineConfidence} onChange={setBaselineConfidence} />
                      <SingleChoice title="反馈方式" options={FEEDBACK_OPTIONS} value={feedbackPreference} onChange={setFeedbackPreference} />
                      <SingleChoice title="内容颗粒度" options={CONTENT_DEPTH_OPTIONS} value={contentDepth} onChange={setContentDepth} />
                    </div>
                  </div>
                )}
              </div>

              {needsDeepProfile && (
                <div className="rounded-lg border border-border bg-bg-2 p-4">
                  <div className="mb-1 text-[13px] font-semibold text-foreground">基础摸底</div>
                  <p className="mb-3 text-[11px] leading-relaxed text-fg-3">
                    Miniverto 会用这个轻量测试校准真实起点，避免把已经掌握的内容重复安排太多。
                  </p>
                  <div className="flex flex-col gap-3">
                    {DIAGNOSTIC_OPTIONS.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border bg-surface px-3 py-2.5">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-foreground">{item.label}</div>
                          <div className="text-[11px] text-fg-3">{item.prompt}</div>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {DIAGNOSTIC_LEVELS.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => setDiagnosticAnswer(item.id, option.id)}
                              className={cn(
                                'rounded-md border px-2 py-1.5 text-[11px] transition-colors duration-fast',
                                diagnosticAnswers[item.id] === option.id
                                  ? 'border-accent-raw bg-accent text-accent-foreground font-semibold'
                                  : 'border-border bg-bg-2 text-fg-2 hover:bg-bg-3',
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <textarea
                    value={diagnosticEvidence}
                    onChange={(e) => setDiagnosticEvidence(e.target.value)}
                    placeholder="补充一个最能证明当前水平的例子：做过什么项目、题目、课程、考试，哪里最容易卡住？"
                    className="mt-3 w-full min-h-[72px] px-3 py-2 bg-surface border border-border rounded-lg text-xs text-foreground resize-y outline-none"
                  />
                  {diagnosticResult && (
                    <div className="mt-2 rounded-md bg-surface px-3 py-2 text-[11px] text-fg-2">
                      摸底估计：{diagnosticResult.scorePct}% / {diagnosticResult.levelSignal}
                      {diagnosticResult.gaps.length > 0 && `，需要优先补：${diagnosticResult.gaps.join('、')}`}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="p-[26px] flex flex-col gap-5">
              <ChoiceGrid title={t('create.preference.title')}>
                {PREFERENCE_OPTIONS.map((option) => (
                  <ChoiceButton key={option.id} selected={preferences.includes(option.id)} onClick={() => togglePreference(option.id)}>
                    {t(option.key)}
                  </ChoiceButton>
                ))}
              </ChoiceGrid>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-bg-2 p-4">
                  <div className="text-[13px] font-semibold text-foreground mb-2">{t('create.materials.uploadTitle')}</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".txt,.md,.markdown,.pdf,.docx,.ppt,.pptx,.mp3,.m4a,.wav"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-[88px] border border-dashed border-fg-3 rounded-lg text-xs text-fg-2 hover:bg-surface transition-colors duration-fast"
                  >
                    {t('create.materials.uploadCta')}
                  </button>
                </div>
                <div className="rounded-lg border border-border bg-bg-2 p-4">
                  <div className="text-[13px] font-semibold text-foreground mb-2">{t('create.materials.pasteTitle')}</div>
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={t('create.materials.pastePlaceholder')}
                    className="w-full h-[88px] px-3 py-2 bg-surface border border-border rounded-lg text-xs resize-none outline-none"
                  />
                  <button onClick={addPastedMaterial} className="mt-2 text-xs text-primary hover:text-primary-hover">
                    {t('create.materials.addPasted')}
                  </button>
                </div>
              </div>
              {materials.length > 0 && (
                <div className="flex flex-col gap-2">
                  {materials.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => toggleMaterial(material.id)}
                      className={cn(
                        'flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-left transition-colors duration-fast',
                        material.selected ? 'bg-accent border-accent-raw' : 'bg-surface border-border',
                      )}
                    >
                      <span className="text-base">{materialIcon(material.kind)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{material.name}</div>
                        <div className="text-[11px] text-fg-3">{formatBytes(material.sizeBytes)} · {t(`create.materials.status.${material.status}`)}</div>
                      </div>
                      <span className="text-xs text-fg-3">{material.selected ? t('common.selected') : t('common.unselected')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="p-[26px] flex flex-col gap-4">
              <SummaryCard title={t('create.review.methods')}>
                <div className="grid grid-cols-2 gap-2">
                  {methodBundle.map((method) => (
                    <div key={method.id} className="px-3 py-2 bg-bg-2 rounded-lg border border-border">
                      <div className="text-xs font-semibold text-foreground">{method.title}</div>
                      <div className="text-[11px] text-fg-3 mt-1 leading-normal">{method.description}</div>
                    </div>
                  ))}
                </div>
              </SummaryCard>
              <SummaryCard title={t('create.review.model')}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">M</div>
                  <div>
                    <div className="text-[13px] font-semibold text-foreground">{bestModel.providerName} · {bestModel.label}</div>
                    <div className="text-xs text-fg-2 mt-1">{bestModel.bestFor}</div>
                    <div className="text-[11px] text-fg-3 mt-1">{t('create.review.freeAlso')}: {freeModels.map((m) => m.label).join(' / ')}</div>
                  </div>
                </div>
              </SummaryCard>
              <textarea
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                placeholder={t('create.extraNotesPlaceholder')}
                className="w-full h-[82px] px-3.5 py-3 bg-bg-2 border border-border rounded-[var(--radius)] text-[13px] text-foreground leading-[1.65] resize-none outline-none transition-colors duration-fast focus:border-primary"
              />
            </div>
          )}

          {(step === 4 || step === 5) && (
            <div className="px-[26px] py-5">
              {step === 4 && (
                <div className="mb-3.5 flex gap-2.5 items-center">
                  <div className="flex-1 h-1 bg-bg-2 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-[width] duration-300 ease-out" style={{ width: `${loadingPct}%` }} />
                  </div>
                  <span className="text-[11px] text-fg-3 shrink-0">{t('create.generatingLabel')}</span>
                </div>
              )}
              <div className="px-4 py-3.5 bg-bg-2 rounded-[var(--radius)] border border-border font-mono text-xs text-foreground leading-[1.75] whitespace-pre-wrap min-h-[260px]">
                {streamedPlan}
                {step === 4 && !planDone && <StreamingCursor />}
              </div>
              {step === 5 && (
                <div className="mt-3 px-3.5 py-2.5 bg-ok-bg border border-ok rounded-lg flex items-center gap-2 text-xs text-ok">
                  <span>OK</span>
                  <span>{t('create.doneMessage')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-[26px] py-4 border-t border-border-2 flex justify-between items-center">
          <button
            onClick={onClose}
            className="text-xs text-fg-3 px-3 py-1.5 rounded-lg hover:bg-bg-2 hover:text-fg-2 transition-colors duration-fast"
          >
            {step < 5 ? t('common.cancel') : t('create.later')}
          </button>

          <div className="flex gap-2">
            {step > 0 && step < 4 && (
              <button
                onClick={() => setStep((current) => Math.max(current - 1, 0))}
                className="px-4 py-2 rounded-[var(--radius)] bg-bg-2 border border-border text-[13px] text-fg-2 font-medium hover:bg-bg-3 transition-colors duration-fast"
              >
                {t('common.prev')}
              </button>
            )}
            {step < 4 && (
              <button
                disabled={!canContinue}
                onClick={handleNext}
                className={cn(
                  'px-5 py-2 rounded-[var(--radius)] text-[13px] font-medium transition-colors duration-fast',
                  canContinue
                    ? 'bg-primary text-primary-foreground hover:bg-primary-hover cursor-pointer'
                    : 'bg-border text-fg-3 cursor-not-allowed',
                )}
              >
                {step === 3 ? t('create.generatePlan') : `${t('common.next')} ->`}
              </button>
            )}
            {step === 5 && (
              <button
                onClick={() => void handleCreateProject()}
                className="px-5 py-2 rounded-[var(--radius)] bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary-hover transition-colors duration-fast"
              >
                {t('create.startLearning')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ChoiceGrid({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[13px] font-semibold text-foreground mb-2">{title}</div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">{children}</div>
    </div>
  )
}

function ChoiceButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2.5 rounded-lg border text-xs text-left transition-all duration-fast',
        selected ? 'bg-accent border-accent-raw text-accent-foreground font-semibold' : 'bg-bg-2 border-border text-fg-2 hover:bg-bg-3',
      )}
    >
      {children}
    </button>
  )
}

function SingleChoice({
  title,
  options,
  value,
  onChange,
}: {
  title: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-semibold text-fg-2">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={cn(
              'rounded-md border px-2.5 py-1.5 text-[11px] transition-colors duration-fast',
              value === option ? 'border-accent-raw bg-accent text-accent-foreground font-semibold' : 'border-border bg-surface text-fg-2 hover:bg-bg-3',
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function MultiChoice({
  title,
  options,
  values,
  onToggle,
}: {
  title: string
  options: string[]
  values: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-semibold text-fg-2">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onToggle(option)}
            className={cn(
              'rounded-md border px-2.5 py-1.5 text-[11px] transition-colors duration-fast',
              values.includes(option) ? 'border-accent-raw bg-accent text-accent-foreground font-semibold' : 'border-border bg-surface text-fg-2 hover:bg-bg-3',
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="text-[13px] font-semibold text-foreground block mb-2">{label}</span>
      {children}
    </label>
  )
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="text-[13px] font-semibold text-foreground mb-3">{title}</div>
      {children}
    </div>
  )
}

function withDetail(choice: string, detail: string) {
  return [choice, detail.trim()].filter(Boolean).join('；')
}

function materialIcon(kind: LearningMaterial['kind']) {
  if (kind === 'text') return 'T'
  if (kind === 'document') return 'D'
  if (kind === 'slides') return 'S'
  if (kind === 'audio') return 'A'
  return '?'
}
