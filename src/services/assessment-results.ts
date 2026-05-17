import type { FinalAssessmentLevel, FinalAssessmentResult } from './final-assessment'
import type { InvokeFn } from './material-ingest'

interface PersistedAssessmentResult {
  id: string
  project_id: string
  score_pct: number
  correct: number
  total: number
  level: FinalAssessmentLevel
  level_label: string
  mastery_summary: string
  weak_bands_json: string
  next_plan_title: string
  next_plan_focus_json: string
  next_plan_duration_days: number
  created_at: number
}

interface UpsertAssessmentResultArgs {
  projectId: string
  result: FinalAssessmentResult
  invoke?: InvokeFn
  now?: () => number
}

export interface PersistedFinalAssessmentResult extends FinalAssessmentResult {
  id: string
  projectId: string
  createdAt: number
}

export async function upsertPersistedAssessmentResult(
  args: UpsertAssessmentResultArgs,
): Promise<PersistedFinalAssessmentResult | null> {
  if (!args.invoke) return null
  const createdAt = args.now?.() ?? Date.now()
  const record = resultToPersistedRecord(args.projectId, args.result, createdAt)
  await args.invoke('upsert_assessment_result', { result: record })
  return resultFromPersistedRecord(record)
}

export async function getLatestPersistedAssessmentResult(
  projectId: string,
  invoke?: InvokeFn,
): Promise<PersistedFinalAssessmentResult | null> {
  if (!invoke) return null
  const record = await invoke('get_latest_assessment_result', { projectId }) as PersistedAssessmentResult | null
  return record ? resultFromPersistedRecord(record) : null
}

function resultToPersistedRecord(
  projectId: string,
  result: FinalAssessmentResult,
  createdAt: number,
): PersistedAssessmentResult {
  return {
    id: `assessment-${projectId}-${createdAt}`,
    project_id: projectId,
    score_pct: result.scorePct,
    correct: result.correct,
    total: result.total,
    level: result.level,
    level_label: result.levelLabel,
    mastery_summary: result.masterySummary,
    weak_bands_json: JSON.stringify(result.weakBands),
    next_plan_title: result.nextPlan.title,
    next_plan_focus_json: JSON.stringify(result.nextPlan.focus),
    next_plan_duration_days: result.nextPlan.durationDays,
    created_at: createdAt,
  }
}

function resultFromPersistedRecord(record: PersistedAssessmentResult): PersistedFinalAssessmentResult {
  const weakBands = parseJsonArray(record.weak_bands_json)
  return {
    id: record.id,
    projectId: record.project_id,
    createdAt: record.created_at,
    correct: record.correct,
    total: record.total,
    scorePct: record.score_pct,
    level: record.level,
    levelLabel: record.level_label,
    masterySummary: record.mastery_summary,
    weakBands: weakBands as PersistedFinalAssessmentResult['weakBands'],
    needsContinuation: record.score_pct < 85 || weakBands.length > 0,
    nextPlan: {
      title: record.next_plan_title,
      focus: parseJsonArray(record.next_plan_focus_json),
      durationDays: record.next_plan_duration_days,
    },
  }
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}
