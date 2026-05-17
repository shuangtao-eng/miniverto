import { describe, expect, test, beforeEach, vi } from 'vitest'
import {
  buildBacklinks,
  buildTaskKnowledgeNoteBody,
  collectKnowledgeTags,
  extractWikiLinks,
  findKnowledgeNoteByTitle,
  listKnowledgeNotes,
  resolveWikiLinkStates,
  saveKnowledgeNote,
  searchKnowledgeNotes,
} from './knowledge-notes'
import type { KnowledgeNote, Task } from '@/types'

describe('knowledge notes', () => {
  beforeEach(() => {
    const storage = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
      },
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-27T12:00:00Z'))
  })

  test('extracts unique wiki links from markdown body', () => {
    expect(extractWikiLinks('Read [[Spacing Effect]] and [[Active Recall]]. Link [[Spacing Effect]] again.')).toEqual([
      'Spacing Effect',
      'Active Recall',
    ])
  })

  test('saves notes to local storage fallback and searches title body tags', async () => {
    await saveKnowledgeNote({
      title: 'Active Recall',
      body: 'Practice retrieval before rereading.',
      tags: ['method'],
    })

    const notes = await listKnowledgeNotes()

    expect(notes).toHaveLength(1)
    expect(notes[0]).toMatchObject({
      title: 'Active Recall',
      tags: ['method'],
      sourceType: 'manual',
    })
    expect(searchKnowledgeNotes(notes, 'retrieval')).toHaveLength(1)
    expect(searchKnowledgeNotes(notes, 'method')).toHaveLength(1)
  })

  test('builds backlinks by matching note titles from wiki links', () => {
    const notes: KnowledgeNote[] = [
      note('n1', 'Spacing Effect', 'Use spaced review.'),
      note('n2', 'Active Recall', 'Combine with [[Spacing Effect]].'),
      note('n3', 'PSET Practice', 'Use [[Spacing Effect]] after hard problems.'),
    ]

    expect(buildBacklinks(notes, 'n1').map((item) => item.title)).toEqual([
      'Active Recall',
      'PSET Practice',
    ])
  })

  test('collects tags with usage counts sorted by frequency then name', () => {
    const notes: KnowledgeNote[] = [
      note('n1', 'A', 'body', ['method', 'math']),
      note('n2', 'B', 'body', ['method', 'review']),
      note('n3', 'C', 'body', ['review']),
    ]

    expect(collectKnowledgeTags(notes)).toEqual([
      { tag: 'method', count: 2 },
      { tag: 'review', count: 2 },
      { tag: 'math', count: 1 },
    ])
  })

  test('searches notes with an optional active tag filter', () => {
    const notes: KnowledgeNote[] = [
      note('n1', 'Active Recall', 'Practice retrieval.', ['method']),
      note('n2', 'Linear Algebra', 'Matrix examples.', ['math']),
      note('n3', 'Recall Mistakes', 'Reflection log.', ['review']),
    ]

    expect(searchKnowledgeNotes(notes, 'recall', 'method').map((item) => item.id)).toEqual(['n1'])
    expect(searchKnowledgeNotes(notes, '', 'math').map((item) => item.id)).toEqual(['n2'])
    expect(searchKnowledgeNotes(notes, 'recall').map((item) => item.id)).toEqual(['n1', 'n3'])
  })

  test('finds notes by title case-insensitively and resolves wiki link states', () => {
    const notes: KnowledgeNote[] = [
      note('n1', 'Spacing Effect', 'Use spaced review.'),
      note('n2', 'Active Recall', 'Combine with [[Spacing Effect]] and [[Interleaving]].'),
    ]

    expect(findKnowledgeNoteByTitle(notes, 'spacing effect')?.id).toBe('n1')
    expect(resolveWikiLinkStates(notes, notes[1]!)).toEqual([
      { title: 'Spacing Effect', noteId: 'n1', exists: true },
      { title: 'Interleaving', exists: false },
    ])
  })

  test('builds rich task note body and tags from learning and assessment context', () => {
    const task: Task = {
      id: 'task-1',
      kind: 'practice',
      title: 'Matrix Practice',
      description: 'Solve matrix multiplication examples.',
      estimatedMinutes: 30,
      status: 'completed',
      learningContent: {
        overview: 'Learn the multiplication rule.',
        keyPoints: ['Rows meet columns'],
        steps: ['Review shape compatibility'],
        exercises: ['Compute AB'],
        reviewPrompt: 'Explain why BA may not exist.',
      },
      assessmentHistory: [{
        id: 'record-1',
        taskId: 'task-1',
        createdAt: '2026-04-29T10:00:00.000Z',
        correct: 6,
        total: 10,
        scorePct: 60,
        level: 'developing',
        levelLabel: 'Needs practice',
        passed: false,
        masterySummary: 'Can compute simple cases but misses shape checks.',
        weakBands: ['application'],
        needsReinforcement: true,
        nextPlan: {
          title: 'Shape drills',
          focus: ['shape compatibility'],
          actions: ['Do 5 shape checks before computing.'],
          durationDays: 2,
        },
      }],
    }

    const result = buildTaskKnowledgeNoteBody(task, 'I confuse row and column order.')

    expect(result.body).toContain('I confuse row and column order.')
    expect(result.body).toContain('Solve matrix multiplication examples.')
    expect(result.body).toContain('Explain why BA may not exist.')
    expect(result.body).toContain('Can compute simple cases but misses shape checks.')
    expect(result.tags).toEqual(['task-note', 'practice', 'needs-review'])
  })
})

function note(id: string, title: string, body: string, tags: string[] = []): KnowledgeNote {
  return {
    id,
    title,
    body,
    tags,
    links: extractWikiLinks(body),
    sourceType: 'manual',
    createdAt: '2026-04-27T12:00:00.000Z',
    updatedAt: '2026-04-27T12:00:00.000Z',
  }
}
