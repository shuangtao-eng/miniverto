import type { Project, Task, TaskAssessmentRecord } from '@/types'

export interface AssessmentTrendPoint {
  recordId: string
  taskId: string
  taskTitle: string
  createdAt: string
  scorePct: number
  passed: boolean
  needsReinforcement: boolean
}

export interface ReviewTrigger {
  taskId: string
  taskTitle: string
  scorePct: number
  focus: string[]
  action: string
}

export interface AssessmentInsights {
  points: AssessmentTrendPoint[]
  completedAssessmentCount: number
  latestScorePct: number | null
  averageScorePct: number | null
  masteryLabel: string
  reviewTriggers: ReviewTrigger[]
}

interface AssessmentInsightsOptions {
  thresholdPct?: number
}

export function buildAssessmentInsights(
  project: Project,
  options: AssessmentInsightsOptions = {},
): AssessmentInsights {
  const thresholdPct = options.thresholdPct ?? 80
  const tasks = project.milestoneList.flatMap((milestone) => milestone.tasks)
  const points = tasks
    .flatMap((task) => assessmentPointsForTask(task))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const latestPoint = points.length > 0 ? points[points.length - 1] : undefined
  const latestScorePct = latestPoint?.scorePct ?? null
  const averageScorePct = points.length > 0
    ? Math.round(points.reduce((sum, point) => sum + point.scorePct, 0) / points.length)
    : null

  return {
    points,
    completedAssessmentCount: points.length,
    latestScorePct,
    averageScorePct,
    masteryLabel: masteryLabel(latestScorePct),
    reviewTriggers: tasks
      .map((task) => reviewTriggerForTask(task, thresholdPct))
      .filter((trigger): trigger is ReviewTrigger => Boolean(trigger)),
  }
}

function assessmentPointsForTask(task: Task): AssessmentTrendPoint[] {
  return (task.assessmentHistory ?? []).map((record) => ({
    recordId: record.id,
    taskId: task.id,
    taskTitle: task.title,
    createdAt: record.createdAt,
    scorePct: record.scorePct,
    passed: record.passed,
    needsReinforcement: record.needsReinforcement,
  }))
}

function reviewTriggerForTask(task: Task, thresholdPct: number): ReviewTrigger | null {
  const latest = latestRecord(task.assessmentHistory)
  if (!latest || latest.scorePct >= thresholdPct || !latest.needsReinforcement) return null

  return {
    taskId: task.id,
    taskTitle: task.title,
    scorePct: latest.scorePct,
    focus: latest.nextPlan.focus,
    action: latest.nextPlan.actions[0] ?? '重新学习本节并完成一次课后测评',
  }
}

function latestRecord(records?: TaskAssessmentRecord[]) {
  const sorted = records?.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)) ?? []
  return sorted.length > 0 ? sorted[sorted.length - 1] : null
}

function masteryLabel(scorePct: number | null) {
  if (scorePct == null) return '暂无测评'
  if (scorePct < 60) return '基础未稳'
  if (scorePct < 80) return '需要加强'
  if (scorePct < 90) return '基本达标'
  return '掌握良好'
}
