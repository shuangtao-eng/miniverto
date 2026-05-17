import { useTranslation } from 'react-i18next'

export function EmptyState({ onCreateProject }: { onCreateProject: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-4">
      {/* Cosmic illustration */}
      <svg width="120" height="100" viewBox="0 0 120 100" fill="none" aria-hidden="true">
        <circle cx="60" cy="50" r="18" fill="var(--accent-bg)" />
        <circle cx="60" cy="50" r="7" fill="var(--accent)" opacity="0.7" />
        <ellipse cx="60" cy="50" rx="30" ry="10" stroke="var(--accent)" strokeWidth="1.5" fill="none" strokeDasharray="3 2" opacity="0.4" />
        <ellipse cx="60" cy="50" rx="46" ry="17" stroke="var(--border)" strokeWidth="1" fill="none" strokeDasharray="4 3" opacity="0.5" />
        <circle cx="90" cy="35" r="3" fill="var(--accent)" opacity="0.5" />
        <circle cx="28" cy="62" r="2" fill="var(--accent)" opacity="0.4" />
        <circle cx="98" cy="65" r="1.5" fill="var(--text-3)" opacity="0.6" />
        <circle cx="20" cy="38" r="1.5" fill="var(--text-3)" opacity="0.5" />
        <circle cx="35" cy="22" r="1" fill="var(--accent)" opacity="0.6" />
        <circle cx="88" cy="80" r="1" fill="var(--accent)" opacity="0.5" />
        <circle cx="14" cy="55" r="0.8" fill="var(--text-3)" opacity="0.5" />
        <circle cx="105" cy="45" r="0.8" fill="var(--text-3)" opacity="0.5" />
      </svg>

      <div className="max-w-[340px]">
        <h2 className="font-display text-[22px] font-semibold text-foreground mb-2.5 tracking-[-0.3px]">
          {t('projects.empty.title')}
        </h2>
        <p className="text-sm text-fg-2 leading-relaxed">
          {t('projects.empty.description')}
        </p>
      </div>

      <button
        onClick={onCreateProject}
        className="mt-2 flex items-center gap-2 px-6 py-[11px] bg-primary text-primary-foreground rounded text-sm font-medium shadow-[0_2px_8px_rgba(196,149,106,0.3)] hover:bg-primary-hover hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(196,149,106,0.4)] transition-all duration-fast ease-spring"
      >
        <span className="text-lg leading-none">+</span>
        <span>{t('projects.empty.cta')}</span>
      </button>

      <p className="text-[11px] text-fg-3 mt-1">
        {t('projects.empty.shortcut')}
      </p>
    </div>
  )
}
