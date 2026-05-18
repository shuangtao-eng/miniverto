import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useProjectStore } from '@/stores/project-store'
import { useMaterialStore } from '@/stores/material-store'
import { useUIStore } from '@/stores/ui-store'
import { ProgressRing } from '@/components/shared/ProgressRing'
import { CriticScorecard } from '@/components/project/CriticScorecard'
import { PlanTree } from '@/components/project/PlanTree'
import { TaskDetailPanel } from '@/components/project/TaskDetailPanel'
import { FinalAssessmentDialog } from '@/components/assessment/FinalAssessmentDialog'
import { getTauriInvoke } from '@/services/material-ingest'
import {
  getLatestPersistedAssessmentResult,
  type PersistedFinalAssessmentResult,
} from '@/services/assessment-results'
import { createReinforcementProject } from '@/services/reinforcement-plan'
import { deletePersistedProject, upsertPersistedProject } from '@/services/project-library'
import { updatePersistedTaskProgress } from '@/services/task-progress'
import { buildTaskKnowledgeNoteBody, saveKnowledgeNote } from '@/services/knowledge-notes'
import { buildAssessmentInsights } from '@/services/assessment-insights'
import type { AssessmentInsights, ReviewTrigger } from '@/services/assessment-insights'
import { addReinforcementTaskToProject } from '@/services/task-reinforcement'
import type { Task } from '@/types'
import { cn } from '@/lib/utils'

