import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

/* ─── Skeleton primitive ─── */
function Skeleton({ w = '100%', h = 14, radius = 6 }: { w?: number | string; h?: number; radius?: number | string }) {
  return (
    <div
      className="shrink-0 bg-gradient-to-r from-bg-2 via-bg-3 to-bg-2 animate-shimmer"
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: h,
        borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
        backgroundSize: '200% 100%',
      }}
    />
  )
}

/* ─── Skeleton groups ─── */
function ProjectListSkeleton() {
  return (
    <div className="p-7">
      <div className="flex justify-between mb-7">
        <div className="flex flex-col gap-2">
          <Skeleton w={140} h={26} radius={8} />
          <Skeleton w={100} h={13} />
        </div>
        <Skeleton w={96} h={36} radius={10} />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border-2 rounded-lg p-5 flex flex-col gap-3.5">
            <div className="flex gap-3">
              <Skeleton w={40} h={40} radius={10} />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton w={60} h={12} />
                <Skeleton w="85%" h={16} />
              </div>
              <Skeleton w={36} h={36} radius="50%" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Skeleton h={12} />
              <Skeleton w="70%" h={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlanTreeSkeleton() {
  return (
    <div className="py-5 flex flex-col gap-2">
      <Skeleton h={70} radius={12} />
      {[1, 2].map((m) => (
        <div key={m}>
          <div className="p-3 bg-surface border border-border-2 rounded-[var(--radius)] flex gap-2.5 items-center mb-px">
            <Skeleton w={14} h={14} radius={4} />
            <div className="flex-1 flex flex-col gap-[5px]">
              <Skeleton w="55%" h={14} />
              <Skeleton w="35%" h={11} />
            </div>
            <Skeleton w={70} h={6} radius={99} />
          </div>
          {m === 1 && (
            <div className="bg-surface border border-border-2 border-t-0 rounded-b-[var(--radius)] py-2">
              {[1, 2, 3].map((t) => (
                <div key={t} className="flex gap-2.5 px-3.5 py-2.5 items-center">
                  <Skeleton w={18} h={18} radius="50%" />
                  <div className="flex-1 flex flex-col gap-[5px]">
                    <Skeleton w={`${50 + t * 15}%`} h={13} />
                    <Skeleton w={80} h={10} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── Error Banner ─── */
function ErrorBanner({ level = 'error', title, message, onRetry, onDismiss, detail }: {
  level?: 'error' | 'warning' | 'info'
  title: string
  message?: string
  onRetry?: () => void
  onDismiss?: () => void
  detail?: string
}) {
  const [showDetail, setShowDetail] = useState(false)
  const cfg = {
    error:   { bg: 'bg-err-bg', border: 'border-err', text: 'text-err', icon: '✕' },
    warning: { bg: 'bg-warn-bg', border: 'border-warn', text: 'text-warn', icon: '⚠' },
    info:    { bg: 'bg-info-bg', border: 'border-info', text: 'text-info', icon: 'ℹ' },
  }[level]

  return (
    <div className={cn('px-4 py-2.5 rounded-[var(--radius)] border flex flex-col gap-1.5', cfg.bg, cfg.border)}>
      <div className="flex items-center gap-2">
        <span className={cn('text-[13px] font-bold shrink-0', cfg.text)}>{cfg.icon}</span>
        <div className="flex-1">
          <span className="text-[13px] text-foreground font-medium">{title}</span>
          {message && <span className="text-xs text-fg-2 ml-1.5">{message}</span>}
        </div>
        {detail && (
          <button onClick={() => setShowDetail((v) => !v)} className="text-[11px] text-fg-3 shrink-0">
            {showDetail ? '收起' : '详情'}
          </button>
        )}
        {onRetry && (
          <button onClick={onRetry} className={cn('text-xs font-medium px-2.5 py-[3px] bg-white/60 rounded-md border shrink-0', cfg.text, cfg.border)}>
            重试
          </button>
        )}
        {onDismiss && (
          <button onClick={onDismiss} className="text-fg-3 text-[13px] shrink-0">✕</button>
        )}
      </div>
      {showDetail && detail && (
        <div className="px-2.5 py-2 bg-white/50 rounded-md font-mono text-[11px] text-fg-2 leading-[1.6]">
          {detail}
        </div>
      )}
    </div>
  )
}

/* ─── Offline strip ─── */
function OfflineStrip() {
  return (
    <div className="px-5 py-2 bg-warn-bg border-b border-warn flex items-center gap-2 text-xs text-warn">
      <div className="w-[7px] h-[7px] rounded-full bg-warn shrink-0" />
      <span><strong>离线模式</strong> — 可浏览和编辑，Miniverto 生成功能暂不可用。</span>
      <span className="ml-auto text-fg-3 text-[11px]">网络恢复后自动启用</span>
    </div>
  )
}

/* ─── DisabledButton with tooltip ─── */
function DisabledButton({ label, tooltip }: { label: string; tooltip: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-block">
      <button
        disabled
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="px-4 py-2 rounded-[var(--radius)] bg-bg-3 border border-border text-[13px] text-fg-3 cursor-not-allowed opacity-60"
      >
        {label}
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-foreground text-fg-inv text-[11px] px-2.5 py-[5px] rounded-[7px] whitespace-nowrap z-10 shadow">
          {tooltip}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground" style={{ clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-fg-3 uppercase tracking-[0.06em] mb-3">{title}</h3>
      {children}
    </div>
  )
}

/* ─── Main showcase page ─── */
export function StatesPage() {
  const [activeState, setActiveState] = useState('loading')
  const [dismissedErrors, setDismissedErrors] = useState<Record<string, boolean>>({})
  const [loadingPhase, setLoadingPhase] = useState<'skeleton' | 'content'>('skeleton')
  const [loadingPct, setLoadingPct] = useState(0)

  useEffect(() => {
    if (activeState !== 'loading') return
    setLoadingPhase('skeleton')
    setLoadingPct(0)
    let pct = 0
    const bar = setInterval(() => {
      pct += 4 + Math.random() * 3
      if (pct >= 100) {
        pct = 100
        clearInterval(bar)
        setLoadingPct(100)
        setTimeout(() => setLoadingPhase('content'), 200)
      } else {
        setLoadingPct(pct)
      }
    }, 80)
    return () => clearInterval(bar)
  }, [activeState])

  function restartLoading() {
    setLoadingPhase('skeleton')
    setLoadingPct(0)
    setActiveState('_')
    setTimeout(() => setActiveState('loading'), 20)
  }

  const tabs = [
    { id: 'loading', label: '⏳ Loading' },
    { id: 'empty', label: '○ Empty' },
    { id: 'error', label: '⚠ Error' },
    { id: 'offline', label: '◯ Offline' },
  ]

  return (
    <div className="h-full overflow-y-auto">
      {/* Tabs */}
      <div className="px-8 pt-5 flex gap-2 border-b border-border bg-surface">
        {tabs.map((b) => (
          <button
            key={b.id}
            onClick={() => setActiveState(b.id)}
            className={cn(
              'px-4 py-2 rounded-t-lg text-xs -mb-px transition-all duration-fast border-b-2',
              activeState === b.id
                ? 'font-semibold text-foreground bg-background border-primary'
                : 'text-fg-3 bg-transparent border-transparent hover:text-fg-2',
            )}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="px-8 py-7 flex flex-col gap-7">
        {/* LOADING */}
        {activeState === 'loading' && (
          <>
            <div className="flex items-center gap-3.5 px-4 py-3 bg-surface border border-border rounded-[var(--radius)]">
              <div className="flex-1 h-1 bg-bg-2 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-[width] duration-200 ease-out" style={{ width: `${loadingPct}%` }} />
              </div>
              <span className="text-xs text-fg-3 shrink-0 w-20">
                {loadingPhase === 'skeleton' ? `加载中 ${Math.round(loadingPct)}%` : '✓ 加载完成'}
              </span>
              <button onClick={restartLoading} className="text-[11px] text-primary px-2.5 py-[3px] bg-accent rounded-md shrink-0">
                重新演示
              </button>
            </div>

            <Section title="Project List">
              {loadingPhase === 'skeleton' ? <ProjectListSkeleton /> : (
                <div className="py-4 text-center text-fg-3 text-sm">[项目列表内容已加载]</div>
              )}
            </Section>
            <Section title="Plan Tree">
              {loadingPhase === 'skeleton' ? <PlanTreeSkeleton /> : (
                <div className="py-4 text-center text-fg-3 text-sm">[计划树内容已加载]</div>
              )}
            </Section>
          </>
        )}

        {/* EMPTY */}
        {activeState === 'empty' && (
          <>
            <Section title="Search — No Results">
              <div className="flex flex-col items-center py-10 text-center gap-3">
                <div className="text-4xl opacity-40">○</div>
                <h3 className="text-base font-semibold text-foreground">找不到"量子力学"</h3>
                <p className="text-[13px] text-fg-3 max-w-[260px] leading-[1.6]">试试其他关键词，或者检查一下拼写</p>
              </div>
            </Section>
            <Section title="Empty Milestone">
              <div className="bg-surface border border-border-2 rounded-[var(--radius)] flex flex-col items-center py-8 text-center gap-2.5">
                <div className="text-[28px] opacity-30">✦</div>
                <p className="text-[13px] text-fg-3">此里程碑暂无任务</p>
              </div>
            </Section>
          </>
        )}

        {/* ERROR */}
        {activeState === 'error' && (
          <>
            <Section title="Error Banners">
              <div className="flex flex-col gap-2">
                {!dismissedErrors['net'] && (
                  <ErrorBanner level="error" title="网络连接失败" message="请检查网络后重试" onRetry={() => {}} onDismiss={() => setDismissedErrors((v) => ({ ...v, net: true }))} />
                )}
                {!dismissedErrors['rate'] && (
                  <ErrorBanner level="warning" title="提供商限流" message="已自动重试 3 次仍失败，10 分钟后再试" onDismiss={() => setDismissedErrors((v) => ({ ...v, rate: true }))} />
                )}
                {!dismissedErrors['schema'] && (
                  <ErrorBanner
                    level="error" title="Miniverto 输出格式异常" message="已重试 2 次仍失败"
                    onRetry={() => {}} onDismiss={() => setDismissedErrors((v) => ({ ...v, schema: true }))}
                    detail={'SchemaValidationError: missing required field "milestones"\n  at path: $.plan\n  attempt: 2/2'}
                  />
                )}
                <ErrorBanner level="info" title="上下文超出限制" message="可尝试切换长上下文模型" />
              </div>
            </Section>
            {Object.keys(dismissedErrors).length > 0 && (
              <button onClick={() => setDismissedErrors({})} className="self-start text-[11px] text-fg-3 px-2.5 py-1 rounded-md bg-bg-2 border border-border">
                重置 Banner
              </button>
            )}
          </>
        )}

        {/* OFFLINE */}
        {activeState === 'offline' && (
          <>
            <Section title="离线提示条">
              <div className="rounded-[var(--radius)] overflow-hidden border border-border">
                <OfflineStrip />
                <div className="p-5 bg-surface flex flex-col gap-2">
                  <p className="text-xs text-fg-3 mb-2">离线时，Miniverto 生成相关按钮全部禁用并有 tooltip 说明</p>
                  <div className="flex gap-2 flex-wrap">
                    <DisabledButton label="+ 新建计划" tooltip="需要网络连接才能创建" />
                    <DisabledButton label="重新规划" tooltip="需要网络连接才能使用 Miniverto 规划" />
                    <DisabledButton label="Miniverto 改写任务" tooltip="需要网络连接才能使用 Miniverto 生成功能" />
                  </div>
                </div>
              </div>
            </Section>
            <Section title="离线时操作状态">
              <div className="flex flex-col gap-2">
                {[
                  { label: '浏览所有项目', ok: true },
                  { label: '勾选任务 / 更改状态', ok: true },
                  { label: '写学习笔记', ok: true },
                  { label: '新建计划', ok: false },
                  { label: '重新规划', ok: false },
                  { label: 'Miniverto 改写任务', ok: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 px-3.5 py-[9px] bg-surface border border-border-2 rounded-lg">
                    <span className={cn('text-[13px] font-bold', item.ok ? 'text-ok' : 'text-err')}>
                      {item.ok ? '✓' : '✕'}
                    </span>
                    <span className={cn('text-[13px]', item.ok ? 'text-foreground' : 'text-fg-3')}>
                      {item.label}
                    </span>
                    {!item.ok && (
                      <span className="ml-auto text-[10px] text-fg-3 px-[7px] py-px bg-bg-2 rounded-full">离线禁用</span>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  )
}
