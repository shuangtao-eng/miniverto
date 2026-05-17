import { describe, expect, test } from 'vitest'
import {
  buildDiagnosticSummary,
  scoreDiagnosticAnswers,
  type DiagnosticAnswerMap,
} from './diagnostic-assessment'

describe('diagnostic assessment', () => {
  test('scores baseline answers into a concrete learner level signal', () => {
    const answers: DiagnosticAnswerMap = {
      concept: 'solid',
      application: 'assisted',
      troubleshooting: 'weak',
      output: 'none',
    }

    const result = scoreDiagnosticAnswers(answers, 'I can explain terms but get stuck applying them.')

    expect(result.scorePct).toBe(50)
    expect(result.levelSignal).toBe('developing')
    expect(result.strengths).toContain('concept')
    expect(result.gaps).toEqual(['troubleshooting', 'output'])
  })

  test('builds a plan-ready summary from diagnostic result', () => {
    const summary = buildDiagnosticSummary({
      scorePct: 75,
      levelSignal: 'ready',
      strengths: ['concept', 'application'],
      gaps: ['troubleshooting'],
      evidence: 'Built one small project but debugging is slow.',
    })

    expect(summary).toContain('75%')
    expect(summary).toContain('ready')
    expect(summary).toContain('concept, application')
    expect(summary).toContain('troubleshooting')
    expect(summary).toContain('debugging is slow')
  })
})
