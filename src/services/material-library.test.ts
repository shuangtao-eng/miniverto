import { describe, expect, test, vi } from 'vitest'
import { deletePersistedMaterial, listPersistedMaterials } from './material-library'

describe('material library persistence service', () => {
  test('returns an empty list when Tauri invoke is unavailable', async () => {
    await expect(listPersistedMaterials(undefined)).resolves.toEqual([])
  })

  test('maps Tauri material records to frontend materials', async () => {
    const invoke = vi.fn().mockResolvedValue([
      {
        id: 'm1',
        name: 'notes.md',
        kind: 'text',
        source: 'pasted',
        parser_status: 'ready',
        summary: 'Saved note',
        created_at: 1000,
      },
    ])

    const materials = await listPersistedMaterials(invoke)

    expect(invoke).toHaveBeenCalledWith('list_materials')
    expect(materials[0]).toMatchObject({
      id: 'm1',
      name: 'notes.md',
      kind: 'text',
      status: 'ready',
      note: 'Saved note',
      selected: true,
    })
  })

  test('deletes persisted material when Tauri invoke is available', async () => {
    const invoke = vi.fn().mockResolvedValue(undefined)

    await deletePersistedMaterial('m1', invoke)

    expect(invoke).toHaveBeenCalledWith('delete_material', { id: 'm1' })
  })
})