export function ProjectDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { projectId } = useParams({ from: '/app/project/$projectId' })
  const project = useProjectStore((s) => s.getProject(projectId))
  const addProject = useProjectStore((s) => s.addProject)
  const removeProject = useProjectStore((s) => s.removeProject)
  const updateTaskProgress = useProjectStore((s) => s.updateTaskProgress)
  const materials = useMaterialStore((s) => s.materials)
  const openModal = useUIStore((s) => s.openModal)

  const [taskStatuses, setTaskStatuses] = useState<Record<string, Task['status']>>(() => {
    const s: Record<string, Task['status']> = {}
    project?.milestoneList.forEach((m) => m.tasks.forEach((t) => { s[t.id] = t.status }))
    return s
  })
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [activeTab, setActiveTab] = useState<'plan' | 'progress'>('plan')
  const [showFinalAssessment, setShowFinalAssessment] = useState(false)
  const [latestAssessment, setLatestAssessment] = useState<PersistedFinalAssessmentResult | null>(null)

  const allTasks = useMemo(() => project?.milestoneList.flatMap((m) => m.tasks) ?? [], [project])
  const assessmentInsights = useMemo(
    () => project ? buildAssessmentInsights(project) : null,
    [project],
  )
  const completed = allTasks.filter((t) => (taskStatuses[t.id] ?? t.status) === 'completed').length
  const pct = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0

  useEffect(() => {
    let cancelled = false

    async function loadLatestAssessment() {
      if (!project) return
      const invoke = await getTauriInvoke()
      const latest = await getLatestPersistedAssessmentResult(project.id, invoke)
      if (!cancelled) setLatestAssessment(latest)
    }

    loadLatestAssessment().catch(() => {
      if (!cancelled) setLatestAssessment(null)
    })

    return () => {
      cancelled = true
    }
  }, [project])

  if (!project) {
    return <div className="p-8 text-fg-3 text-sm">Project not found</div>
  }

  const tabs = [
    { key: 'plan' as const, label: t('detail.tabs.plan') },
    { key: 'progress' as const, label: 'Progress' },
  ]

  const handleStatusChange = (id: string, status: Task['status']) => {
    setTaskStatuses((v) => ({ ...v, [id]: status }))
    updateTaskProgress(id, { status })
    void getTauriInvoke().then((invoke) =>
      updatePersistedTaskProgress({ taskId: id, status, invoke }),
    )
  }

  const handleSaveTaskNote = (id: string, note: string) => {
    const status = taskStatuses[id] ?? allTasks.find((task) => task.id === id)?.status ?? 'pending'
    updateTaskProgress(id, { userNote: note })
    setSelectedTask((current) => current?.id === id ? { ...current, userNote: note } : current)
    void getTauriInvoke().then((invoke) =>
      updatePersistedTaskProgress({ taskId: id, status, userNote: note, invoke }),
    )
  }

  const handlePromoteTaskNote = async (task: Task, note: string) => {
    const invoke = await getTauriInvoke()
    const draft = buildTaskKnowledgeNoteBody(task, note)
    await saveKnowledgeNote({
      title: task.title,
      body: draft.body,
      tags: draft.tags,
      sourceType: 'task',
      projectId: project.id,
      taskId: task.id,
      invoke,
    })
    handleSaveTaskNote(task.id, note)
  }

  const handleStartLearning = async (task: Task) => {
    await navigate({
      to: '/project/$projectId/task/$taskId/learn',
      params: { projectId: project.id, taskId: task.id },
    })
  }

  const handleCreateReinforcementPlan = async () => {
    if (!project || !latestAssessment) return
    const reinforcement = createReinforcementProject(project, latestAssessment)
    addProject(reinforcement)

    const invoke = await getTauriInvoke()
    await upsertPersistedProject(reinforcement, invoke)
    await navigate({ to: '/project/$projectId', params: { projectId: reinforcement.id } })
  }

  const handleAddReinforcementTask = async (trigger: ReviewTrigger) => {
    if (!project) return
    const updatedProject = addReinforcementTaskToProject(project, trigger, { nowLabel: 'just now' })
    if (updatedProject === project) return

    addProject(updatedProject)
    const newTask = updatedProject.milestoneList
      .flatMap((milestone) => milestone.tasks)
      .find((task) => task.id === `${trigger.taskId}-reinforce`)
    if (newTask) {
      setTaskStatuses((current) => ({ ...current, [newTask.id]: newTask.status }))
    }

    const invoke = await getTauriInvoke()
    await upsertPersistedProject(updatedProject, invoke)
  }

  const handleDeleteProject = async () => {
    if (!project) return
    const confirmed = window.confirm(`Delete "${project.title}"? The plan, tasks, and assessment cache will be removed together.`)
    if (!confirmed) return

    const invoke = await getTauriInvoke()
    await deletePersistedProject(project.id, invoke)
    removeProject(project.id)
    await navigate({ to: '/' })
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-8 py-7">
        {/* Project header */}
        <div className="mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-[52px] h-[52px] rounded-lg bg-accent flex items-center justify-center text-2xl shrink-0">
              {project.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-bold text-foreground tracking-[-0.4px] mb-1.5">
                {project.title}
              </h1>
              <div className="flex items-center gap-3">
                <ProgressRing pct={pct} size={32} stroke={3} />
                <span className="text-[13px] text-fg-2">{t('detail.tasksCompleted', { completed, total: allTasks.length })}</span>
                <span className="text-border text-xs">·</span>
                <span className="text-[13px] text-fg-3">{t('detail.milestones', { count: project.milestoneList.length })}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => openModal('replan')}
                className="flex items-center gap-1.5 px-4 py-2 rounded bg-bg-2 border border-border text-[13px] text-fg-2 font-medium hover:bg-bg-3 hover:text-foreground transition-colors duration-fast"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6a4 4 0 1 1 .8 2.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M2 9V6h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {t('detail.replan')}
              </button>
              <button
                onClick={() => openModal('assessment')}
                className="flex items-center gap-1.5 px-4 py-2 rounded bg-accent border border-accent-raw text-[13px] text-accent-foreground font-medium hover:brightness-95 transition-all duration-fast"
              >
                ✦ {t('detail.milestoneAssess')}
              </button>
              <button
                onClick={() => setShowFinalAssessment(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary-hover transition-all duration-fast"
              >
                Final Assessment
              </button>
              <button
                onClick={() => void handleDeleteProject()}
                className="flex items-center gap-1.5 px-4 py-2 rounded bg-err-bg border border-err text-[13px] text-err font-medium hover:brightness-95 transition-all duration-fast"
              >
                Delete Plan and Cache
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-3.5 py-2 text-[13px] -mb-px transition-colors duration-fast',
                  activeTab === tab.key
                    ? 'font-semibold text-foreground border-b-2 border-primary'
                    : 'text-fg-3 border-b-2 border-transparent',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {latestAssessment && (
          <div className="mb-5 rounded-lg border border-border bg-surface px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[220px]">
                <div className="text-[12px] font-semibold text-fg-3">Latest final assessment</div>
                <div className="mt-1 text-[13px] leading-[1.6] text-fg-2">
                  {latestAssessment.masterySummary}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-[28px] font-extrabold text-foreground">
                  {latestAssessment.scorePct}%
                </div>
                <div className="text-[11px] text-fg-3">{latestAssessment.levelLabel}</div>
              </div>
              <div className="rounded bg-bg-2 px-3 py-2 text-[11px] text-fg-2">
                {latestAssessment.nextPlan.title}
              </div>
              <button
                onClick={() => void handleCreateReinforcementPlan()}
                className="rounded bg-primary px-4 py-2 text-[12px] font-medium text-primary-foreground transition-colors duration-fast hover:bg-primary-hover"
              >
                Generate reinforcement plan
              </button>
            </div>
          </div>
        )}

        {/* Tab content */}
        {activeTab === 'plan' && (
          <div>
            {project.criticScore != null && project.criticDimensions && (
              <CriticScorecard score={project.criticScore} dimensions={project.criticDimensions} />
            )}
            <PlanTree
              project={project}
              taskStatuses={taskStatuses}
              onTaskStatusChange={handleStatusChange}
              onTaskOpen={setSelectedTask}
            />
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="flex flex-col gap-4">
            {assessmentInsights && (
              <AssessmentInsightsPanel
                insights={assessmentInsights}
                onAddReinforcementTask={(trigger) => void handleAddReinforcementTask(trigger)}
              />
            )}
            {project.milestoneList.map((m) => {
              const done = m.tasks.filter((t) => (taskStatuses[t.id] ?? t.status) === 'completed').length
              const p = m.tasks.length > 0 ? Math.round((done / m.tasks.length) * 100) : 0
              return (
                <div key={m.id} className="flex items-center gap-3.5 px-4 py-3.5 bg-surface border border-border-2 rounded">
                  <ProgressRing pct={p} size={40} stroke={3.5} color={p === 100 ? 'var(--ok)' : undefined} />
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-foreground mb-[3px]">{m.title}</div>
                    <div className="text-[11px] text-fg-3">{done}/{m.tasks.length} tasks</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Task detail slide-over */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onStartLearning={(task) => void handleStartLearning(task)}
          onSaveNote={handleSaveTaskNote}
          onPromoteNote={(task, note) => void handlePromoteTaskNote(task, note)}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {showFinalAssessment && (
        <FinalAssessmentDialog
          project={project}
          materials={materials}
          onResultSaved={setLatestAssessment}
          onClose={() => setShowFinalAssessment(false)}
        />
      )}
    </div>
  )
}

function AssessmentInsightsPanel({
  insights,
  onAddReinforcementTask,
}: {
  insights: AssessmentInsights
  onAddReinforcementTask: (trigger: ReviewTrigger) => void
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold text-foreground">Post-lesson mastery trend</div>
          <div className="mt-1 text-[12px] text-fg-3">
            {insights.completedAssessmentCount} post-lesson assessments recorded
          </div>
        </div>
        <div className="flex gap-2">
          <MetricPill label="Latest" value={insights.latestScorePct == null ? '--' : `${insights.latestScorePct}%`} />
          <MetricPill label="Average" value={insights.averageScorePct == null ? '--' : `${insights.averageScorePct}%`} />
          <MetricPill label="Status" value={insights.masteryLabel} />
        </div>
      </div>

      {insights.points.length > 0 ? (
        <div className="flex items-end gap-1.5 rounded-md border border-border bg-bg-2 px-3 py-3">
          {insights.points.map((point) => (
            <div key={point.recordId} className="flex min-w-8 flex-1 flex-col items-center gap-1">
              <div
                title={`${point.taskTitle}: ${point.scorePct}%`}
                className={[
                  'w-full rounded-t',
                  point.scorePct >= 80 ? 'bg-ok' : 'bg-warn',
                ].join(' ')}
                style={{ height: `${Math.max(18, point.scorePct)}px` }}
              />
              <span className="text-[10px] text-fg-3">{point.scorePct}%</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-border bg-bg-2 px-3 py-3 text-[12px] text-fg-3">
          Complete post-lesson assessments in the learning page to see mastery trends here.
        </div>
      )}

      {insights.reviewTriggers.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-[12px] font-semibold text-foreground">Tasks that need review</div>
          <div className="grid gap-2">
            {insights.reviewTriggers.map((trigger) => (
              <div key={trigger.taskId} className="rounded-md border border-warn bg-warn-bg px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[12px] font-semibold text-foreground">{trigger.taskTitle}</div>
                  <div className="text-[12px] font-bold text-warn">{trigger.scorePct}%</div>
                </div>
                <div className="mt-1 text-[11px] leading-relaxed text-fg-3">
                  {trigger.focus.join('、')} · {trigger.action}
                </div>
                <button
                  type="button"
                  onClick={() => onAddReinforcementTask(trigger)}
                  className="mt-2 rounded bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary-hover"
                >
                  Add to current plan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-bg-2 px-3 py-2 text-right">
      <div className="text-[10px] uppercase text-fg-3">{label}</div>
      <div className="mt-0.5 text-[13px] font-semibold text-foreground">{value}</div>
    </div>
  )
}
