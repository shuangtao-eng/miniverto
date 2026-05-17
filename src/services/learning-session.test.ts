import { describe, expect, test } from 'vitest'
import { buildLearningSession } from './learning-session'
import type { Task } from '@/types'

describe('learning session', () => {
  test('builds a page-ready lesson model from rich task content', () => {
    const task: Task = {
      id: 't1',
      kind: 'reading',
      title: 'Understand ownership',
      estimatedMinutes: 45,
      status: 'pending',
      learningContent: {
        overview: 'Miniverto lesson.',
        prerequisites: ['Know what a variable binding is', 'Have the Rust Book chapter open'],
        glossary: [
          {
            term: 'Owner',
            meaning: 'The binding responsible for cleanup.',
            example: 's owns the String until it is moved.',
          },
        ],
        deliverable: {
          title: 'Ownership explanation note',
          format: 'Annotated note',
          acceptanceCheck: 'Explains the active owner after each line.',
        },
        teachingScript: [
          {
            id: 'teach-1',
            title: 'Ownership rule',
            body: 'Each value has one owner.',
            example: 'Moving a String transfers ownership.',
          },
        ],
        answerKey: [
          {
            practiceId: 'p1',
            expectedAnswer: 'The active owner is b.',
            checkMethod: 'Names owner after each line.',
          },
        ],
        reviewCards: [
          {
            front: 'Who owns the value?',
            back: 'The latest binding after a move.',
            tag: 'ownership',
          },
        ],
        nextStepHint: 'Practice borrowing after ownership.',
        keyPoints: ['Owner', 'Move', 'Borrow'],
        steps: ['Read', 'Recall'],
        exercises: ['Explain a move'],
        reviewPrompt: 'Explain ownership.',
        learningObjectives: [
          {
            id: 'o1',
            outcome: 'Explain ownership transfers.',
            evidence: 'Annotate two code snippets correctly.',
          },
        ],
        conceptMap: [
          {
            id: 'owner',
            title: 'Owner',
            description: 'The binding responsible for cleanup.',
            links: ['move'],
          },
        ],
        workedExample: {
          title: 'Trace a move',
          scenario: 'A String moves from a to b.',
          steps: ['Create a', 'Assign a to b', 'Explain why a is invalid'],
          takeaway: 'The new binding owns the value.',
        },
        practiceSet: [
          {
            id: 'p1',
            level: 'foundation',
            prompt: 'Mark the active owner.',
            expectedOutcome: 'The active owner is identified.',
          },
        ],
        commonMistakes: [
          {
            mistake: 'Treating moves as copies.',
            correction: 'Check Copy behavior before reusing a binding.',
          },
        ],
        completionRubric: [
          {
            criterion: 'Transfer reasoning',
            target: 'Explains why moved bindings cannot be reused.',
          },
        ],
        lessonBlocks: [
          {
            id: 'b1',
            type: 'concept',
            title: 'Mental model',
            body: 'Ownership has one active owner.',
            mediaSuggestionIds: ['m1'],
            citationIds: ['c1'],
          },
        ],
        materialCitations: [
          {
            id: 'c1',
            materialId: 'material-1',
            materialName: 'Ownership workshop notes.md',
            summary: 'The learner confuses moves with copies.',
            reason: 'Use this note to focus the explanation on ownership transfer.',
          },
        ],
        mediaSuggestions: [
          {
            id: 'm1',
            type: 'diagram',
            title: 'Ownership diagram',
            purpose: 'Make movement visible.',
            promptOrQuery: 'Rust ownership transfer diagram',
            placement: 'Mental model',
          },
        ],
        quickCheck: ['Who owns the value?'],
      },
    }

    const session = buildLearningSession(task)

    expect(session.blocks[0]).toMatchObject({
      title: 'Mental model',
      media: [expect.objectContaining({ title: 'Ownership diagram' })],
      citations: [expect.objectContaining({ materialName: 'Ownership workshop notes.md' })],
    })
    expect(session.citations).toEqual([
      expect.objectContaining({ materialId: 'material-1' }),
    ])
    expect(session.quickCheck).toEqual(['Who owns the value?'])
    expect(session.prerequisites).toEqual(['Know what a variable binding is', 'Have the Rust Book chapter open'])
    expect(session.glossary).toEqual([
      expect.objectContaining({ term: 'Owner' }),
    ])
    expect(session.deliverable).toEqual(expect.objectContaining({
      title: 'Ownership explanation note',
      acceptanceCheck: 'Explains the active owner after each line.',
    }))
    expect(session.teachingScript).toEqual([
      expect.objectContaining({ title: 'Ownership rule' }),
    ])
    expect(session.answerKey).toEqual([
      expect.objectContaining({ practiceId: 'p1' }),
    ])
    expect(session.reviewCards).toEqual([
      expect.objectContaining({ tag: 'ownership' }),
    ])
    expect(session.nextStepHint).toBe('Practice borrowing after ownership.')
    expect(session.learningObjectives).toEqual([
      expect.objectContaining({ outcome: 'Explain ownership transfers.' }),
    ])
    expect(session.conceptMap).toEqual([
      expect.objectContaining({ id: 'owner' }),
    ])
    expect(session.workedExample).toEqual(expect.objectContaining({ title: 'Trace a move' }))
    expect(session.practiceSet).toEqual([
      expect.objectContaining({ level: 'foundation' }),
    ])
    expect(session.commonMistakes).toEqual([
      expect.objectContaining({ mistake: 'Treating moves as copies.' }),
    ])
    expect(session.completionRubric).toEqual([
      expect.objectContaining({ criterion: 'Transfer reasoning' }),
    ])
    expect(session.outline).toEqual(['Mental model'])
  })
})
