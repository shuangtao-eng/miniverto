import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CriticDimension } from '@/types'
import { cn } from '@/lib/utils'

interface CriticScorecardProps {
  score: number
  dimensions: CriticDimension[]
}

function scoreColor(s: number) {
  if (s >= 8) return 'text-ok'
  if (s >= 6) return 'text-warn'
  return 'text-err'
}

function barColor(s: number) {
  if (s >= 8) return 'var(--ok)'
  if (s >= 6) return 'var(--warn)'
  return 'var(--err)'
}

export function CriticScorecard({ score, dimensions }: CriticScorecardProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden mb-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn('w-full flex items-center gap-2.5 px-[18px] py-3.5 text-left cursor-pointer', open && 'border-b border-border-2')}
      >
        <div className="w-8 h-8 rounded-lg bg-warn-bg flex items-center justify-center text-[15px]">✦</div>
        <div className="flex-1">
          <div className="text-xs text-fg-3 mb-px">{t('detail.critic.title')}</div>
          <div className="text-sm font-semibold text-foreground">
            Overall score <span className={scoreColor(score)}>{score}/10</span>
          </div>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className={cn('transition-transform duration-normal', open && 'rotate-180')}
        >
          <path d="M3 5l4 4 4-4" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="px-[18px] py-3.5 flex flex-col gap-2.5">
          {dimensions.map((d) => (
            <div key={d.label} className="flex items-center gap-2.5">
              <span className="text-xs text-fg-2 w-20 shrink-0">{d.label}</span>
              <div className="flex-1 h-1.5 bg-bg-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-800 ease-out"
                  style={{ width: `${(d.score / d.maxScore) * 100}%`, background: barColor(d.score) }}
                />
              </div>
              <span className="text-xs font-semibold text-fg-2 w-6 text-right">{d.score}</span>
            </div>
          ))}
          <p className="text-[11px] text-fg-3 leading-normal mt-1 border-t border-border-2 pt-2.5">
            The plan has a clear structure and actionable task granularity. Add more applied practice in milestone 2 to strengthen hands-on ability.
          </p>
        </div>
      )}
    </div>
  )
}
