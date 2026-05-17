import { useTranslation } from 'react-i18next'
import type { Project } from '@/types'
import { ProgressRing } from '@/components/shared/ProgressRing'
import { StatusBadge } from '@/components/shared/StatusBadge'

interface ProjectCardProps {
  project: Project
  onClick: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const { t } = useTranslation()
  const pct = project.totalTasks > 0
    ? Math.round((project.completedTasks / project.totalTasks) * 100)
    : 0

  return (
    <div
      onClick={onClick}
      className="group bg-surface border border-border-2 rounded-lg px-[22px] py-5 cursor-pointer flex flex-col gap-3.5 shadow-sm hover:-translate-y-0.5 hover:shadow hover:border-border transition-all duration-normal ease-spring"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded shrink-0 bg-accent flex items-center justify-center text-lg">
          {project.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={project.status} />
          </div>
          <h3 className="text-[15px] font-semibold text-foreground font-display leading-snug truncate">
            {project.title}
          </h3>
        </div>
        <ProgressRing pct={pct} />
      </div>

      {/* Goal summary */}
      <p className="text-[13px] text-fg-2 leading-relaxed line-clamp-2">
        {project.goalSummary}
      </p>

      {/* Footer meta */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-fg-3 text-xs">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          <span>{t('projects.card.milestones', { count: project.milestoneList.length })}</span>
        </div>
        <div className="flex items-center gap-1 text-fg-3 text-xs">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="1.5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.2" /><path d="M4 6l1.5 1.5L8 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span>{t('projects.card.tasks', { completed: project.completedTasks, total: project.totalTasks })}</span>
        </div>
        {project.criticScore != null && (
          <div className="flex items-center gap-1 text-fg-3 text-xs">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.3 3.9H11l-2.9 2.1 1.1 3.9L6 8.9l-3.2 2 1.1-3.9L1 5h3.7L6 1z" fill="var(--warn)" opacity="0.8" /></svg>
            <span>{project.criticScore}/10</span>
          </div>
        )}
        <span className="ml-auto text-fg-3 text-[11px]">{project.lastActive}</span>
      </div>
    </div>
  )
}
