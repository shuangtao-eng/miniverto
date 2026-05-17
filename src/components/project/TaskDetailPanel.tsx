import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Task } from '@/types'
import { getTaskAcceptanceCriteria, getTaskGuidance } from '@/services/task-guidance'

const KIND_LABELS: Record<Task['kind'], string> = {
  reading: '阅读',
  practice: '练习',
  reflection: '复盘',
  other: '其他',
}

const KIND_ICONS: Record<Task['kind'], string> = {
  reading: 'R',
  practice: 'P',
  reflection: 'F',
  other: '*',
}

const RES_ICONS: Record<string, string> = {
  video: 'V',
  article: 'A',
  book: 'B',
  link: 'L',
}

interface TaskDetailPanelProps {
  task: Task
  onStartLearning?: (task: Task) => void
  onSaveNote?: (taskId: string, note: string) => void
  onPromoteNote?: (task: Task, note: string) => void
  onClose: () => void
}

export function TaskDetailPanel({ task, onStartLearning, onSaveNote, onPromoteNote, onClose }: TaskDetailPanelProps) {
  const { t } = useTranslation()
  const [note, setNote] = useState(task.userNote ?? '')
  const guidance = getTaskGuidance(task)
  const acceptanceCriteria = getTaskAcceptanceCriteria(task)
  const latestAssessment = latestTaskAssessment(task)

  return (
    <div className="w-[380px] shrink-0 border-l border-border bg-surface flex flex-col overflow-hidden animate-slide-in-right">
      <div className="px-[18px] py-4 border-b border-border flex items-start gap-2.5">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-accent flex items-center justify-center text-xs font-bold shrink-0">
          {KIND_ICONS[task.kind]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-fg-3 mb-[3px]">
            {KIND_LABELS[task.kind]} · {task.estimatedMinutes} {t('units.minutes', '分钟')}
          </div>
          <h3 className="text-sm font-semibold text-foreground leading-snug">{task.title}</h3>
        </div>
        <button onClick={onClose} className="text-fg-3 p-1 rounded-sm hover:text-foreground -mt-0.5" aria-label={t('common.close')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-[18px] py-4 flex flex-col gap-[18px]">
        <Section label="学习指导">
          <p className="text-[13px] text-fg-2 leading-relaxed">{guidance}</p>
        </Section>

        {task.learningContent && (
          <Section label="App 内学习内容">
            <div className="flex flex-col gap-3 rounded-lg bg-bg-2 px-3 py-3">
              <p className="text-[13px] leading-relaxed text-fg-2">{task.learningContent.overview}</p>
              <ContentList title="关键概念" items={task.learningContent.keyPoints} />
              <ContentList title="学习步骤" items={task.learningContent.steps} />
              <ContentList title="小练习" items={task.learningContent.exercises} />
              {task.learningContent.mediaSuggestions && task.learningContent.mediaSuggestions.length > 0 && (
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <div className="text-[11px] font-semibold text-fg-3">图文/视频建议</div>
                  <div className="mt-1 text-[12px] leading-relaxed text-fg-2">
                    {task.learningContent.mediaSuggestions.map((media) => media.title).join('、')}
                  </div>
                </div>
              )}
              <div className="rounded-md border border-border bg-surface px-3 py-2 text-[12px] leading-relaxed text-fg-2">
                复习提示：{task.learningContent.reviewPrompt}
              </div>
            </div>
          </Section>
        )}

        <Section label={t('detail.task.acceptanceCriteria', '验收标准')}>
          <div className="text-[13px] text-fg-2 leading-relaxed px-3 py-2.5 bg-ok-bg rounded-lg border-l-[3px] border-ok">
            {acceptanceCriteria}
          </div>
        </Section>

        {latestAssessment && (
          <Section label="课后测评记录">
            <div className="rounded-lg border border-border bg-bg-2 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[12px] font-semibold text-foreground">{latestAssessment.levelLabel}</div>
                  <div className="mt-1 text-[11px] text-fg-3">
                    共 {task.assessmentHistory?.length ?? 0} 次记录
                  </div>
                </div>
                <div
                  className={[
                    'font-display text-2xl font-extrabold',
                    latestAssessment.scorePct >= 80 ? 'text-ok' : 'text-warn',
                  ].join(' ')}
                >
                  {latestAssessment.scorePct}%
                </div>
              </div>
              <div className="mt-2 text-[11px] leading-relaxed text-fg-3">
                {latestAssessment.masterySummary}
              </div>
              {latestAssessment.needsReinforcement && (
                <div className="mt-2 rounded border border-warn bg-warn-bg px-2 py-1.5 text-[11px] leading-relaxed text-fg-2">
                  建议复习：{latestAssessment.nextPlan.focus.join('、')}
                </div>
              )}
            </div>
          </Section>
        )}

        {task.resources && task.resources.length > 0 && (
          <Section label={t('detail.task.resources', '资源提示')}>
            <div className="flex flex-col gap-1.5">
              {task.resources.map((resource) => (
                <div key={resource.id} className="flex items-center gap-2 px-2.5 py-2 bg-bg-2 rounded-lg text-xs">
                  <span className="text-[11px] font-bold">{RES_ICONS[resource.type] ?? '?'}</span>
                  <span className="flex-1 text-fg-2 truncate">{resource.title}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {task.recommendedReferences && task.recommendedReferences.length > 0 && (
          <Section label="参考资料/文献">
            <div className="flex flex-col gap-2">
              {task.recommendedReferences.map((reference) => (
                <div key={reference.id} className="rounded-lg border border-border bg-bg-2 px-3 py-2.5">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-surface px-2 py-0.5 text-[10px] uppercase text-fg-3">{reference.type}</span>
                    <span className="rounded bg-surface px-2 py-0.5 text-[10px] text-fg-3">{reference.difficulty}</span>
                  </div>
                  <div className="text-[12px] font-semibold text-foreground">{reference.title}</div>
                  <div className="mt-1 text-[11px] leading-relaxed text-fg-3">{reference.reason}</div>
                  {reference.url && (
                    <a href={reference.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[11px] text-primary hover:text-primary-hover">
                      打开资料
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section label={t('detail.task.notes', '笔记')}>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="完成后记录感受、卡点、心得。可保存到任务，也可以沉淀为长期笔记。"
            className="w-full min-h-20 px-3 py-2.5 bg-bg-2 border border-border rounded-lg text-xs text-foreground leading-relaxed resize-y outline-none focus:border-primary transition-colors duration-fast"
          />
        </Section>
      </div>

      <div className="px-[18px] py-3 border-t border-border flex gap-2">
        <button
          onClick={() => onStartLearning?.(task)}
          className="flex-1 py-2 rounded bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors duration-fast"
        >
          开始学习
        </button>
        <button
          onClick={() => onPromoteNote?.(task, note)}
          className="px-3 py-2 rounded bg-bg-2 border border-border text-xs text-fg-2 hover:bg-bg-3 transition-colors duration-fast"
        >
          长期笔记
        </button>
        <button
          onClick={() => onSaveNote?.(task.id, note)}
          className="px-3 py-2 rounded bg-bg-2 border border-border text-xs text-fg-2 hover:bg-bg-3 transition-colors duration-fast"
        >
          {t('detail.task.saveNote')}
        </button>
      </div>
    </div>
  )
}

function ContentList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold text-fg-3">{title}</div>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-[12px] leading-relaxed text-fg-2">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-fg-3 mb-[7px] uppercase tracking-[0.05em]">{label}</div>
      {children}
    </div>
  )
}

function latestTaskAssessment(task: Task) {
  const sorted = task.assessmentHistory?.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)) ?? []
  return sorted.length > 0 ? sorted[sorted.length - 1] : null
}
