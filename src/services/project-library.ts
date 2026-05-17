import type { Project, ProjectStatus, Task } from '@/types'
import type { Milestone } from '@/types'
import type { InvokeFn } from './material-ingest'

interface PersistedTask {
  id: string
  milestone_id?: string
  kind: Task['kind']
  title: string
  description?: string | null
  estimated_minutes: number
  status: Task['status']
  suggested_date?: string | null
  acceptance_criteria?: string | null
  learning_content_json?: string | null
  recommended_references_json?: string | null
  assessment_history_json?: string | null
  user_note?: string | null
  ordinal?: number
}

interface PersistedMilestone {
  id: string
  project_id?: string
  title: string
  success_criteria: string
  ordinal?: number
  tasks: PersistedTask[]
}

interface PersistedProject {
  id: string
  emoji: string
  title: string
  goal_summary: string
  status: ProjectStatus
  completed_tasks: number
  total_tasks: number
  critic_score?: number | null
  last_active: string
  milestones: PersistedMilestone[]
}

export async function listPersistedProjects(invoke?: InvokeFn): Promise<Project[]> {
  if (!invoke) return []
  const records = await invoke('list_projects') as PersistedProject[]
  return records.map(projectFromPersistedRecord)
}

export async function upsertPersistedProject(project: Project, invoke?: InvokeFn): Promise<void> {
  if (!invoke) return
  await invoke('upsert_project', { project: projectToPersistedRecord(project) })
}

export async function deletePersistedProject(projectId: string, invoke?: InvokeFn): Promise<void> {
  if (!invoke) return
  await invoke('delete_project', { projectId })
}

function projectFromPersistedRecord(record: PersistedProject): Project {
  return {
    id: record.id,
    emoji: record.emoji,
    title: record.title,
    goalSummary: record.goal_summary,
    status: record.status,
    milestoneList: record.milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      successCriteria: milestone.success_criteria,
      tasks: milestone.tasks.map((task) => ({
        id: task.id,
        kind: task.kind,
        title: task.title,
        description: task.description ?? undefined,
        estimatedMinutes: task.estimated_minutes,
        status: task.status,
        suggestedDate: task.suggested_date ?? undefined,
        acceptanceCriteria: task.acceptance_criteria ?? undefined,
        learningContent: parseJsonField(task.learning_content_json),
        recommendedReferences: parseJsonField(task.recommended_references_json),
        assessmentHistory: parseJsonField(task.assessment_history_json),
        userNote: task.user_note ?? undefined,
      })),
    })),
    completedTasks: record.completed_tasks,
    totalTasks: record.total_tasks,
    criticScore: record.critic_score ?? undefined,
    lastActive: record.last_active,
  }
}

function projectToPersistedRecord(project: Project): PersistedProject {
  return {
    id: project.id,
    emoji: project.emoji,
    title: project.title,
    goal_summary: project.goalSummary,
    status: project.status,
    completed_tasks: project.completedTasks,
    total_tasks: project.totalTasks,
    critic_score: project.criticScore ?? null,
    last_active: project.lastActive,
    milestones: project.milestoneList.map((milestone, milestoneIndex) =>
      milestoneToPersistedRecord(project.id, milestone, milestoneIndex),
    ),
  }
}

function milestoneToPersistedRecord(projectId: string, milestone: Milestone, ordinal: number): PersistedMilestone {
  return {
    id: milestone.id,
    project_id: projectId,
    title: milestone.title,
    success_criteria: milestone.successCriteria,
    ordinal,
    tasks: milestone.tasks.map((task, taskIndex) => ({
      id: task.id,
      milestone_id: milestone.id,
      kind: task.kind,
      title: task.title,
      description: task.description ?? null,
      estimated_minutes: task.estimatedMinutes,
      status: task.status,
      suggested_date: task.suggestedDate ?? null,
      acceptance_criteria: task.acceptanceCriteria ?? null,
      learning_content_json: task.learningContent ? JSON.stringify(task.learningContent) : null,
      recommended_references_json: task.recommendedReferences ? JSON.stringify(task.recommendedReferences) : null,
      assessment_history_json: task.assessmentHistory ? JSON.stringify(task.assessmentHistory) : null,
      user_note: task.userNote ?? null,
      ordinal: taskIndex,
    })),
  }
}

function parseJsonField<T>(value?: string | null): T | undefined {
  if (!value) return undefined
  try {
    return JSON.parse(value) as T
  } catch {
    return undefined
  }
}
