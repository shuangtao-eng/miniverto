import { describe, expect, test } from 'vitest'
import { createMaterialLibrary } from './material-store'
import type { LearningMaterial } from '@/data/materials'

const baseMaterial: LearningMaterial = {
  id: 'm1',
  name: 'notes.md',
  kind: 'text',
  sizeBytes: 120,
  status: 'ready',
  selected: true,
  source: 'pasted',
  note: 'Linear regression notes',
}

describe('material library store', () => {
  test('adds, selects, and removes materials', () => {
    const library = createMaterialLibrary()

    library.getState().addMaterials([baseMaterial])
    expect(library.getState().materials).toHaveLength(1)

    library.getState().toggleSelected('m1')
    expect(library.getState().materials[0]?.selected).toBe(false)

    library.getState().removeMaterial('m1')
    expect(library.getState().materials).toHaveLength(0)
  })

  test('groups material counts by kind', () => {
    const library = createMaterialLibrary()

    library.getState().addMaterials([
      baseMaterial,
      { ...baseMaterial, id: 'm2', name: 'slides.pptx', kind: 'slides', status: 'needs-parser' },
    ])

    expect(library.getState().getCounts()).toEqual({
      total: 2,
      text: 1,
      document: 0,
      slides: 1,
      audio: 0,
      unsupported: 0,
    })
  })
})
