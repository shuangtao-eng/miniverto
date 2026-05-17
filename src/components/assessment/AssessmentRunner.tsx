import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Logo } from '@/components/layout/Logo'
import type { AssessmentType } from '@/types'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  kind: 'mcq' | 'short' | 'truefalse'
  question: string
  options?: { id: string; text: string }[]
  correct?: string | boolean
  explanation?: string
  sampleAnswer?: string
  placeholder?: string
}

const QUESTIONS: Question[] = [
  {
    id: 'q1', kind: 'mcq',
    question: '以下哪段 Rust 代码会导致编译错误？',
    options: [
      { id: 'a', text: 'let x = 5; let y = x; println!("{}", x);' },
      { id: 'b', text: 'let s = String::from("hello"); let t = s; println!("{}", t);' },
      { id: 'c', text: 'let s = String::from("hello"); let t = &s; println!("{} {}", s, t);' },
      { id: 'd', text: 'let mut x = 5; x = 6; println!("{}", x);' },
    ],
    correct: 'b',
    explanation: 'String 实现了 Move 语义，所有权转移给 t 后，s 不再有效。i32 实现了 Copy trait，所以选项 A 没问题。',
  },
  {
    id: 'q2', kind: 'mcq',
    question: 'Rust 中 &str 和 String 的核心区别是什么？',
    options: [
      { id: 'a', text: '&str 是可变的，String 是不可变的' },
      { id: 'b', text: '&str 是字符串切片（借用），String 是堆上拥有的字符串' },
      { id: 'c', text: '两者完全相同，只是别名' },
      { id: 'd', text: '&str 只能存储 ASCII，String 支持 Unicode' },
    ],
    correct: 'b',
    explanation: '&str 是指向某处字符串数据的切片引用，不拥有数据；String 是在堆上分配的可增长字符串，拥有数据所有权。',
  },
  {
    id: 'q3', kind: 'short',
    question: '请用自己的话解释 Rust 的"借用检查器"（Borrow Checker）解决了什么问题？',
    placeholder: '写 2-3 句话即可，不需要代码…',
    sampleAnswer: '借用检查器在编译期保证不会同时存在多个可变引用或可变引用与不可变引用共存，从而在不使用 GC 的前提下避免数据竞争和悬垂指针。',
  },
  {
    id: 'q4', kind: 'truefalse',
    question: '在 Rust 中，一个变量可以同时拥有多个可变引用（&mut T）。',
    correct: false,
    explanation: '不对。Rust 的借用规则规定：同一时刻只能有一个可变引用，或者任意数量的不可变引用，两者不能共存。',
  },
  {
    id: 'q5', kind: 'mcq',
    question: 'Result<T, E> 和 Option<T> 的主要区别是什么？',
    options: [
      { id: 'a', text: 'Result 用于可能失败的操作且携带错误信息，Option 用于值可能不存在的场景' },
      { id: 'b', text: '两者完全等价，只是语义不同' },
      { id: 'c', text: 'Option 性能更好，应优先使用' },
      { id: 'd', text: 'Result 只用于 I/O 操作' },
    ],
    correct: 'a',
    explanation: 'Option<T> 表示值可能存在（Some(T)）或不存在（None）；Result<T, E> 表示操作可能成功（Ok(T)）或失败（Err(E)），失败时携带错误详情。',
  },
]

const TYPE_LABELS: Record<AssessmentType, string> = {
  baseline: '基线评估',
  milestone: '里程碑评估',
  final: '最终评估',
}

const KIND_LABELS: Record<string, string> = {
  mcq: '单选题',
  short: '简答题',
  truefalse: '判断题',
}

interface AssessmentRunnerProps {
  type?: AssessmentType
  onComplete: (result: { correct: number; total: number }) => void
  onClose: () => void
}

