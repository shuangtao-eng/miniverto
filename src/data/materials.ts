export type MaterialKind = 'text' | 'document' | 'slides' | 'audio' | 'unsupported'
export type MaterialStatus = 'ready' | 'queued' | 'processing' | 'needs-parser' | 'unsupported' | 'failed'

export interface LearningMaterial {
  id: string
  name: string
  kind: MaterialKind
  sizeBytes: number
  status: MaterialStatus
  selected: boolean
  source: 'file' | 'pasted'
  note?: string
}

export type MaterialCounts = Record<MaterialKind | 'total', number>

const EXTENSIONS: Record<MaterialKind, string[]> = {
  text: ['txt', 'md', 'markdown'],
  document: ['pdf', 'docx'],
  slides: ['ppt', 'pptx'],
  audio: ['mp3', 'm4a', 'wav'],
  unsupported: [],
}

export function classifyMaterial(fileName: string): MaterialKind {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (!ext) return 'unsupported'

  for (const [kind, extensions] of Object.entries(EXTENSIONS) as Array<[MaterialKind, string[]]>) {
    if (extensions.includes(ext)) return kind
  }

  return 'unsupported'
}

export function getInitialMaterialStatus(kind: MaterialKind): MaterialStatus {
  if (kind === 'unsupported') return 'unsupported'
  if (kind === 'text') return 'ready'
  return 'needs-parser'
}

export function createMaterialFromFile(file: File): LearningMaterial {
  const kind = classifyMaterial(file.name)
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    kind,
    sizeBytes: file.size,
    status: getInitialMaterialStatus(kind),
    selected: kind !== 'unsupported',
    source: 'file',
  }
}

export function createMaterialFromPastedText(text: string): LearningMaterial {
  const trimmed = text.trim()
  return {
    id: `pasted-${trimmed.length}-${Date.now()}`,
    name: 'Pasted notes',
    kind: 'text',
    sizeBytes: new Blob([trimmed]).size,
    status: 'ready',
    selected: true,
    source: 'pasted',
    note: trimmed,
  }
}

export function collectMaterialCounts(materials: LearningMaterial[]): MaterialCounts {
  const counts: MaterialCounts = {
    total: 0,
    text: 0,
    document: 0,
    slides: 0,
    audio: 0,
    unsupported: 0,
  }

  for (const material of materials) {
    counts.total += 1
    counts[material.kind] += 1
  }

  return counts
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
