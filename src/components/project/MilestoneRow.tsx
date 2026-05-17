import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Milestone, Task } from '@/types'
import { cn } from '@/lib/utils'
import { TaskCard } from './TaskCard'

interface MilestoneRowProps {
  milestone: Milestone
  taskStatuses: Record<string, Task['status']>
  onTaskStatusChange: (id: string, status: Task['status']) => void
  onTaskOpen?: (task: Task) => void
  defaultExpanded?: boolean
}

export function MilestoneRow({ milestone, taskStatuses, onTaskStatusChange, onTaskOpen, defaultExpanded = true }: MilestoneRowProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(defaultExpanded)

  const completed = milestone.tasks.filter((t) => (taskStatuses[t.id] ?? t.status) === 'completed').length
  const pct = milestone.tasks.length > 0 ? Math.round((completed / milestone.tasks.length) * 100) : 0

  return (
    <div className="mb-2">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'w-full flex items-center gap-2.5 px-3.5 py-3 bg-surface border border-border-2 text-left cursor-pointer transition-[border-radius] duration-normal',
          expanded ? 'rounded-t-[var(--radius)] rounded-b-none' : 'rounded',
        )}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className={cn('shrink-0 transition-transform duration-normal ease-spring', expanded && 'rotate-90')}
        >
          <path d="M5 3l4 4-4 4" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-foreground">{milestone.title}</span>
            {pct === 100 && (
              <span className="text-[10px] px-1.5 py-px bg-ok-bg text-ok rounded-full font-semibold">
                {t('status.completed')}
              </span>
            )}
          </div>
          {milestone.successCriteria && (
            <p className="text-[11px] text-fg-3 mt-0.5 truncate">{milestone.successCriteria}</p>
          )}
        </div>

        {/* Mini progress */}
        <div className="flex items-center gap-[7px] shrink-0">
          <div className="w-[60px] h-1 bg-bg-3 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{
                width: `${pct}%`,
                background: pct === 100 ? 'var(--ok)' : 'var(--accent)',
              }}
            />
          </div>
          <span className="text-[11px] text-fg-3 w-[38px] text-right">{completed}/{milestone.tasks.length}</span>
        </div>
      </button>

      {/* Task list */}
      {expanded && (
        <div className="bg-surface border border-border-2 border-t-0 rounded-b py-1.5">
          {milestone.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={{ ...task, status: taskStatuses[task.id] ?? task.status }}
              onStatusChange={onTaskStatusChange}
              onOpen={onTaskOpen}
            />
          ))}
        </div>
      )}
    </div>
  )
}