export function AssessmentRunner({ type = 'milestone', onComplete, onClose }: AssessmentRunnerProps) {
  const { t } = useTranslation()
  const [qIdx, setQIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [shortTexts, setShortTexts] = useState<Record<string, string>>({})

  const q = QUESTIONS[qIdx]!
  const ans = answers[q.id]
  const isRevealed = revealed[q.id] ?? false
  const pct = Math.round(((qIdx + (isRevealed ? 1 : 0)) / QUESTIONS.length) * 100)

  function handleReveal() {
    if (!ans && q.kind !== 'short') return
    setRevealed((v) => ({ ...v, [q.id]: true }))
  }

  function handleNext() {
    if (qIdx < QUESTIONS.length - 1) {
      setQIdx((i) => i + 1)
    } else {
      const correctCount = QUESTIONS.filter((qq) => {
        const a = answers[qq.id]
        if (qq.kind === 'mcq') return a === qq.correct
        if (qq.kind === 'truefalse') return a === String(qq.correct)
        return true
      }).length
      onComplete({ correct: correctCount, total: QUESTIONS.length })
    }
  }

  function MCQOption({ opt }: { opt: { id: string; text: string } }) {
    const isSel = ans === opt.id
    const isCorrect = opt.id === q.correct

    let classes = 'border-border bg-surface text-foreground'
    if (isSel && !isRevealed) classes = 'border-primary bg-accent text-accent-foreground'
    if (isRevealed && isCorrect) classes = 'border-ok bg-ok-bg text-ok'
    if (isRevealed && isSel && !isCorrect) classes = 'border-err bg-err-bg text-err'

    return (
      <div
        onClick={() => !isRevealed && setAnswers((v) => ({ ...v, [q.id]: opt.id }))}
        className={cn(
          'flex items-center gap-2.5 px-3.5 py-[11px] rounded-[var(--radius)] border-[1.5px] transition-all duration-fast ease-spring',
          classes,
          !isRevealed && 'cursor-pointer',
          isSel && !isRevealed && 'scale-[1.01]',
        )}
      >
        <div
          className={cn(
            'w-5 h-5 rounded-full shrink-0 border-2 flex items-center justify-center transition-all duration-fast',
            isSel || (isRevealed && isCorrect) ? 'border-current bg-current' : 'border-border bg-transparent',
          )}
        >
          {isRevealed && isCorrect && (
            <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4L3.5 7L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
          {isRevealed && isSel && !isCorrect && (
            <span className="text-white text-[9px] font-bold">✕</span>
          )}
        </div>
        <span className={cn('text-[13px] leading-[1.4]', isSel && !isRevealed && 'font-medium')}>{opt.text}</span>
        {isRevealed && isCorrect && (
          <span className="ml-auto text-[11px] text-ok font-semibold shrink-0">{t('assess.correctAnswer')}</span>
        )}
      </div>
    )
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[150] bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="px-8 h-14 flex items-center border-b border-border bg-surface gap-4 shrink-0">
        <Logo />
        <div className="flex-1 flex flex-col gap-[5px]">
          <div className="flex justify-between items-center">
            <span className="text-xs text-fg-3">{TYPE_LABELS[type]} · 学习 Rust 系统编程</span>
            <span className="text-xs text-fg-3">{qIdx + 1} / {QUESTIONS.length}</span>
          </div>
          <div className="h-[3px] bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-[width] duration-400 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <button onClick={onClose} className="text-fg-3 p-1.5 rounded-lg hover:text-foreground" aria-label={t('common.close')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center px-6 py-12">
        <div key={q.id} className="w-full max-w-[560px] flex flex-col gap-5 animate-slide-up">
          <div className="flex gap-2 items-center">
            <span className="text-[10px] font-bold px-[9px] py-[2px] rounded-full bg-accent text-accent-foreground uppercase tracking-[0.06em]">
              {KIND_LABELS[q.kind]}
            </span>
            <span className="text-[11px] text-fg-3">
              {t('assess.questionOf', { current: qIdx + 1, total: QUESTIONS.length })}
            </span>
          </div>

          <h2 className="text-lg font-semibold text-foreground font-display leading-normal tracking-[-0.2px]">
            {q.question}
          </h2>

          {q.kind === 'mcq' && q.options && (
            <div className="flex flex-col gap-2">
              {q.options.map((opt) => <MCQOption key={opt.id} opt={opt} />)}
            </div>
          )}

          {q.kind === 'truefalse' && (
            <div className="flex gap-2.5">
              {[
                { id: 'true', label: '正确 ✓' },
                { id: 'false', label: '错误 ✗' },
              ].map((opt) => {
                const isSel = ans === opt.id
                const isRight = (opt.id === 'true') === q.correct

                let classes = 'border-border bg-surface text-foreground'
                if (isSel && !isRevealed) classes = 'border-primary bg-accent text-accent-foreground'
                if (isRevealed && isRight) classes = 'border-ok bg-ok-bg text-ok'
                if (isRevealed && isSel && !isRight) classes = 'border-err bg-err-bg text-err'

                return (
                  <div
                    key={opt.id}
                    onClick={() => !isRevealed && setAnswers((v) => ({ ...v, [q.id]: opt.id }))}
                    className={cn(
                      'flex-1 py-4 text-center rounded-[var(--radius)] border-[1.5px] text-sm font-semibold transition-all duration-fast ease-spring',
                      classes,
                      !isRevealed && 'cursor-pointer',
                      isSel && !isRevealed && 'scale-[1.03]',
                    )}
                  >
                    {opt.label}
                  </div>
                )
              })}
            </div>
          )}

          {q.kind === 'short' && (
            <textarea
              value={shortTexts[q.id] ?? ''}
              onChange={(e) => setShortTexts((v) => ({ ...v, [q.id]: e.target.value }))}
              placeholder={q.placeholder}
              rows={5}
              className="w-full px-[15px] py-[13px] bg-surface border-[1.5px] border-border rounded-[var(--radius)] text-[13px] text-foreground leading-[1.7] resize-y outline-none transition-colors duration-fast focus:border-primary"
            />
          )}

          {isRevealed && (q.explanation ?? q.sampleAnswer) && (
            <div className="px-4 py-3.5 bg-info-bg border border-info rounded-[var(--radius)] animate-slide-up">
              <div className="text-[11px] font-bold text-info mb-1.5 uppercase tracking-[0.05em]">
                {q.kind === 'short' ? t('assess.sampleAnswer') : t('assess.explanation')}
              </div>
              <p className="text-[13px] text-foreground leading-[1.65]">
                {q.explanation ?? q.sampleAnswer}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center mt-2">
            <button
              onClick={() => setAnswers((v) => ({ ...v, [q.id]: 'skip' }))}
              className="text-xs text-fg-3 px-3.5 py-[7px] rounded-lg hover:bg-bg-2 hover:text-fg-2 transition-colors duration-fast"
            >
              {t('assess.skip')}
            </button>
            <div className="flex gap-2">
              {!isRevealed && (
                <button
                  onClick={handleReveal}
                  disabled={!ans && q.kind !== 'short'}
                  className={cn(
                    'px-5 py-[9px] rounded-[var(--radius)] text-[13px] font-medium transition-all duration-fast',
                    (ans || q.kind === 'short')
                      ? 'bg-primary text-primary-foreground hover:bg-primary-hover hover:-translate-y-px cursor-pointer'
                      : 'bg-border text-fg-3 cursor-not-allowed',
                  )}
                >
                  {t('assess.reveal')}
                </button>
              )}
              {isRevealed && (
                <button
                  onClick={handleNext}
                  className="px-[22px] py-[9px] rounded-[var(--radius)] bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary-hover hover:-translate-y-px transition-all duration-fast"
                >
                  {qIdx < QUESTIONS.length - 1 ? t('assess.next') : t('assess.finish')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
