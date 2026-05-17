import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface DiffItemData {
  id: string
  type: 'added' | 'removed' | 'modified'
  milestone: string
  before?: string
  after?: string
  reason: string
}

const DIFF_DATA: DiffItemData[] = [
  {
    id: 'd1', type: 'modified', milestone: '里程碑 1：Rust 基础语法',
    before: '阅读《The Rust Programming Language》第 1-6 章（预计 180 分钟）',
    after: '阅读《The Rust Programming Language》第 1-4 章，跳过第 5-6 章（预计 120 分钟）',
    reason: '你反馈进度比预期慢 30%，压缩阅读量以匹配实际节奏',
  },
  {
    id: 'd2', type: 'added', milestone: '里程碑 1：Rust 基础语法',
    after: '完成 Exercism Rust 课道 1-5（新增，替代部分 Rustlings）',
    reason: '你提到更喜欢有即时反馈的练习平台',
  },
  {
    id: 'd3', type: 'removed', milestone: '里程碑 2：进阶特性',
    before: '对比 Rust 和 Python 的错误处理哲学（反思类，30 分钟）',
    reason: 'Critic 评分显示此任务与里程碑目标关联度较低，可选做',
  },
  {
    id: 'd4', type: 'modified', milestone: '里程碑 2：进阶特性',
    before: '实现一个带错误处理的 CSV 解析器（预计 150 分钟）',
    after: '实现一个带错误处理的 CSV 解析器（调整为 120 分钟，聚焦核心功能）',
    reason: '根据你已有的 Python 文件处理经验，时间估算可压缩',
  },
  {
    id: 'd5', type: 'added', milestone: '里程碑 3：实战 CLI 工具',
    after: '里程碑检查点：完成 mini CLI demo 并录屏（新增，20 分钟）',
    reason: '增加可见的阶段性产出，有助于保持动力',
  },
]

const TYPE_CONFIG = {
  added:    { label: '新增', icon: '＋', colorClass: 'text-ok',   bgClass: 'bg-ok-bg',   borderColor: 'var(--ok)' },
  removed:  { label: '删除', icon: '－', colorClass: 'text-err',  bgClass: 'bg-err-bg',  borderColor: 'var(--err)' },
  modified: { label: '修改', icon: '⟳',  colorClass: 'text-warn', bgClass: 'bg-warn-bg', borderColor: 'var(--warn)' },
} as const

const QUICK_FEEDBACK = [
  'replan.chips.slow',
  'replan.chips.hard',
  'replan.chips.moreTime',
  'replan.chips.changeFocus',
]

