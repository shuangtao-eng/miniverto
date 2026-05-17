import type { KnowledgeNote, KnowledgeNoteSourceType, Task } from '@/types'
import type { InvokeFn } from './material-ingest'

const STORAGE_KEY = 'miniverto.knowledgeNotes.v1'

export interface KnowledgeTagSummary {
  tag: string
  count: number
}

export interface WikiLinkState {
  title: string
  noteId?: string
  exists: boolean
}

export interface TaskKnowledgeNoteDraft {
  body: string
  tags: string[]
}

interface PersistedKnowledgeNote {
  id: string
  title: string
  body: string
  tags_json: string
  links_json: string
  source_type: KnowledgeNoteSourceType
  project_id?: string | null
  task_id?: string | null
  material_id?: string | null
  created_at: string
  updated_at: string
}

interface SaveKnowledgeNoteArgs {
  id?: string
  title: string
  body: string
  tags?: string[]
  sourceType?: KnowledgeNoteSourceType
  projectId?: string
  taskId?: string
  materialId?: string
  invoke?: InvokeFn
}

export function extractWikiLinks(body: string): string[] {
  const links: string[] = []
  const pattern = /\[\[([^\]\n]+)\]\]/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(body)) !== null) {
    const title = (match[1] ?? '').trim()
    if (title && !links.includes(title)) links.push(title)
  }
  return links
}

export async function saveKnowledgeNote(args: SaveKnowledgeNoteArgs): Promise<KnowledgeNote> {
  const now = new Date().toISOString()
  const existing = args.id ? (await listKnowledgeNotes(args.invoke)).find((note) => note.id === args.id) : undefined
  const note: KnowledgeNote = {
    id: args.id ?? `note-${Date.now()}`,
    title: args.title.trim() || 'Untitled note',
    body: args.body,
    tags: normalizeTags(args.tags ?? existing?.tags ?? []),
    links: extractWikiLinks(args.body),
    sourceType: args.sourceType ?? existing?.sourceType ?? 'manual',
    projectId: args.projectId ?? existing?.projectId,
    taskId: args.taskId ?? existing?.taskId,
    materialId: args.materialId ?? existing?.materialId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  if (args.invoke) {
    await args.invoke('upsert_note', { note: toPersistedNote(note) })
    return note
  }

  const notes = await listKnowledgeNotes()
  writeLocalNotes([note, ...notes.filter((item) => item.id !== note.id)])
  return note
}

export async function listKnowledgeNotes(invoke?: InvokeFn): Promise<KnowledgeNote[]> {
  if (invoke) {
    const records = await invoke('list_notes') as PersistedKnowledgeNote[]
    return records.map(fromPersistedNote)
  }

  return readLocalNotes()
}

export async function deleteKnowledgeNote(id: string, invoke?: InvokeFn): Promise<void> {
  if (invoke) {
    await invoke('delete_note', { id })
    return
  }
  writeLocalNotes(readLocalNotes().filter((note) => note.id !== id))
}

export function searchKnowledgeNotes(
  notes: KnowledgeNote[],
  query: string,
  activeTag?: string | null,
): KnowledgeNote[] {
  const needle = query.trim().toLocaleLowerCase()
  const tagFilter = activeTag?.trim()
  return notes.filter((note) => {
    if (tagFilter && !note.tags.includes(tagFilter)) return false
    if (!needle) return true

    const haystack = [note.title, note.body, note.tags.join(' '), note.links.join(' ')]
      .join(' ')
      .toLocaleLowerCase()
    return haystack.includes(needle)
  })
}

export function buildBacklinks(notes: KnowledgeNote[], targetNoteId: string): KnowledgeNote[] {
  const target = notes.find((note) => note.id === targetNoteId)
  if (!target) return []
  return notes.filter((note) => note.id !== target.id && note.links.includes(target.title))
}

export function collectKnowledgeTags(notes: KnowledgeNote[]): KnowledgeTagSummary[] {
  const counts = new Map<string, number>()
  notes.forEach((note) => {
    note.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1))
  })
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

export function findKnowledgeNoteByTitle(notes: KnowledgeNote[], title: string): KnowledgeNote | undefined {
  const normalizedTitle = normalizeTitle(title)
  return notes.find((note) => normalizeTitle(note.title) === normalizedTitle)
}

export function resolveWikiLinkStates(notes: KnowledgeNote[], note: KnowledgeNote): WikiLinkState[] {
  return note.links.map((title) => {
    const linkedNote = findKnowledgeNoteByTitle(notes, title)
    return {
      title,
      noteId: linkedNote?.id,
      exists: Boolean(linkedNote),
    }
  })
}

export function buildTaskKnowledgeNoteBody(task: Task, userNote: string): TaskKnowledgeNoteDraft {
  const latestAssessment = latestTaskAssessment(task)
  const body = [
    userNote.trim() || task.description || task.learningContent?.overview || '',
    task.description ? `## 任务背景\n${task.description}` : '',
    task.learningContent?.reviewPrompt ? `## 复习提示\n${task.learningContent.reviewPrompt}` : '',
    latestAssessment ? [
      '## 最近课后测评',
      `${latestAssessment.scorePct}% · ${latestAssessment.levelLabel}`,
      latestAssessment.masterySummary,
      latestAssessment.nextPlan.focus.length > 0 ? `建议复习：${latestAssessment.nextPlan.focus.join('、')}` : '',
    ].filter(Boolean).join('\n') : '',
  ].filter(Boolean).join('\n\n')

  const tags = normalizeTags([
    'task-note',
    task.kind,
    latestAssessment?.needsReinforcement ? 'needs-review' : '',
  ])

  return { body, tags }
}

function normalizeTitle(title: string): string {
  return title.trim().toLocaleLowerCase()
}

function latestTaskAssessment(task: Task) {
  const sorted = task.assessmentHistory?.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)) ?? []
  return sorted.length > 0 ? sorted[sorted.length - 1] : null
}

function normalizeTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)))
}

function readLocalNotes(): KnowledgeNote[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const notes = JSON.parse(raw) as KnowledgeNote[]
    return Array.isArray(notes) ? notes : []
  } catch {
    return []
  }
}

function writeLocalNotes(notes: KnowledgeNote[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

function toPersistedNote(note: KnowledgeNote): PersistedKnowledgeNote {
  return {
    id: note.id,
    title: note.title,
    body: note.body,
    tags_json: JSON.stringify(note.tags),
    links_json: JSON.stringify(note.links),
    source_type: note.sourceType,
    project_id: note.projectId ?? null,
    task_id: note.taskId ?? null,
    material_id: note.materialId ?? null,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  }
}

function fromPersistedNote(record: PersistedKnowledgeNote): KnowledgeNote {
  return {
    id: record.id,
    title: record.title,
    body: record.body,
    tags: parseJsonArray(record.tags_json),
    links: parseJsonArray(record.links_json),
    sourceType: record.source_type,
    projectId: record.project_id ?? undefined,
    taskId: record.task_id ?? undefined,
    materialId: record.material_id ?? undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  }
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}
