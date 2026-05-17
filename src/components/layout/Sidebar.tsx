import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useProjectStore } from '@/stores/project-store'
import { Logo } from './Logo'
import { NavItem } from './NavItem'

export function Sidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggle = useUIStore((s) => s.toggleSidebar)
  const projects = useProjectStore((s) => s.projects)

  const currentPath = location.pathname
  const isActive = (path: string) => currentPath === path
  const isProjectActive = (id: string) => currentPath === `/project/${id}`

  const mainNav = [
    { icon: 'P', path: '/', title: t('nav.allProjects') },
    { icon: 'M', path: '/materials', title: t('nav.materials') },
    { icon: 'N', path: '/notes', title: '知识库' },
    { icon: 'S', path: '/states', title: t('nav.states') },
  ]

  return (
    <div
      className={cn(
        'h-full flex flex-col shrink-0 select-none bg-bg-2 border-r border-border overflow-hidden transition-all duration-normal ease-out',
        collapsed ? 'w-[52px] min-w-[52px]' : 'w-[220px] min-w-[220px]',
      )}
    >
      <div
        className={cn(
          'h-topbar flex items-center shrink-0 border-b border-border gap-2',
          collapsed ? 'justify-center px-2' : 'px-3.5',
        )}
      >
        {collapsed ? (
          <button
            onClick={toggle}
            title={t('common.expandSidebar')}
            className="w-8 h-8 flex items-center justify-center text-fg-3 rounded-lg hover:text-foreground hover:bg-bg-3 transition-colors duration-fast"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <>
            <Logo />
            <button
              onClick={toggle}
              title={t('common.collapseSidebar')}
              className="ml-auto w-[26px] h-[26px] flex items-center justify-center text-fg-3 rounded-sm hover:text-foreground hover:bg-bg-3 transition-colors duration-fast"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div className={cn('flex-1 overflow-y-auto flex flex-col gap-px', collapsed ? 'p-1.5' : 'p-2')}>
        {collapsed ? (
          <>
            {[...mainNav, { icon: 'G', path: '/settings', title: t('nav.settings') }].map(({ icon, path, title }) => (
              <button
                key={path}
                onClick={() => void navigate({ to: path })}
                title={title}
                className={cn(
                  'w-9 h-9 rounded-sm text-[15px] flex items-center justify-center transition-colors duration-fast',
                  isActive(path) ? 'bg-accent text-accent-foreground' : 'text-fg-2 hover:bg-bg-3',
                )}
              >
                {icon}
              </button>
            ))}
          </>
        ) : (
          <>
            {mainNav.map((item) => (
              <NavItem
                key={item.path}
                icon={item.icon}
                label={item.title}
                active={isActive(item.path)}
                onClick={() => void navigate({ to: item.path })}
              />
            ))}

            {projects.length > 0 && (
              <>
                <div className="px-2 pt-3 pb-1 text-[11px] font-semibold text-fg-3 uppercase tracking-[0.05em]">
                  {t('nav.recentProjects')}
                </div>
                {projects.slice(0, 5).map((project) => (
                  <NavItem
                    key={project.id}
                    icon={project.emoji}
                    label={project.title}
                    active={isProjectActive(project.id)}
                    onClick={() => void navigate({ to: '/project/$projectId', params: { projectId: project.id } })}
                    indent
                  />
                ))}
              </>
            )}

            <div className="flex-1" />

            <div className="border-t border-border pt-2 mt-2 flex flex-col gap-px">
              <NavItem icon="G" label={t('nav.settings')} active={isActive('/settings')} onClick={() => void navigate({ to: '/settings' })} />
              <NavItem icon="?" label={t('nav.shortcuts')} onClick={() => useUIStore.getState().openModal('cmd')} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