function DiffItem({ item, checked, onToggle }: { item: DiffItemData; checked: boolean; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = TYPE_CONFIG[item.type]

  return (
    <div
      className={cn('rounded-[var(--radius)] overflow-hidden transition-all duration-fast', checked ? cfg.bgClass : 'bg-bg-2')}
      style={{
        border: `1px solid ${checked ? cfg.borderColor : 'var(--border)'}`,
        opacity: checked ? 1 : 0.55,
      }}
    >
      <div className="flex items-start gap-2.5 px-3.5 py-3">
        {/* Checkbox */}
        <div
          onClick={onToggle}
          className="w-[18px] h-[18px] rounded-[5px] shrink-0 mt-px flex items-center justify-center cursor-pointer transition-all duration-fast ease-spring"
          style={{
            border: `2px solid ${checked ? cfg.borderColor : 'var(--border)'}`,
            background: checked ? cfg.borderColor : 'transparent',
          }}
        >
          {checked && (
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
              <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        {/* Type badge */}
        <span
          className={cn('text-[10px] font-bold px-[7px] py-[2px] rounded-full shrink-0 mt-px', cfg.colorClass, cfg.bgClass)}
          style={{ border: `1px solid ${cfg.borderColor}` }}
        >
          {cfg.icon} {cfg.label}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-fg-3 mb-[5px]">{item.milestone}</div>

          {item.type === 'modified' && (
            <div className="flex flex-col gap-[5px]">
              <div className="flex gap-[7px] items-start">
                <span className="text-[10px] font-semibold text-err bg-err-bg px-1.5 py-px rounded shrink-0 mt-px">前</span>
                <p className="text-xs text-fg-2 leading-normal line-through opacity-70">{item.before}</p>
              </div>
              <div className="flex gap-[7px] items-start">
                <span className="text-[10px] font-semibold text-ok bg-ok-bg px-1.5 py-px rounded shrink-0 mt-px">后</span>
                <p className="text-xs text-foreground leading-normal">{item.after}</p>
              </div>
            </div>
          )}
          {item.type === 'added' && (
            <p className="text-xs text-foreground leading-normal">{item.after}</p>
          )}
          {item.type === 'removed' && (
            <p className="text-xs text-fg-2 leading-normal line-through opacity-70">{item.before}</p>
          )}
        </div>

        {/* Expand reason */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-fg-3 p-[2px] rounded shrink-0 hover:text-fg-2"
          title="Miniverto 理由"
        >
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            className={cn('transition-transform duration-normal', expanded && 'rotate-180')}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="px-3.5 pb-3 pt-2 ml-[44px] border-t border-border-2 bg-white/50 flex gap-[7px] items-start">
          <span className="text-[13px] shrink-0">💡</span>
          <p className="text-[11px] text-fg-2 leading-[1.55]"><strong>Miniverto 理由：</strong>{item.reason}</p>
        </div>
      )}
    </div>
  )
}

interface ReplanDialogProps {
  onClose: () => void
  onApply?: (count: number) => void
}

export function ReplanDialog({ onClose, onApply }: ReplanDialogProps) {
  const { t } = useTranslation()
  const [phase, setPhase] = useState<'input' | 'loading' | 'diff'>('input')
  const [feedback, setFeedback] = useState('')
  const [loadingPct, setLoadingPct] = useState(0)
  const [checks, setChecks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(DIFF_DATA.map((d) => [d.id, d.type !== 'removed'])),
  )
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startReplan() {
    setPhase('loading')
    setLoadingPct(0)
    let pct = 0
    timerRef.current = setInterval(() => {
      pct += 2 + Math.random() * 3
      if (pct >= 100) {
        pct = 100
        if (timerRef.current) clearInterval(timerRef.current)
        setLoadingPct(100)
        setTimeout(() => setPhase('diff'), 400)
      } else {
        setLoadingPct(pct)
      }
    }, 100)
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const checkedCount = Object.values(checks).filter(Boolean).length
  const added = DIFF_DATA.filter((d) => d.type === 'added').length
  const removed = DIFF_DATA.filter((d) => d.type === 'removed').length
  const modified = DIFF_DATA.filter((d) => d.type === 'modified').length

  const PROGRESS_STATS = [
    { label: t('replan.statDone'), value: '5/12', color: 'text-ok' },
    { label: t('replan.statInProgress'), value: '1', color: 'text-warn' },
    { label: t('replan.statRemaining'), value: '3.5 周', color: 'text-fg-2' },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[150] bg-[var(--overlay)] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[620px] bg-surface rounded-xl shadow-lg flex flex-col max-h-[calc(100vh-48px)] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-warn-bg flex items-center justify-center text-base">⟳</div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-foreground font-display tracking-[-0.2px]">{t('replan.title')}</h2>
            <p className="text-xs text-fg-3 mt-0.5">
              {phase === 'input' && t('replan.inputHint')}
              {phase === 'loading' && t('replan.loadingHint')}
              {phase === 'diff' && t('replan.diffSummary', { total: DIFF_DATA.length, added, modified, removed })}
            </p>
          </div>
          <button onClick={onClose} className="text-fg-3 p-1.5 rounded-lg hover:text-foreground" aria-label={t('common.close')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Input phase */}
          {phase === 'input' && (
            <div className="px-6 py-[22px] flex flex-col gap-4">
              <div className="flex gap-2.5">
                {PROGRESS_STATS.map((s) => (
                  <div key={s.label} className="flex-1 px-3 py-3 bg-bg-2 rounded-[var(--radius)] text-center">
                    <div className={cn('text-lg font-bold font-display tracking-[-0.3px]', s.color)}>{s.value}</div>
                    <div className="text-[11px] text-fg-3 mt-[3px]">{s.label}</div>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-[13px] font-medium text-foreground block mb-[7px]">{t('replan.feedbackLabel')}</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={t('replan.feedbackPlaceholder')}
                  rows={4}
                  className="w-full px-[13px] py-[11px] bg-bg-2 border border-border rounded-[var(--radius)] text-[13px] text-foreground leading-[1.65] resize-none outline-none transition-colors duration-fast focus:border-primary"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {QUICK_FEEDBACK.map((key) => (
                  <button
                    key={key}
                    onClick={() => setFeedback(t(key))}
                    className="px-3 py-[5px] rounded-full text-[11px] bg-bg-2 border border-border text-fg-2 hover:bg-accent hover:border-accent-raw hover:text-accent-foreground transition-all duration-fast"
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading phase */}
          {phase === 'loading' && (
            <div className="px-6 py-12 flex flex-col items-center gap-5 text-center">
              <div className="relative w-16 h-16">
                <svg width="64" height="64" viewBox="0 0 64 64" className="animate-spin">
                  <circle cx="32" cy="32" r="28" stroke="var(--border)" strokeWidth="3" fill="none" />
                  <circle
                    cx="32" cy="32" r="28" stroke="var(--accent)" strokeWidth="3" fill="none"
                    strokeDasharray="176"
                    strokeDashoffset={176 - (loadingPct / 100) * 176}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)"
                    className="transition-[stroke-dashoffset] duration-300 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-primary">
                  {Math.round(loadingPct)}%
                </div>
              </div>
              <div>
                <p className="text-sm text-foreground font-medium mb-1.5">{t('replan.loadingTitle')}</p>
                <p className="text-xs text-fg-3">{t('replan.loadingDetail')}</p>
              </div>
            </div>
          )}

          {/* Diff phase */}
          {phase === 'diff' && (
            <div className="px-6 py-[18px] flex flex-col gap-2.5">
              <div className="flex gap-3 py-2 text-[11px] text-fg-3">
                {Object.entries(TYPE_CONFIG).map(([k, c]) => (
                  <span key={k} className="flex items-center gap-1">
                    <span className={cn('font-bold', c.colorClass)}>{c.icon}</span> {c.label}
                  </span>
                ))}
                <span className="ml-auto">{t('replan.selectChanges')}</span>
              </div>

              {DIFF_DATA.map((item) => (
                <DiffItem
                  key={item.id}
                  item={item}
                  checked={checks[item.id] ?? false}
                  onToggle={() => setChecks((v) => ({ ...v, [item.id]: !v[item.id] }))}
                />
              ))}

              <div className="px-3.5 py-2.5 bg-info-bg border border-info rounded-lg text-xs text-info">
                ℹ {t('replan.atomicNote')}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-border flex justify-between items-center">
          <button
            onClick={onClose}
            className="text-xs text-fg-3 px-3.5 py-[7px] rounded-lg hover:bg-bg-2 hover:text-fg-2 transition-colors duration-fast"
          >
            {phase === 'diff' ? t('replan.discardAll') : t('common.cancel')}
          </button>

          <div className="flex gap-2">
            {phase === 'input' && (
              <button
                onClick={startReplan}
                className="px-[22px] py-[9px] rounded-[var(--radius)] bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary-hover hover:-translate-y-px transition-all duration-fast ease-spring shadow-[0_2px_8px_rgba(196,149,106,0.3)]"
              >
                {t('replan.start')}
              </button>
            )}
            {phase === 'diff' && (
              <button
                onClick={() => { onApply?.(checkedCount); onClose() }}
                disabled={checkedCount === 0}
                className={cn(
                  'px-[22px] py-[9px] rounded-[var(--radius)] text-[13px] font-medium transition-colors duration-fast',
                  checkedCount > 0
                    ? 'bg-primary text-primary-foreground hover:bg-primary-hover cursor-pointer'
                    : 'bg-border text-fg-3 cursor-not-allowed',
                )}
              >
                {t('replan.applyChanges', { count: checkedCount })}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
