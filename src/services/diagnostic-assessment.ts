export type DiagnosticDimension = 'concept' | 'application' | 'troubleshooting' | 'output'
export type DiagnosticOption = 'none' | 'weak' | 'assisted' | 'solid'
export type DiagnosticLevelSignal = 'unknown' | 'starting' | 'developing' | 'ready' | 'advanced'

export type DiagnosticAnswerMap = Partial<Record<DiagnosticDimension, DiagnosticOption>>

export interface DiagnosticResult {
  scorePct: number
  levelSignal: DiagnosticLevelSignal
  strengths: DiagnosticDimension[]
  gaps: DiagnosticDimension[]
  evidence?: string
}

const OPTION_SCORE: Record<DiagnosticOption, number> = {
  none: 0,
  weak: 1,
  assisted: 2,
  solid: 3,
}

const DIMENSIONS: DiagnosticDimension[] = ['concept', 'application', 'troubleshooting', 'output']

export function scoreDiagnosticAnswers(
  answers: DiagnosticAnswerMap,
  evidence?: string,
): DiagnosticResult {
  const maxScore = DIMENSIONS.length * 3
  const score = DIMENSIONS.reduce((sum, dimension) => sum + OPTION_SCORE[answers[dimension] ?? 'none'], 0)
  const scorePct = Math.round((score / maxScore) * 100)
  const strengths = DIMENSIONS.filter((dimension) => OPTION_SCORE[answers[dimension] ?? 'none'] >= 2)
  const gaps = DIMENSIONS.filter((dimension) => OPTION_SCORE[answers[dimension] ?? 'none'] <= 1)

  return {
    scorePct,
    levelSignal: levelSignalForScore(scorePct),
    strengths,
    gaps,
    evidence: evidence?.trim() || undefined,
  }
}

export function buildDiagnosticSummary(result?: DiagnosticResult | null): string | null {
  if (!result) return null
  const strengths = result.strengths.length > 0 ? result.strengths.join(', ') : 'none yet'
  const gaps = result.gaps.length > 0 ? result.gaps.join(', ') : 'none obvious'
  const evidence = result.evidence ? ` Evidence: ${result.evidence}` : ''
  return `Baseline diagnostic: ${result.scorePct}% (${result.levelSignal}). Strengths: ${strengths}. Gaps: ${gaps}.${evidence}`
}

function levelSignalForScore(scorePct: number): DiagnosticLevelSignal {
  if (scorePct >= 88) return 'advanced'
  if (scorePct >= 70) return 'ready'
  if (scorePct >= 40) return 'developing'
  if (scorePct > 0) return 'starting'
  return 'unknown'
}
