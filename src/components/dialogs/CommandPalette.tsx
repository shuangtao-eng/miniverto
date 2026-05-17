import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { useProjectStore } from '@/stores/project-store'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'

interface PaletteItem {
  icon: string
  label: string
  sub?: string
  action: string
  group: string
  kbd?: string
}

interface CommandPaletteProps {
  onClose: () => void
}

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const projects = useProjectStore((s) => s.projects)
  const openModal = useUIStore((s) => s.openModal)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const actions: PaletteItem[] = useMemo(() => [
    { icon: '+', label: t('cmd.newPlan'), kbd: '⌘N', action: 'create', group: t('cmd.groupActions') },
    { icon: '⚙', label: t('cmd.openSettings'), kbd: '⌘,', action: 'settings', group: t('cmd.groupActions') },
    { icon: '?', label: t('cmd.shortcuts'), kbd: '?', action: 'shortcuts', group: t('cmd.groupActions') },
  ], [t])

  const projectItems: PaletteItem[] = useMemo(() =>
    projects.map((p) => ({
      icon: p.emoji,
      label: p.title,
      sub: `${t(`status.${p.status}`)} · ${Math.round((p.completedTasks / Math.max(p.totalTasks, 1)) * 100)}%`,
      action: `project-${p.id}`,
      group: t('cmd.groupRecent'),
    })),
  [projects, t])

  const allItems = useMemo(() => [...actions, ...projectItems], [actions, projectItems])

  const filtered = useMemo(() => {
    if (!query) return allItems
    const q = query.toLowerCase()
    return allItems.filter((i) =>
      i.label.toLowerCase().includes(q) || i.sub?.toLowerCase().includes(q),
    )
  }, [allItems, query])

  const grouped = useMemo(() => {
    const g: Record<string, PaletteItem[]> = {}
    for (const item of filtered) {
      const arr = g[item.group] ?? (g[item.group] = [])
      arr.push(item)
    }
    return g
  }, [filtered])

  useEffect(() => { setSelected(0) }, [query])

  function handleSelect(item: PaletteItem) {
    onClose()
    if (item.action === 'create') {
      openModal('create')
    } else if (item.action === 'settings') {
      navigate({ to: '/settings' })
    } else if (item.action.startsWith('project-')) {
      const id = item.action.replace('project-', '')
      navigate({ to: '/project/$projectId', params: { projectId: id } })
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && filtered[selected]) { handleSelect(filtered[selected]) }
    if (e.key === 'Escape') onClose()
  }

  let flatIdx = -1

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[300] bg-[var(--overlay)] flex items-start justify-center pt-[120px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[540px] bg-surface rounded-xl shadow-lg overflow-hidden animate-cmd-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKey}
      >
        {/* Search input */}
        <div className="flex items-center gap-2.5 px-[18px] py-3.5 border-b border-border">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-fg-3">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('cmd.placeholder')}
            className="flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-fg-3"
          />
          <kbd className="text-[11px] px-[7px] py-[2px] bg-bg-2 border border-border rounded-[5px] text-fg-3">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[380px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-fg-3 text-[13px]">
              {t('cmd.noResults', { query })}
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div className="px-[18px] pt-2 pb-1 text-[10px] font-bold text-fg-3 uppercase tracking-[0.08em]">
                  {group}
                </div>
                {items.map((item) => {
                  flatIdx++
                  const idx = flatIdx
                  const isSel = idx === selected
                  return (
                    <div
                      key={item.action}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelected(idx)}
                      className={cn(
                        'flex items-center gap-[11px] px-[18px] py-[9px] cursor-pointer transition-colors duration-fast',
                        isSel ? 'bg-accent' : 'bg-transparent',
                      )}
                    >
                      <span
                        className={cn(
                          'w-7 h-7 rounded-[7px] flex items-center justify-center text-[13px] shrink-0 transition-colors duration-fast',
                          isSel ? 'bg-primary text-primary-foreground' : 'bg-bg-2 text-fg-2',
                        )}
                      >
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className={cn('text-[13px] transition-colors duration-fast', isSel ? 'text-accent-foreground font-medium' : 'text-foreground')}>
                          {item.label}
                        </div>
                        {item.sub && <div className="text-[11px] text-fg-3 mt-px">{item.sub}</div>}
                      </div>
                      {item.kbd && (
                        <kbd
                          className={cn(
                            'text-[10px] px-1.5 py-[2px] rounded shrink-0 transition-all duration-fast',
                            isSel
                              ? 'bg-primary border border-primary-hover text-primary-foreground'
                              : 'bg-bg-2 border border-border text-fg-3',
                          )}
                        >
                          {item.kbd}
                        </kbd>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-[18px] py-2 border-t border-border flex gap-4 text-[10px] text-fg-3">
          <span><kbd className="bg-bg-2 border border-border rounded-[3px] px-1 py-px">↑↓</kbd> {t('cmd.navigate')}</span>
          <span><kbd className="bg-bg-2 border border-border rounded-[3px] px-1 py-px">↵</kbd> {t('cmd.execute')}</span>
          <span><kbd className="bg-bg-2 border border-border rounded-[3px] px-1 py-px">Esc</kbd> {t('cmd.close')}</span>
        </div>
      </div>
    </div>
  )
}
