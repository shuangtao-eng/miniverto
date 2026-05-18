import { useMemo, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useProjectStore } from '@/stores/project-store'
import { buildLearningSession, type LearningSession } from '@/services/learning-session'
import { buildLearningMediaCard, type LearningMediaCard } from '@/services/learning-media'
import {
  buildTaskAssessment,
  createTaskAssessmentRecord,
  formatTaskAssessmentNote,
  gradeTaskAssessment,
  type TaskAssessment,
  type TaskAssessmentResult,
} from '@/services/task-assessment'
import { getTauriInvoke } from '@/services/material-ingest'
import { updatePersistedTaskProgress } from '@/services/task-progress'
import type { AssessmentBand } from '@/services/final-assessment'
import type { MaterialCitation, MediaSuggestion, Task } from '@/types'

const BLOCK_LABELS = {
  hook: 'Intro',
  concept: 'Concept',
  example: 'Example',
  steps: 'Steps',
  exercise: 'Exercise',
  reflection: 'Reflection',
  quiz: 'Check',
}

const ASSESSMENT_BAND_LABELS: Record<AssessmentBand, string> = {
  concept: 'Core concept',
  application: 'Transfer',
  synthesis: 'Synthesis',
  reflection: 'Self-explanation',
}

type ResourceFilter = 'all' | 'video' | 'diagram' | 'image' | 'citation' | 'reference'

