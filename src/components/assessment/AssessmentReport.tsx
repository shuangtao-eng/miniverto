import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { AssessmentType } from '@/types'
import { cn } from '@/lib/utils'

const DIMENSIONS = [
  { label: '所有权与借用', baseline: 15, current: 78 },
  { label: '类型系统', baseline: 30, current: 72 },
  { label: '错误处理', baseline: 20, current: 65 },
  { label: '迭代器与闭包', baseline: 10, current: 55 },
  { label: '整体概念理解', baseline: 22, current: 74 },
]

const TYPE_LABELS: Record<AssessmentType, string> = {
  baseline: '基线评估',
  milestone: '里程碑评估',
  final: '最终评估',
}

function GainBar({ dim, animate }: { dim: typeof DIMENSIONS[number]; animate: boolean }) {
  const gain = dim.current - dim.baseline
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-fg-2 font-medium">{dim.label}</span>
        <span className="text-xs text-ok font-bold">+{gain}%</span>
      </div>
      <div className="relative h-5">
        <div className="absolute inset-0 bg-bg-2 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 bottom-0 bg-border rounded-full transition-[width] duration-800 ease-out"
            style={{ width: animate ? `${dim.baseline}%` : 0 }}
          />
          <div
            className="absolute left-0 top-0 bottom-0 rounded-full opacity-85 transition-[width] duration-1100 ease-out"
            style={{
              width: animate ? `${dim.current}%` : 0,
              background: 'linear-gradient(90deg, var(--ok) 0%, var(--accent) 100%)',
              transitionDelay: '150ms',
            }}
          />
        </div>
        <div className="absolute inset-0 flex items-center px-2 justify-between">
          <span className="text-[9px] font-bold text-white/90">基线 {dim.baseline}%</span>
          <span className="text-[9px] font-bold text-white/90">当前 {dim.current}%</span>
        </div>
      </div>
    </div>
  )
}

interface AssessmentReportProps {
  type?: AssessmentType
  score?: { correct: number; total: number }
  onClose: () => void
  onContinue: () => void
}

export function AssessmentReport({ type = 'milestone', score, onClose, onContinue }: AssessmentReportProps) {
  const { t } = useTranslation()
  const [animate, setAnimate] = useState(false)
  useEffect(() => { setTimeout(() => setAnimate(true), 200) }, [])

  const correct = score?.correct ?? 4
  const total = score?.total ?? 5
  const pct = Math.round((correct / total) * 100)
  const totalGain = Math.round(DIMENSIONS.reduce((s, d) => s + (d.current - d.baseline), 0) / DIMENSIONS.length)

  const SCORE_CARDS = [
    {
      label: t('assess.report.score'),
      value: `${pct}%`,
      sub: t('assess.report.scoreSub', { correct, total }),
      color: pct >= 80 ? 'text-ok' : pct >= 60 ? 'text-warn' : 'text-err',
    },
    {
      label: t('assess.report.avgGain'),
      value: `+${totalGain}%`,
      sub: t('assess.report.vsBaseline'),
      color: 'text-ok',
    },
    {
      label: t('assess.report.strongest'),
      value: '所有权',
      sub: '基线 15% → 现在 78%',
      color: 'text-accent-text',
    },
  ]

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[150] bg-background overflow-y-auto animate-fade-in">
      <div className="max-w-[600px] mx-auto px-6 pt-12 pb-16">
        {/* Header */}
        <div className="text-center mb-9">
          <div className="w-[72px] h-[72px] rounded-full bg-accent mx-auto mb-4 flex items-center justify-center text-[32px]">
            ✦
          </div>
          <h1 className="text-[26px] font-bold text-foreground font-display tracking-[-0.4px] mb-2">
            {TYPE_LABELS[type]}{t('assess.report.complete')}
          </h1>
          <p className="text-sm text-fg-2">学习 Rust 系统编程 · 里程碑 1</p>
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          {SCORE_CARDS.map((s) => (
            <div key={s.label} className="px-4 py-4 bg-surface border border-border rounded-lg text-center">
              <div className={cn('text-[22px] font-extrabold font-display tracking-[-0.5px] mb-1', s.color)}>
                {s.value}
              </div>
              <div className="text-[11px] font-semibold text-foreground mb-[2px]">{s.label}</div>
              <div className="text-[10px] text-fg-3">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Gain chart */}
        <div className="bg-surface border border-border rounded-lg px-[22px] py-5 mb-5">
          <div className="flex items-center gap-2 mb-[18px]">
            <h3 className="text-sm font-semibold text-foreground">{t('assess.report.gainTitle')}</h3>
            <div className="flex gap-2.5 ml-auto text-[10px] text-fg-3">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-[3px] bg-border rounded-full" />{t('assess.report.baseline')}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-[3px] rounded-full" style={{ background: 'linear-gradient(90deg,var(--ok),var(--accent))' }} />{t('assess.report.current')}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            {DIMENSIONS.map((d) => <GainBar key={d.label} dim={d} animate={animate} />)}
          </div>
        </div>

        {/* Miniverto analysis */}
        <div className="bg-accent border border-accent-raw rounded-lg px-[18px] py-4 mb-7">
          <div className="text-[11px] font-bold text-accent-foreground mb-2 uppercase tracking-[0.05em]">
            {t('assess.report.aiAnalysis')}
          </div>
          <p className="text-[13px] text-foreground leading-[1.7]">
            里程碑 1 核心概念掌握情况良好，<strong>所有权与借用</strong>的增益最为显著（+63%）。
            <strong>迭代器与闭包</strong>仍是薄弱环节（55%），建议在里程碑 2 增加相关练习。
            整体节奏符合预期，可以继续推进。
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 justify-center">
          <button
            onClick={onClose}
            className="px-[22px] py-2.5 rounded-[var(--radius)] bg-bg-2 border border-border text-[13px] text-fg-2 hover:bg-bg-3 hover:text-foreground transition-all duration-fast"
          >
            {t('assess.report.viewDetail')}
          </button>
          <button
            onClick={onContinue}
            className="px-6 py-2.5 rounded-[var(--radius)] bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary-hover hover:-translate-y-px transition-all duration-fast shadow-[0_2px_8px_rgba(196,149,106,0.3)]"
          >
            {t('assess.report.continue')}
          </button>
        </div>
      </div>
    </div>
  )
}
