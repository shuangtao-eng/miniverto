import { useTranslation } from 'react-i18next'
import type { ProjectStatus } from '@/types'
import { cn } from '@/lib/utils'

const styleMap: Record<ProjectStatus, string> = {
  active: 'bg-ok-bg text-ok',
  completed: 'bg-accent text-accent-foreground',
  archived: 'bg-bg-3 text-fg-3',
  paused: 'bg-warn-bg text-warn',
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useTranslation()
  return (
    <span className={cn('text-[10px] font-semibold px-[7px] py-[2px] rounded-full tracking-[0.02em]', styleMap[status])}>
      {t(`status.${status}`)}
    </span>
  )
}
