import { describe, expect, test, vi } from 'vitest'
import { ingestPastedTextMaterial, ingestTextFileMaterial } from './material-ingest'

describe('material ingest service', () => {
  test('uses browser fallback for pasted text when Tauri invoke is unavailable', async () => {
    const material = await ingestPastedTextMaterial({
      text: 'Rust ownership notes',
      invoke: undefined,
      now: () => 1000,
    })

    expect(material).toMatchObject({
      kind: 'text',
      status: 'ready',
      source: 'pasted',
      selected: true,
      note: 'Rust ownership notes',
    })
  })

  test('uses Tauri invoke for pasted text when available', async () => {
    const invoke = vi.fn().mockResolvedValue({
      id: 'mat-1',
      name: 'Pasted notes',
      kind: 'text',
      source: 'pasted',
      parser_status: 'ready',
      summary: 'Linear regression',
      created_at: 1000,
    })

    const material = await ingestPastedTextMaterial({
      text: 'Linear regression',
      invoke,
      now: () => 1000,
    })

    expect(invoke).toHaveBeenCalledWith('ingest_text_material', {
      request: expect.objectContaining({
        id: expect.stringContaining('pasted-'),
        name: 'Pasted notes',
        source: 'pasted',
        content: 'Linear regression',
        created_at: 1000,
      }),
    })
    expect(material.note).toBe('Linear regression')
  })

  test('reads text files before ingesting them', async () => {
    const file = new File(['Chapter 1\n\nChapter 2'], 'notes.md', { type: 'text/markdown' })
    const material = await ingestTextFileMaterial({
      file,
      invoke: undefined,
      now: () => 1000,
    })

    expect(material.name).toBe('notes.md')
    expect(material.note).toContain('Chapter 1')
    expect(material.status).toBe('ready')
  })
})
