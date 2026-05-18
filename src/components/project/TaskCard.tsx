import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Task } from '@/types'
import { cn } from '@/lib/utils'
import { TaskCheckbox } from './TaskCheckbox'

const KIND_ICONS: Record<Task['kind'], string> = { reading: '📖', practice: '🛠️', reflection: '💭', other: '✦' }

interface TaskCardProps {
  task: Task
  onStatusChange: (id: string, status: Task['status']) => void
  onOpen?: (task: Task) => void
  selected?: boolean
}

export function TaskCard({ task, onStatusChange, onOpen, selected }: TaskCardProps) {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)
  const isCompleted = task.status === 'completed'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen?.(task)}
      className={cn(
        'flex items-start gap-2.5 px-3.5 py-2.5 rounded cursor-pointer transition-colors duration-fast',
        selected ? 'bg-accent border border-accent-raw' : 'border border-transparent',
        !selected && hovered && 'bg-bg-2',
      )}
    >
      <div className="pt-px">
        <TaskCheckbox status={task.status} onChange={(s) => onStatusChange(task.id, s)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[7px] mb-0.5">
          <span className="text-xs">{KIND_ICONS[task.kind]}</span>
          <span
            className={cn(
              'text-[13px] font-medium truncate',
              isCompleted ? 'text-fg-3 line-through' : 'text-foreground',
            )}
          >
            {task.title}
          </span>
        </div>
        <div className="flex gap-2.5 items-center">
          <span className="text-[11px] text-fg-3">⏱ {task.estimatedMinutes} {t('units.minutes', 'minutes')}</span>
          {task.suggestedDate && <span className="text-[11px] text-fg-3">📅 {task.suggestedDate}</span>}
          {task.userNote && <span className="text-[11px] text-ok max-w-40 truncate">💬 {task.userNote}</span>}
        </div>
      </div>
      {hovered && (
        <button
          className="text-[11px] text-accent-text px-2 py-[2px] rounded-sm bg-accent shrink-0"
          onClick={(e) => { e.stopPropagation(); onOpen?.(task) }}
        >
          {t('detail.task.detail')}
        </button>
      )}
    </div>
  )
}