export function TaskLearningPage() {
  const navigate = useNavigate()
  const { projectId, taskId } = useParams({ from: '/app/project/$projectId/task/$taskId/learn' })
  const project = useProjectStore((s) => s.getProject(projectId))
  const updateTaskProgress = useProjectStore((s) => s.updateTaskProgress)
  const task = useMemo(
    () => project?.milestoneList.flatMap((milestone) => milestone.tasks).find((item) => item.id === taskId),
    [project, taskId],
  )
  const session = task ? buildLearningSession(task) : null
  const assessment = task && project ? buildTaskAssessment(task, project) : null
  const [note, setNote] = useState(task?.userNote ?? '')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [assessmentResult, setAssessmentResult] = useState<TaskAssessmentResult | null>(null)
  const [resourceFilter, setResourceFilter] = useState<ResourceFilter>('all')
  const [usedResourceIds, setUsedResourceIds] = useState<string[]>([])

  if (!project || !task || !session || !assessment) {
    return <div className="p-8 text-sm text-fg-3">Learning content not found.</div>
  }

  const activeAssessment = assessment
  const allMedia = task.learningContent?.mediaSuggestions ?? []
  const filteredMedia = resourceFilter === 'all'
    ? allMedia
    : allMedia.filter((media) => media.type === resourceFilter)
  const filteredCitations = resourceFilter === 'all' || resourceFilter === 'citation' ? session.citations : []
  const filteredReferences = resourceFilter === 'all' || resourceFilter === 'reference'
    ? task.recommendedReferences ?? []
    : []

  function toggleResourceUsed(resourceId: string) {
    setUsedResourceIds((current) => (
      current.includes(resourceId)
        ? current.filter((id) => id !== resourceId)
        : [...current, resourceId]
    ))
  }

  function appendToNote(text: string) {
    setNote((current) => [current.trim(), text].filter(Boolean).join('\n\n'))
  }

  async function handleComplete(currentTask: Task) {
    if (!assessmentResult) return
    const finalNote = formatTaskAssessmentNote(note, assessmentResult)
    const assessmentRecord = createTaskAssessmentRecord(currentTask.id, assessmentResult)
    const assessmentHistory = [...(currentTask.assessmentHistory ?? []), assessmentRecord]
    updateTaskProgress(currentTask.id, { status: 'completed', userNote: finalNote, assessmentRecord })
    const invoke = await getTauriInvoke()
    await updatePersistedTaskProgress({
      taskId: currentTask.id,
      status: 'completed',
      userNote: finalNote,
      assessmentHistory,
      invoke,
    })
    await navigate({ to: '/project/$projectId', params: { projectId } })
  }

  function submitAssessment() {
    if (activeAssessment.questions.some((question) => !answers[question.id])) return
    setAssessmentResult(gradeTaskAssessment(activeAssessment, answers))
  }

  return (
    <div className="h-full overflow-hidden bg-bg flex">
      <aside className="w-[260px] shrink-0 border-r border-border bg-bg-2 p-5 overflow-y-auto">
        <button
          onClick={() => void navigate({ to: '/project/$projectId', params: { projectId } })}
          className="mb-5 text-xs text-fg-3 hover:text-foreground"
        >
          {'<- Back to plan'}
        </button>
        <div className="text-[11px] font-semibold uppercase text-fg-3">Lesson Outline</div>
        <h1 className="mt-2 font-display text-xl font-bold leading-tight text-foreground">{session.title}</h1>
        <div className="mt-2 text-xs text-fg-3">{session.estimatedMinutes} minutes · {project.title}</div>
        <nav className="mt-5 flex flex-col gap-1.5">
          {session.outline.map((title, index) => (
            <a
              key={`${title}-${index}`}
              href={`#block-${index}`}
              className="rounded-md px-3 py-2 text-xs text-fg-2 hover:bg-bg-3 hover:text-foreground"
            >
              {index + 1}. {title}
            </a>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto px-8 py-7">
        <div className="mx-auto max-w-[880px]">
          <div className="mb-7 border-b border-border pb-5">
            <div className="text-[12px] font-semibold text-primary">Miniverto Learning Workspace</div>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground">{session.title}</h2>
            <p className="mt-3 max-w-[740px] text-[14px] leading-[1.8] text-fg-2">{session.overview}</p>
          </div>

          <LessonDetailPanel session={session} />

          <div className="flex flex-col gap-7">
            {session.blocks.map((block, index) => (
              <section key={block.id} id={`block-${index}`} className="scroll-mt-6">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-accent px-2 py-1 text-[11px] font-semibold text-accent-foreground">
                    {BLOCK_LABELS[block.type]}
                  </span>
                  <span className="text-[11px] text-fg-3">Step {index + 1}</span>
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">{block.title}</h3>
                <p className="mt-2 text-[14px] leading-[1.85] text-fg-2">{block.body}</p>
                {block.bullets.length > 0 && (
                  <ul className="mt-3 grid gap-2">
                    {block.bullets.map((item) => (
                      <li key={item} className="rounded-md border border-border bg-surface px-3 py-2 text-[13px] leading-relaxed text-fg-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {block.media.length > 0 && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {block.media.map((media) => <MediaCard key={media.id} media={media} />)}
                  </div>
                )}
                {block.citations.length > 0 && (
                  <div className="mt-4 rounded-md border border-border bg-bg-2 px-3 py-3">
                    <div className="text-[12px] font-semibold text-foreground">Material evidence</div>
                    <div className="mt-2 grid gap-2">
                      {block.citations.map((citation) => <CitationCard key={citation.id} citation={citation} />)}
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>

          <section className="mt-8 border-t border-border pt-6">
            <h3 className="font-display text-xl font-bold text-foreground">Quick Check</h3>
            <div className="mt-3 grid gap-2">
              {session.quickCheck.map((question, index) => (
                <div key={question} className="rounded-md border border-border bg-bg-2 px-4 py-3 text-[13px] text-fg-2">
                  {index + 1}. {question}
                </div>
              ))}
            </div>
            {session.reviewPrompt && (
              <div className="mt-4 rounded-md border border-ok bg-ok-bg px-4 py-3 text-[13px] leading-relaxed text-ok">
                Review prompt: {session.reviewPrompt}
              </div>
            )}
            {session.nextStepHint && (
              <div className="mt-4 rounded-md border border-border bg-bg-2 px-4 py-3 text-[13px] leading-relaxed text-fg-2">
                Next step: {session.nextStepHint}
              </div>
            )}
          </section>

          <TaskAssessmentPanel
            assessment={activeAssessment}
            answers={answers}
            result={assessmentResult}
            onAnswer={(questionId, optionId) => setAnswers((current) => ({ ...current, [questionId]: optionId }))}
            onSubmit={submitAssessment}
          />

          <section className="mt-6 rounded-lg border border-border bg-surface px-4 py-4">
            <div className="text-[13px] font-semibold text-foreground">Lesson Notes</div>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Write one useful sentence, one example, and one question that is still unclear."
              className="mt-3 min-h-[110px] w-full resize-y rounded-md border border-border bg-bg-2 px-3 py-2 text-[13px] leading-relaxed text-foreground outline-none focus:border-primary"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => void handleComplete(task)}
                disabled={!assessmentResult}
                className={[
                  'rounded px-4 py-2 text-xs font-medium',
                  assessmentResult
                    ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                    : 'cursor-not-allowed bg-border text-fg-3',
                ].join(' ')}
              >
                {assessmentResult ? 'Complete lesson and return to plan' : 'Complete the assessment first'}
              </button>
            </div>
          </section>
        </div>
      </main>

      <aside className="w-[300px] shrink-0 border-l border-border bg-surface p-5 overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[12px] font-semibold text-foreground">Resource Workbench</div>
          <div className="rounded bg-bg-2 px-2 py-1 text-[10px] text-fg-3">
            {usedResourceIds.length} used
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(['all', 'video', 'diagram', 'image', 'citation', 'reference'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setResourceFilter(filter)}
              className={[
                'rounded px-2 py-1 text-[10px]',
                resourceFilter === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-bg-2 text-fg-3 hover:text-foreground',
              ].join(' ')}
            >
              {resourceFilterLabel(filter)}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {filteredMedia.length === 0 && filteredCitations.length === 0 && filteredReferences.length === 0 ? (
            <div className="text-[12px] leading-relaxed text-fg-3">No resources for the current filter.</div>
          ) : (
            <>
              {filteredMedia.map((media) => (
                <MediaCard
                  key={media.id}
                  media={media}
                  compact
                  used={usedResourceIds.includes(media.id)}
                  onToggleUsed={() => toggleResourceUsed(media.id)}
                  onInsertNote={(text) => appendToNote(text)}
                />
              ))}
              {filteredCitations.map((citation) => (
                <CitationWorkbenchCard
                  key={citation.id}
                  citation={citation}
                  used={usedResourceIds.includes(citation.id)}
                  onToggleUsed={() => toggleResourceUsed(citation.id)}
                  onInsertNote={() => appendToNote(`Material: ${citation.materialName}\nSummary: ${citation.summary}\nUse: ${citation.reason}`)}
                />
              ))}
              {filteredReferences.map((reference) => (
                <div key={reference.id} className="rounded-md border border-border bg-bg-2 px-3 py-2">
                  <div className="text-[12px] font-semibold text-foreground">{reference.title}</div>
                  <div className="mt-1 text-[11px] leading-relaxed text-fg-3">{reference.reason}</div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleResourceUsed(reference.id)}
                      className="rounded bg-surface px-2 py-1 text-[11px] text-fg-2 hover:text-foreground"
                    >
                      {usedResourceIds.includes(reference.id) ? 'Used' : 'Mark used'}
                    </button>
                    <button
                      type="button"
                      onClick={() => appendToNote(`Reference: ${reference.title}\nReason: ${reference.reason}`)}
                      className="rounded bg-surface px-2 py-1 text-[11px] text-fg-2 hover:text-foreground"
                    >
                      Add to notes
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </aside>
    </div>
  )
}

function TaskAssessmentPanel({
  assessment,
  answers,
  result,
  onAnswer,
  onSubmit,
}: {
  assessment: TaskAssessment
  answers: Record<string, string>
  result: TaskAssessmentResult | null
  onAnswer: (questionId: string, optionId: string) => void
  onSubmit: () => void
}) {
  const answered = assessment.questions.filter((question) => answers[question.id]).length
  const canSubmit = answered === assessment.questions.length

  return (
    <section className="mt-8 rounded-lg border border-border bg-surface px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold text-foreground">Miniverto Post-lesson Assessment</div>
          <p className="mt-1 text-[12px] leading-relaxed text-fg-3">
            After this lesson, use 10 questions to check mastery and generate a follow-up plan.
          </p>
        </div>
        <div className="rounded bg-bg-2 px-3 py-1.5 text-[11px] text-fg-2">
          {answered}/{assessment.questions.length}
        </div>
      </div>

      {result ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-border bg-bg-2 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase text-fg-3">Current level</div>
            <div className="mt-2 font-display text-3xl font-bold text-foreground">{result.scorePct}%</div>
            <div className="mt-1 text-[13px] font-semibold text-foreground">{result.levelLabel}</div>
            <p className="mt-2 text-[12px] leading-relaxed text-fg-3">{result.masterySummary}</p>
          </div>
          <div className="rounded-md border border-border bg-bg-2 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase text-fg-3">Follow-up plan</div>
            <div className="mt-2 text-[15px] font-bold text-foreground">{result.nextPlan.title}</div>
            <div className="mt-1 text-[12px] text-fg-3">
              {result.needsReinforcement ? 'Needs reinforcement' : 'No reinforcement needed'} · {result.nextPlan.durationDays} days
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.nextPlan.focus.map((item) => (
                <span key={item} className="rounded bg-surface px-2 py-1 text-[11px] text-fg-2">
                  {item}
                </span>
              ))}
            </div>
            <ul className="mt-3 grid gap-1.5">
              {result.nextPlan.actions.map((action) => (
                <li key={action} className="text-[12px] leading-relaxed text-fg-3">{action}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3">
            {assessment.questions.map((question, index) => (
              <div key={question.id} className="rounded-md border border-border bg-bg-2 px-3 py-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                    {ASSESSMENT_BAND_LABELS[question.band]}
                  </span>
                  <span className="text-[11px] text-fg-3">Question {index + 1}</span>
                </div>
                {question.sourceHint && (
                  <div className="mb-2 rounded bg-surface px-2 py-1.5 text-[11px] leading-relaxed text-fg-3">
                    {question.sourceHint}
                  </div>
                )}
                <div className="text-[13px] font-medium leading-relaxed text-foreground">{question.prompt}</div>
                <div className="mt-2 grid gap-2">
                  {question.options.map((option) => {
                    const selected = answers[question.id] === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onAnswer(question.id, option.id)}
                        className={[
                          'rounded-md border px-3 py-2 text-left text-[12px] leading-relaxed',
                          selected
                            ? 'border-primary bg-accent text-accent-foreground'
                            : 'border-border bg-surface text-fg-2 hover:border-primary/60 hover:text-foreground',
                        ].join(' ')}
                      >
                        {option.id.toUpperCase()}. {option.text}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-[12px] text-fg-3">Submit before completing this lesson. Results are saved to task notes.</div>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className={[
                'rounded px-4 py-2 text-xs font-medium',
                canSubmit
                  ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                  : 'cursor-not-allowed bg-border text-fg-3',
              ].join(' ')}
            >
              Submit assessment
            </button>
          </div>
        </>
      )}
    </section>
  )
}

function LessonDetailPanel({ session }: { session: LearningSession }) {
  const hasDetails = session.learningObjectives.length > 0
    || session.prerequisites.length > 0
    || session.glossary.length > 0
    || Boolean(session.deliverable)
    || session.teachingScript.length > 0
    || session.answerKey.length > 0
    || session.reviewCards.length > 0
    || Boolean(session.nextStepHint)
    || session.conceptMap.length > 0
    || Boolean(session.workedExample)
    || session.practiceSet.length > 0
    || session.commonMistakes.length > 0
    || session.completionRubric.length > 0

  if (!hasDetails) return null

  return (
    <section className="mb-8 grid gap-4">
      {(session.prerequisites.length > 0 || session.deliverable) && (
        <div className="grid gap-4 md:grid-cols-2">
          {session.prerequisites.length > 0 && (
            <div className="rounded-lg border border-border bg-surface px-4 py-4">
              <div className="text-[13px] font-semibold text-foreground">Before You Start</div>
              <div className="mt-3 divide-y divide-border">
                {session.prerequisites.map((item) => (
                  <div key={item} className="py-2 text-[12px] leading-relaxed text-fg-2">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {session.deliverable && (
            <div className="rounded-lg border border-primary/30 bg-accent px-4 py-4">
              <div className="text-[13px] font-semibold text-accent-foreground">Today&apos;s Output</div>
              <div className="mt-2 text-[15px] font-semibold text-accent-foreground">{session.deliverable.title}</div>
              <div className="mt-1 text-[12px] text-accent-foreground/80">{session.deliverable.format}</div>
              <p className="mt-3 text-[12px] leading-relaxed text-accent-foreground">
                {session.deliverable.acceptanceCheck}
              </p>
            </div>
          )}
        </div>
      )}

      {session.glossary.length > 0 && (
        <div className="rounded-lg border border-border bg-surface px-4 py-4">
          <div className="text-[13px] font-semibold text-foreground">Glossary Notes</div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {session.glossary.map((item) => (
              <div key={item.term} className="min-w-0">
                <div className="text-[12px] font-semibold text-foreground">{item.term}</div>
                <div className="mt-1 text-[11px] leading-relaxed text-fg-3">{item.meaning}</div>
                <div className="mt-2 border-l-2 border-primary/40 pl-2 text-[11px] leading-relaxed text-fg-2">
                  {item.example}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {session.learningObjectives.length > 0 && (
        <div className="rounded-lg border border-border bg-surface px-4 py-4">
          <div className="text-[13px] font-semibold text-foreground">Learning Objectives</div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {session.learningObjectives.map((objective) => (
              <div key={objective.id} className="rounded-md border border-border bg-bg-2 px-3 py-3">
                <div className="text-[13px] font-semibold leading-relaxed text-foreground">{objective.outcome}</div>
                <div className="mt-1 text-[11px] leading-relaxed text-fg-3">{objective.evidence}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {session.personalizationNotes && (
        <div className="rounded-lg border border-primary/30 bg-accent px-4 py-4">
          <div className="text-[13px] font-semibold text-accent-foreground">Personalization Notes</div>
          <p className="mt-2 text-[12px] leading-relaxed text-accent-foreground">
            {session.personalizationNotes}
          </p>
        </div>
      )}

      {session.conceptMap.length > 0 && (
        <div className="rounded-lg border border-border bg-surface px-4 py-4">
          <div className="text-[13px] font-semibold text-foreground">Concept Map</div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {session.conceptMap.map((concept) => (
              <div key={concept.id} className="rounded-md border border-border bg-bg-2 px-3 py-3">
                <div className="text-[12px] font-semibold text-foreground">{concept.title}</div>
                <div className="mt-1 text-[11px] leading-relaxed text-fg-3">{concept.description}</div>
                {concept.links.length > 0 && (
                  <div className="mt-2 text-[10px] uppercase tracking-wide text-fg-3">
                    links: {concept.links.length}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {session.teachingScript.length > 0 && (
        <div className="rounded-lg border border-border bg-surface px-4 py-4">
          <div className="text-[13px] font-semibold text-foreground">Lesson Walkthrough</div>
          <div className="mt-3 grid gap-3">
            {session.teachingScript.map((section) => (
              <div key={section.id} className="rounded-md border border-border bg-bg-2 px-3 py-3">
                <div className="text-[12px] font-semibold text-foreground">{section.title}</div>
                <p className="mt-1 text-[12px] leading-relaxed text-fg-2">{section.body}</p>
                <div className="mt-2 border-l-2 border-primary/40 pl-2 text-[11px] leading-relaxed text-fg-3">
                  {section.example}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {session.workedExample && (
        <div className="rounded-lg border border-border bg-surface px-4 py-4">
          <div className="text-[13px] font-semibold text-foreground">Worked Example</div>
          <div className="mt-2 text-[15px] font-semibold text-foreground">{session.workedExample.title}</div>
          <p className="mt-1 text-[12px] leading-relaxed text-fg-3">{session.workedExample.scenario}</p>
          <ol className="mt-3 grid gap-2">
            {session.workedExample.steps.map((step, index) => (
              <li key={`${step}-${index}`} className="rounded-md border border-border bg-bg-2 px-3 py-2 text-[12px] leading-relaxed text-fg-2">
                {index + 1}. {step}
              </li>
            ))}
          </ol>
          <div className="mt-3 rounded-md border border-ok bg-ok-bg px-3 py-2 text-[12px] leading-relaxed text-ok">
            {session.workedExample.takeaway}
          </div>
        </div>
      )}

      {session.practiceSet.length > 0 && (
        <div className="rounded-lg border border-border bg-surface px-4 py-4">
          <div className="text-[13px] font-semibold text-foreground">Layered Practice</div>
          <div className="mt-3 grid gap-2">
            {session.practiceSet.map((practice) => (
              <div key={practice.id} className="rounded-md border border-border bg-bg-2 px-3 py-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                    {practiceLevelLabel(practice.level)}
                  </span>
                  <div className="text-[12px] font-semibold text-foreground">{practice.prompt}</div>
                </div>
                <div className="mt-2 text-[11px] leading-relaxed text-fg-3">{practice.expectedOutcome}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(session.answerKey.length > 0 || session.reviewCards.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {session.answerKey.length > 0 && (
            <div className="rounded-lg border border-border bg-surface px-4 py-4">
              <div className="text-[13px] font-semibold text-foreground">Answer Key</div>
              <div className="mt-3 grid gap-2">
                {session.answerKey.map((item) => (
                  <div key={item.practiceId} className="rounded-md border border-border bg-bg-2 px-3 py-3">
                    <div className="text-[12px] font-semibold text-foreground">{item.expectedAnswer}</div>
                    <div className="mt-1 text-[11px] leading-relaxed text-fg-3">{item.checkMethod}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {session.reviewCards.length > 0 && (
            <div className="rounded-lg border border-border bg-surface px-4 py-4">
              <div className="text-[13px] font-semibold text-foreground">Review Cards</div>
              <div className="mt-3 grid gap-2">
                {session.reviewCards.map((card) => (
                  <div key={`${card.tag}-${card.front}`} className="rounded-md border border-border bg-bg-2 px-3 py-3">
                    <div className="text-[12px] font-semibold text-foreground">{card.front}</div>
                    <div className="mt-2 text-[11px] leading-relaxed text-fg-3">{card.back}</div>
                    <div className="mt-2 text-[10px] uppercase text-fg-3">{card.tag}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(session.commonMistakes.length > 0 || session.completionRubric.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {session.commonMistakes.length > 0 && (
            <div className="rounded-lg border border-border bg-surface px-4 py-4">
              <div className="text-[13px] font-semibold text-foreground">Common Mistakes</div>
              <div className="mt-3 grid gap-2">
                {session.commonMistakes.map((item) => (
                  <div key={item.mistake} className="rounded-md border border-border bg-bg-2 px-3 py-3">
                    <div className="text-[12px] font-semibold text-foreground">{item.mistake}</div>
                    <div className="mt-1 text-[11px] leading-relaxed text-fg-3">{item.correction}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {session.completionRubric.length > 0 && (
            <div className="rounded-lg border border-border bg-surface px-4 py-4">
              <div className="text-[13px] font-semibold text-foreground">Completion Rubric</div>
              <div className="mt-3 grid gap-2">
                {session.completionRubric.map((item) => (
                  <div key={item.criterion} className="rounded-md border border-border bg-bg-2 px-3 py-3">
                    <div className="text-[12px] font-semibold text-foreground">{item.criterion}</div>
                    <div className="mt-1 text-[11px] leading-relaxed text-fg-3">{item.target}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function practiceLevelLabel(level: NonNullable<LearningSession['practiceSet']>[number]['level']) {
  if (level === 'foundation') return 'Foundation'
  if (level === 'application') return 'Application'
  return 'Challenge'
}

function resourceFilterLabel(filter: ResourceFilter) {
  if (filter === 'all') return 'All'
  if (filter === 'video') return 'Video'
  if (filter === 'diagram') return 'Diagram'
  if (filter === 'image') return 'Image'
  if (filter === 'citation') return 'Material'
  return 'Reference'
}

function CitationCard({ citation, compact = false }: { citation: MaterialCitation; compact?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <div className="text-[12px] font-semibold text-foreground">{citation.materialName}</div>
      {!compact && <div className="mt-1 text-[12px] leading-relaxed text-fg-2">{citation.summary}</div>}
      <div className="mt-1 text-[11px] leading-relaxed text-fg-3">{citation.reason}</div>
    </div>
  )
}

function CitationWorkbenchCard({
  citation,
  used,
  onToggleUsed,
  onInsertNote,
}: {
  citation: MaterialCitation
  used: boolean
  onToggleUsed: () => void
  onInsertNote: () => void
}) {
  return (
    <div className="rounded-md border border-border bg-bg-2 px-3 py-2">
      <div className="text-[12px] font-semibold text-foreground">{citation.materialName}</div>
      <div className="mt-1 text-[11px] leading-relaxed text-fg-3">{citation.summary}</div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onToggleUsed}
          className="rounded bg-surface px-2 py-1 text-[11px] text-fg-2 hover:text-foreground"
        >
          {used ? 'Used' : 'Mark used'}
        </button>
        <button
          type="button"
          onClick={onInsertNote}
          className="rounded bg-surface px-2 py-1 text-[11px] text-fg-2 hover:text-foreground"
        >
          Add to notes
        </button>
      </div>
    </div>
  )
}

function MediaCard({
  media,
  compact = false,
  used = false,
  onToggleUsed,
  onInsertNote,
}: {
  media: MediaSuggestion
  compact?: boolean
  used?: boolean
  onToggleUsed?: () => void
  onInsertNote?: (text: string) => void
}) {
  const card = buildLearningMediaCard(media)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function handleCopyPrompt() {
    if (!card.copyText) return
    try {
      await navigator.clipboard.writeText(card.copyText)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <div className="rounded-md border border-border bg-bg-2 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[12px] font-semibold text-foreground">{card.title}</div>
        <span className="rounded bg-surface px-2 py-0.5 text-[10px] uppercase text-fg-3">{card.visualKind}</span>
      </div>
      <div className="mt-1 text-[10px] text-fg-3">{card.placement}</div>
      <VisualPreview card={card} />
      <div className="mt-2 text-[11px] leading-relaxed text-fg-3">{card.purpose}</div>

      {card.actionKind === 'external-link' && card.actionUrl ? (
        <a
          href={card.actionUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex rounded bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary-hover"
        >
          {card.actionLabel}
        </a>
      ) : (
        <button
          type="button"
          onClick={() => void handleCopyPrompt()}
          className="mt-3 inline-flex rounded bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary-hover"
        >
          {copyState === 'copied' ? 'Copied' : card.actionLabel}
        </button>
      )}

      {(onToggleUsed || onInsertNote) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {onToggleUsed && (
            <button
              type="button"
              onClick={onToggleUsed}
              className="rounded bg-surface px-2 py-1 text-[11px] text-fg-2 hover:text-foreground"
            >
              {used ? 'Used' : 'Mark used'}
            </button>
          )}
          {onInsertNote && (
            <button
              type="button"
              onClick={() => onInsertNote(`Resource: ${card.title}\nUse: ${card.purpose}\nPrompt: ${card.copyText ?? card.promptOrQuery}`)}
              className="rounded bg-surface px-2 py-1 text-[11px] text-fg-2 hover:text-foreground"
            >
              Add to notes
            </button>
          )}
        </div>
      )}

      {card.searchProviderLabel && (
        <div className="mt-2 text-[11px] leading-relaxed text-fg-3">
          Search in {card.searchProviderLabel}: {card.promptOrQuery}
        </div>
      )}

      {!compact && card.copyText && (
        <div className="mt-2 rounded bg-surface px-2 py-1.5 text-[11px] leading-relaxed text-fg-2">
          {card.copyText}
        </div>
      )}

      {copyState === 'failed' && (
        <div className="mt-2 text-[11px] leading-relaxed text-fg-3">
          Automatic copy failed. Select the prompt above manually.
        </div>
      )}

      {card.usageSteps.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="text-[11px] font-semibold text-foreground">After using this resource</div>
          <ul className="mt-2 grid gap-1.5">
            {card.usageSteps.map((step) => (
              <li key={step} className="text-[11px] leading-relaxed text-fg-3">
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function VisualPreview({ card }: { card: LearningMediaCard }) {
  return (
    <div className="mt-3 rounded-md border border-border bg-surface px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        {card.previewNodes.map((node, index) => (
          <div key={node} className="flex flex-1 items-center gap-2">
            <div className="min-h-10 flex-1 rounded-md bg-bg-2 px-2 py-2 text-center text-[10px] font-semibold leading-tight text-fg-2">
              {node}
            </div>
            {index < card.previewNodes.length - 1 && <span className="text-[11px] text-fg-3">→</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
