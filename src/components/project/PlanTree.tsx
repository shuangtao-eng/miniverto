import { useTranslation } from 'react-i18next'
import type { Project, Task } from '@/types'
import { MilestoneRow } from './MilestoneRow'

interface PlanTreeProps {
  project: Project
  taskStatuses: Record<string, Task['status']>
  onTaskStatusChange: (id: string, status: Task['status']) => void
  onTaskOpen?: (task: Task) => void
}

export function PlanTree({ project, taskStatuses, onTaskStatusChange, onTaskOpen }: PlanTreeProps) {
  const { t } = useTranslation()

  return (
    <div>
      {/* Goal banner */}
      <div className="px-[18px] py-4 rounded-lg border border-border mb-5" style={{ background: 'linear-gradient(135deg, var(--accent-bg) 0%, var(--bg-2) 100%)' }}>
        <div className="text-[11px] text-fg-3 mb-[5px] uppercase tracking-[0.06em] font-semibold">
          {t('detail.goalLabel', '学习目标')}
        </div>
        <p className="text-[15px] font-medium text-foreground leading-relaxed font-display">
          {project.goalSummary}
        </p>
      </div>

      {/* Milestones */}
      {project.milestoneList.map((m, i) => (
        <MilestoneRow
          key={m.id}
          milestone={m}
          taskStatuses={taskStatuses}
          onTaskStatusChange={onTaskStatusChange}
          onTaskOpen={onTaskOpen}
          defaultExpanded={i === 0}
        />
      ))}
    </div>
  )
}
