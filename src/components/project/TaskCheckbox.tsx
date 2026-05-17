import type { Task } from '@/types'

type TaskStatus = Task['status']

const CYCLE: Record<TaskStatus, TaskStatus> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
}

interface TaskCheckboxProps {
  status: TaskStatus
  onChange: (next: TaskStatus) => void
}

export function TaskCheckbox({ status, onChange }: TaskCheckboxProps) {
  const isPending = status === 'pending'
  const isProgress = status === 'in_progress'
  const isCompleted = status === 'completed'

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(CYCLE[status]) }}
      aria-label={status}
      className="w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center text-[8px] font-bold transition-all duration-fast ease-spring"
      style={{
        border: `2px solid ${isPending ? 'var(--border)' : 'var(--accent)'}`,
        background: isCompleted ? 'var(--accent)' : isProgress ? 'var(--accent-bg)' : 'none',
        color: isCompleted ? '#fff' : 'transparent',
      }}
    >
      {isCompleted && '✓'}
      {isProgress && <span className="text-[8px]" style={{ color: 'var(--accent)' }}>◐</span>}
    </button>
  )
}
