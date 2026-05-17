import type {
  LearningIntensity,
  LearningLevel,
  LearningMethod,
  LearningOutcome,
  LearningPreference,
} from './learning-methods'
import type { ModelOption } from './model-options'
import type { LearningMaterial } from './materials'
import type { DiagnosticResult } from '@/services/diagnostic-assessment'

export interface BuildPlanInputArgs {
  goalType: LearningOutcome
  goalText: string
  level: LearningLevel
  intensity: LearningIntensity
  timeBudget: string
  deadline: string
  preferences: LearningPreference[]
  extraNotes: string
  learnerProfile?: LearnerProfileInput
  diagnostic?: DiagnosticResult | null
  methods: LearningMethod[]
  model: ModelOption
  materials: LearningMaterial[]
}

export interface LearnerProfileInput {
  ageRange?: string
  role?: string
  purposeDetails?: string
  currentSituation?: string
  priorBackground?: string
  studyHabits?: string
  devices?: string
  learningEnvironment?: string
  blockers?: string
  successDefinition?: string
  targetScenario?: string
  schedulePattern?: string
  sessionLength?: string
  deviceContext?: string
  learningPreferenceDetail?: string
  supportPreference?: string
  baselineConfidence?: string
  feedbackPreference?: string
  contentDepth?: string
}

export interface PlanInputMaterial {
  id: string
  name: string
  kind: LearningMaterial['kind']
  source: LearningMaterial['source']
  summary: string
}

export function buildPlanInput(args: BuildPlanInputArgs) {
  return {
    learner: {
      goalType: args.goalType,
      goalText: args.goalText.trim(),
      level: args.level,
      intensity: args.intensity,
      timeBudget: args.timeBudget,
      deadline: args.deadline.trim() || null,
      preferences: args.preferences,
      extraNotes: args.extraNotes.trim() || null,
      profile: normalizeProfile(args.learnerProfile),
      diagnostic: args.diagnostic ?? undefined,
    },
    methods: args.methods.map((method) => ({
      id: method.id,
      title: method.title,
      description: method.description,
    })),
    model: {
      id: args.model.id,
      providerId: args.model.providerId,
      label: args.model.label,
      planningScore: args.model.planningScore,
    },
    materials: args.materials
      .filter((material) => material.selected)
      .filter((material) => material.status === 'ready')
      .filter((material) => material.kind !== 'unsupported')
      .map((material): PlanInputMaterial => ({
        id: material.id,
        name: material.name,
        kind: material.kind,
        source: material.source,
        summary: material.note?.trim() || material.name,
      })),
    constraints: {
      sendFullFiles: false,
      preferStructuredChoices: true,
    },
  }
}

function normalizeProfile(profile?: LearnerProfileInput) {
  if (!profile) return undefined
  const normalized = Object.fromEntries(
    Object.entries(profile)
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
      .filter(([, value]) => typeof value === 'string' && value.length > 0),
  )
  return Object.keys(normalized).length > 0 ? normalized : undefined
}
