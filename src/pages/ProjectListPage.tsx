import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { useProjectStore } from '@/stores/project-store'
import { useUIStore } from '@/stores/ui-store'
import { ProjectCard } from '@/components/project/ProjectCard'
import { EmptyState } from '@/components/project/EmptyState'
import type { ProjectStatus } from '@/types'

type FilterKey = 'all' | ProjectStatus

export function ProjectListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const projects = useProjectStore((s) => s.projects)
  const openModal = useUIStore((s) => s.openModal)
  const [filter, setFilter] = useState<FilterKey>('all')

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: t('projects.filters.all') },
    { key: 'active', label: t('projects.filters.active') },
    { key: 'completed', label: t('projects.filters.completed') },
    { key: 'archived', label: t('projects.filters.archived') },
  ]

  const visible = filter === 'all' ? projects : projects.filter((p) => p.status === filter)
  const activeCount = projects.filter((p) => p.status === 'active').length

  const handleCreate = () => openModal('create')
  const handleOpen = (id: string) => void navigate({ to: '/project/$projectId', params: { projectId: id } })

  return (
    <div className="h-full overflow-y-auto px-8 py-7 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-[26px] font-bold text-foreground tracking-[-0.5px] mb-1">
            {t('projects.title')}
          </h1>
          <p className="text-[13px] text-fg-3">
            {projects.length > 0
              ? t('projects.countSummary', { active: activeCount, total: projects.length })
              : t('projects.noPlans')}
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-[7px] px-[18px] py-[9px] bg-primary text-primary-foreground rounded text-[13px] font-medium shadow-[0_2px_6px_rgba(196,149,106,0.25)] hover:bg-primary-hover hover:-translate-y-px transition-all duration-fast ease-spring"
        >
          <span className="text-[17px] leading-none">+</span>
          <span>{t('projects.new')}</span>
        </button>
      </div>

      {/* Filter pills */}
      {projects.length > 0 && (
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={
                filter === f.key
                  ? 'px-[13px] py-[5px] rounded-full text-xs font-semibold bg-accent text-accent-foreground border border-accent-raw transition-all duration-fast'
                  : 'px-[13px] py-[5px] rounded-full text-xs bg-bg-2 text-fg-2 border border-border hover:bg-bg-3 transition-all duration-fast'
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {visible.length === 0 && projects.length === 0 ? (
        <EmptyState onCreateProject={handleCreate} />
      ) : visible.length === 0 ? (
        <div className="text-center py-[60px] text-fg-3 text-sm">
          {t('projects.noFilter')}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} onClick={() => handleOpen(p.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
