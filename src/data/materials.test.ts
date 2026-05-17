import { describe, expect, test } from 'vitest'
import { classifyMaterial, collectMaterialCounts, formatBytes, type LearningMaterial } from './materials'

describe('materials', () => {
  test.each([
    ['slides.PPTX', 'slides'],
    ['lecture.pdf', 'document'],
    ['notes.md', 'text'],
    ['recording.m4a', 'audio'],
    ['unknown.zip', 'unsupported'],
  ] as const)('classifies %s as %s', (fileName, expected) => {
    expect(classifyMaterial(fileName)).toBe(expected)
  })

  test('formats byte sizes for display', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB')
  })

  test('collects material counts from a stable material list', () => {
    const materials: LearningMaterial[] = [
      material('a', 'text'),
      material('b', 'document'),
      material('c', 'document'),
      material('d', 'audio'),
      material('e', 'unsupported'),
    ]

    expect(collectMaterialCounts(materials)).toEqual({
      total: 5,
      text: 1,
      document: 2,
      slides: 0,
      audio: 1,
      unsupported: 1,
    })
  })
})

function material(id: string, kind: LearningMaterial['kind']): LearningMaterial {
  return {
    id,
    name: id,
    kind,
    sizeBytes: 1,
    status: kind === 'unsupported' ? 'unsupported' : 'ready',
    selected: kind !== 'unsupported',
    source: 'file',
  }
}
