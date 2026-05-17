import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/stores/ui-store'

interface TopBarProps {
  title?: string
  breadcrumbs?: string[]
}

export function TopBar({ title, breadcrumbs }: TopBarProps) {
  const { t } = useTranslation()
  const isOffline = useUIStore((s) => s.isOffline)
  const openModal = useUIStore((s) => s.openModal)

  return (
    <div className="h-topbar bg-surface border-b border-border flex items-center px-5 gap-3 shrink-0">
      {/* Breadcrumbs / Title */}
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        {breadcrumbs ? (
          breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-fg-3 text-xs">/</span>}
              <span
                className={
                  i === breadcrumbs.length - 1
                    ? 'text-[13px] text-foreground font-medium truncate'
                    : 'text-[13px] text-fg-3 truncate'
                }
              >
                {crumb}
              </span>
            </span>
          ))
        ) : (
          <span className="text-sm font-medium text-foreground">{title}</span>
        )}
      </div>

      {/* Search trigger */}
      <button
        onClick={() => openModal('cmd')}
        className="flex items-center gap-1.5 py-[5px] px-2.5 bg-bg-2 border border-border rounded text-fg-3 text-xs hover:bg-bg-3 hover:border-fg-3 transition-colors duration-fast"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
        <span>{t('common.search')}</span>
        <span className="ml-1 px-[5px] py-px bg-border rounded text-[10px] font-semibold tracking-[0.02em]">⌘K</span>
      </button>

      {/* Offline indicator */}
      {isOffline && (
        <div className="flex items-center gap-[5px] px-2 py-[3px] bg-warn-bg border border-warn rounded-full text-[11px] text-warn font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-warn" />
          {t('common.offline')}
        </div>
      )}
    </div>
  )
}
