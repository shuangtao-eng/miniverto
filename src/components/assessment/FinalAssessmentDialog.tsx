import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import type { LearningMaterial } from '@/data/materials'
import type { Project } from '@/types'
import {
  buildFinalAssessment,
  buildFinalAssessmentPromptPayload,
  gradeFinalAssessment,
  type AssessmentBand,
  type FinalAssessment,
  type FinalAssessmentResult,
} from '@/services/final-assessment'
import { generateFinalAssessmentWithModel } from '@/services/llm-client'
import { getTauriInvoke } from '@/services/material-ingest'
import { resolveDefaultRuntimeProvider } from '@/services/provider-runtime'
import {
  upsertPersistedAssessmentResult,
  type PersistedFinalAssessmentResult,
} from '@/services/assessment-results'
import { cn } from '@/lib/utils'

interface FinalAssessmentDialogProps {
  project: Project
  materials?: LearningMaterial[]
  onResultSaved?: (result: PersistedFinalAssessmentResult) => void
  onClose: () => void
}

const BAND_LABELS: Record<AssessmentBand, string> = {
  concept: '基础概念',
  application: '应用迁移',
  synthesis: '综合场景',
  reflection: '自解释反思',
}

export function FinalAssessmentDialog({
  project,
  materials = [],
  onResultSaved,
  onClose,
}: FinalAssessmentDialogProps) {
  const fallbackAssessment = useMemo(() => buildFinalAssessment(project, { materials }), [materials, project])
  const [assessment, setAssessment] = useState<FinalAssessment>(fallbackAssessment)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<FinalAssessmentResult | null>(null)
  const [sourceLabel, setSourceLabel] = useState('本地规则题')
  const [isGenerating, setIsGenerating] = useState(false)

  const answered = assessment.questions.filter((q) => answers[q.id]).length
  const canSubmit = answered === assessment.questions.length

  useEffect(() => {
    let cancelled = false

    setAssessment(fallbackAssessment)
    setAnswers({})
    setResult(null)
    setSourceLabel('本地规则题')

    async function generateWithDefaultModel() {
      const invoke = await getTauriInvoke()
      const runtimeProvider = await resolveDefaultRuntimeProvider(invoke)
      if (!runtimeProvider || runtimeProvider.apiKey !== '') return

      setIsGenerating(true)
      const generated = await generateFinalAssessmentWithModel({
        config: runtimeProvider,
        promptPayload: buildFinalAssessmentPromptPayload(project, { materials }),
        fallbackAssessment,
      })
      if (cancelled) return

      setAssessment(generated.assessment)
      setSourceLabel(generated.source === 'model' ? `${runtimeProvider.model} 生成题` : '本地规则题')
      setIsGenerating(false)
    }

    generateWithDefaultModel().catch(() => {
      if (!cancelled) {
        setSourceLabel('本地规则题')
        setIsGenerating(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [fallbackAssessment, materials, project])

  async function submit() {
    if (!canSubmit) return
    const graded = gradeFinalAssessment(assessment, answers)
    setResult(graded)

    const invoke = await getTauriInvoke()
    const persisted = await upsertPersistedAssessmentResult({
      projectId: project.id,
      result: graded,
      invoke,
    })
    if (persisted) onResultSaved?.(persisted)
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[180] bg-black/45 px-4 py-6 animate-fade-in">
      <div className="mx-auto flex h-full max-w-[760px] flex-col overflow-hidden rounded-lg border border-border bg-background shadow-2xl">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-5">
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-foreground">{assessment.title}</div>
            <div className="text-[11px] text-fg-3">
              Miniverto 将用 10 道题判断目标达成度，并生成后续加强建议 · {isGenerating ? '正在生成题目' : sourceLabel}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-fg-3 transition-colors duration-fast hover:bg-bg-2 hover:text-foreground"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {result ? (
            <AssessmentResultPanel result={result} />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-md border border-border bg-surface px-4 py-3">
                <div className="mb-2 flex items-center justify-between text-xs text-fg-3">
                  <span>已完成 {answered}/{assessment.questions.length}</span>
                  <span>{Math.round((answered / assessment.questions.length) * 100)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-bg-2">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-400 ease-out"
                    style={{ width: `${(answered / assessment.questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {assessment.questions.map((question, index) => (
                <div key={question.id} className="rounded-lg border border-border bg-surface px-4 py-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded bg-bg-2 px-2 py-1 text-[10px] font-semibold text-fg-2">
                      {BAND_LABELS[question.band]}
                    </span>
                    <span className="text-xs text-fg-3">第 {index + 1} 题</span>
                  </div>
                  {question.sourceHint && (
                    <div className="mb-3 rounded bg-bg-2 px-3 py-2 text-[11px] leading-[1.5] text-fg-3">
                      来源：{question.sourceHint}
                    </div>
                  )}
                  <div className="mb-3 text-[14px] font-medium leading-[1.6] text-foreground">
                    {question.prompt}
                  </div>
                  <div className="grid gap-2">
                    {question.options.map((option) => {
                      const selected = answers[question.id] === option.id
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                          className={cn(
                            'flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-[13px] leading-[1.45] transition-all duration-fast',
                            selected
                              ? 'border-primary bg-accent text-accent-foreground'
                              : 'border-border bg-background text-fg-2 hover:border-primary/60 hover:text-foreground',
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                              selected ? 'border-current bg-current text-accent-foreground' : 'border-border text-fg-3',
                            )}
                          >
                            {selected ? <CheckCircle2 size={12} className="text-white" /> : option.id.toUpperCase()}
                          </span>
                          <span>{option.text}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!result && (
          <div className="flex shrink-0 items-center justify-between border-t border-border bg-surface px-5 py-3">
            <span className="text-xs text-fg-3">每题只有一个最佳答案，提交后 Miniverto 会给出继续学习建议。</span>
            <button
              onClick={submit}
              disabled={!canSubmit}
              className={cn(
                'rounded-md px-5 py-2 text-[13px] font-medium transition-all duration-fast',
                canSubmit
                  ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                  : 'cursor-not-allowed bg-border text-fg-3',
              )}
            >
              提交测评
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AssessmentResultPanel({ result }: { result: FinalAssessmentResult }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-surface px-5 py-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-fg-3">测评结果</div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="font-display text-[42px] font-extrabold leading-none text-foreground">
            {result.scorePct}%
          </div>
          <div className="pb-1">
            <div className="text-[16px] font-semibold text-foreground">{result.levelLabel}</div>
            <div className="text-xs text-fg-3">
              答对 {result.correct}/{result.total} 题
            </div>
          </div>
        </div>
        <p className="mt-4 text-[13px] leading-[1.7] text-fg-2">{result.masterySummary}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface px-4 py-4">
          <div className="mb-2 text-[13px] font-semibold text-foreground">需要继续加强吗</div>
          <div className={cn('text-[22px] font-bold', result.needsContinuation ? 'text-warn' : 'text-ok')}>
            {result.needsContinuation ? '需要' : '暂不需要'}
          </div>
          <p className="mt-2 text-xs leading-[1.65] text-fg-3">
            {result.needsContinuation
              ? '建议先补齐薄弱能力，再进入下一阶段或结项。'
              : '可以结项，也可以进入更高难度的迁移训练。'}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface px-4 py-4">
          <div className="mb-2 text-[13px] font-semibold text-foreground">后续学习方案</div>
          <div className="text-[17px] font-bold text-foreground">{result.nextPlan.title}</div>
          <div className="mt-1 text-xs text-fg-3">预计 {result.nextPlan.durationDays} 天</div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {result.nextPlan.focus.map((item) => (
              <span key={item} className="rounded bg-bg-2 px-2 py-1 text-[11px] text-fg-2">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
