import type { LearningMaterial } from '@/data/materials'
import type { MaterialStatus } from '@/data/materials'
import type { InvokeFn } from './material-ingest'

interface PersistedMaterialRecord {
  id: string
  name: string
  kind: LearningMaterial['kind']
  source: LearningMaterial['source']
  parser_status: MaterialStatus
  summary?: string | null
}

export async function listPersistedMaterials(invoke?: InvokeFn): Promise<LearningMaterial[]> {
  if (!invoke) return []
  const records = await invoke('list_materials') as PersistedMaterialRecord[]
  return records.map(materialFromPersistedRecord)
}

export async function deletePersistedMaterial(id: string, invoke?: InvokeFn): Promise<void> {
  if (!invoke) return
  await invoke('delete_material', { id })
}

function materialFromPersistedRecord(record: PersistedMaterialRecord): LearningMaterial {
  return {
    id: record.id,
    name: record.name,
    kind: record.kind,
    source: record.source,
    status: record.parser_status,
    selected: record.kind !== 'unsupported',
    sizeBytes: new Blob([record.summary ?? record.name]).size,
    note: record.summary ?? undefined,
  }
}
