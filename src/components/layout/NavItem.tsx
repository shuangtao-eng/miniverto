import { cn } from '@/lib/utils'

interface NavItemProps {
  icon: string
  label: string
  active?: boolean
  onClick?: () => void
  badge?: number | string
  indent?: boolean
}

export function NavItem({ icon, label, active, onClick, badge, indent }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 w-full rounded-sm text-[13px] text-left transition-colors duration-fast',
        indent ? 'py-[5px] px-2 pl-7' : 'py-[5px] px-2',
        active
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-fg-2 hover:bg-bg-3',
      )}
    >
      <span className={cn('text-sm shrink-0', active ? 'opacity-100' : 'opacity-70')}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge != null && (
        <span className="text-[10px] font-semibold bg-primary text-primary-foreground rounded-full px-[5px] py-px min-w-4 text-center">
          {badge}
        </span>
      )}
    </button>
  )
}
