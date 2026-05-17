import type { LearningMaterial } from '@/data/materials'
import {
  classifyMaterial,
  createMaterialFromFile,
  createMaterialFromPastedText,
} from '@/data/materials'

export type InvokeFn = (command: string, args?: Record<string, unknown>) => Promise<unknown>

interface IngestOptions {
  invoke?: InvokeFn
  now?: () => number
}

interface PastedIngestOptions extends IngestOptions {
  text: string
}

interface FileIngestOptions extends IngestOptions {
  file: File
}

interface TauriMaterialRecord {
  id: string
  name: string
  kind: LearningMaterial['kind']
  source: LearningMaterial['source']
  parser_status: LearningMaterial['status']
  summary?: string | null
}

export async function getTauriInvoke(): Promise<InvokeFn | undefined> {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) return undefined
  const api = await import('@tauri-apps/api/core')
  return api.invoke as InvokeFn
}

export async function ingestPastedTextMaterial(options: PastedIngestOptions): Promise<LearningMaterial> {
  const text = options.text.trim()
  if (!text) throw new Error('Cannot ingest empty pasted material')

  const createdAt = options.now?.() ?? Date.now()
  const id = `pasted-${createdAt}-${text.length}`

  if (options.invoke) {
    const record = await options.invoke('ingest_text_material', {
      request: {
        id,
        name: 'Pasted notes',
        source: 'pasted',
        content: text,
        created_at: createdAt,
      },
    }) as TauriMaterialRecord

    return materialFromTauriRecord(record)
  }

  return createMaterialFromPastedText(text)
}

export async function ingestTextFileMaterial(options: FileIngestOptions): Promise<LearningMaterial> {
  const kind = classifyMaterial(options.file.name)
  if (kind !== 'text') return createMaterialFromFile(options.file)

  const content = await options.file.text()
  const createdAt = options.now?.() ?? Date.now()
  const id = `${options.file.name}-${options.file.size}-${options.file.lastModified}`

  if (options.invoke) {
    const record = await options.invoke('ingest_text_material', {
      request: {
        id,
        name: options.file.name,
        source: 'file',
        content,
        created_at: createdAt,
      },
    }) as TauriMaterialRecord

    return materialFromTauriRecord(record)
  }

  return {
    ...createMaterialFromFile(options.file),
    status: 'ready',
    note: content,
  }
}

function materialFromTauriRecord(record: TauriMaterialRecord): LearningMaterial {
  return {
    id: record.id,
    name: record.name,
    kind: record.kind,
    source: record.source,
    sizeBytes: new Blob([record.summary ?? record.name]).size,
    status: record.parser_status,
    selected: record.kind !== 'unsupported',
    note: record.summary ?? undefined,
  }
}
