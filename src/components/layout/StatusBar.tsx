import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/stores/ui-store'

export function StatusBar() {
  const { t } = useTranslation()
  const isOffline = useUIStore((s) => s.isOffline)
  const isGenerating = useUIStore((s) => s.isGenerating)
  const generationText = useUIStore((s) => s.generationText)
  const generationProgress = useUIStore((s) => s.generationProgress)

  return (
    <div className="h-statusbar bg-bg-2 border-t border-border flex items-center px-4 gap-4 text-[11px] text-fg-3 shrink-0 select-none">
      {/* LLM provider */}
      <div className="flex items-center gap-[5px]">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" fill="var(--accent-bg)" stroke="var(--accent)" strokeWidth="1" />
          <circle cx="5" cy="5" r="1.5" fill="var(--accent)" />
        </svg>
        <span>Miniverto · GPT-4o</span>
      </div>

      {/* Generation progress */}
      {isGenerating && (
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 max-w-40 h-[3px] bg-bg-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
          <span className="text-fg-2">{generationText || t('common.generating')}</span>
        </div>
      )}

      {/* Online status */}
      <div className="ml-auto flex items-center gap-1.5">
        <div
          className="w-1.5 h-1.5 rounded-full transition-colors duration-500"
          style={{ background: isOffline ? 'var(--text-3)' : 'var(--ok)' }}
        />
        <span>{isOffline ? t('common.offline') : t('common.online')}</span>
      </div>
    </div>
  )
}
