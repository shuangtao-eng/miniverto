import { useEffect, useMemo, useState } from 'react'
import {
  buildBacklinks,
  collectKnowledgeTags,
  deleteKnowledgeNote,
  findKnowledgeNoteByTitle,
  listKnowledgeNotes,
  resolveWikiLinkStates,
  saveKnowledgeNote,
  searchKnowledgeNotes,
} from '@/services/knowledge-notes'
import { getTauriInvoke, type InvokeFn } from '@/services/material-ingest'
import type { KnowledgeNote, KnowledgeNoteSourceType } from '@/types'
import { cn } from '@/lib/utils'

const SOURCE_LABELS: Record<KnowledgeNoteSourceType, string> = {
  manual: '手动笔记',
  task: '学习任务',
  material: '学习资料',
  assessment: '测评记录',
}

export function NotesPage() {
  const [invoke, setInvoke] = useState<InvokeFn | undefined>()
  const [notes, setNotes] = useState<KnowledgeNote[]>([])
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getTauriInvoke()
      .then((tauriInvoke) => {
        if (!cancelled) setInvoke(() => tauriInvoke)
        return listKnowledgeNotes(tauriInvoke)
      })
      .then((loaded) => {
        if (!cancelled) {
          setNotes(loaded)
          if (loaded[0]) selectNote(loaded[0])
        }
      })
      .catch(() => {
        if (!cancelled) {
          void listKnowledgeNotes().then((loaded) => {
            setNotes(loaded)
            if (loaded[0]) selectNote(loaded[0])
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const visibleNotes = useMemo(() => searchKnowledgeNotes(notes, query, activeTag), [notes, query, activeTag])
  const selectedNote = notes.find((note) => note.id === selectedId) ?? null
  const backlinks = selectedNote ? buildBacklinks(notes, selectedNote.id) : []
  const tagSummaries = useMemo(() => collectKnowledgeTags(notes), [notes])
  const outgoingLinks = selectedNote ? resolveWikiLinkStates(notes, selectedNote) : []

  function selectNote(note: KnowledgeNote) {
    setSelectedId(note.id)
    setTitle(note.title)
    setBody(note.body)
    setTagsText(note.tags.join(', '))
    setError(null)
  }

  function selectNoteById(id: string) {
    const note = notes.find((item) => item.id === id)
    if (note) selectNote(note)
  }

  function startNewNote() {
    setSelectedId(null)
    setTitle('')
    setBody('')
    setTagsText('')
    setError(null)
  }

  async function handleOpenWikiLink(titleToOpen: string) {
    setError(null)
    const existing = findKnowledgeNoteByTitle(notes, titleToOpen)
    if (existing) {
      selectNote(existing)
      return
    }

    try {
      const saved = await saveKnowledgeNote({
        title: titleToOpen,
        body: '',
        tags: ['linked-note'],
        sourceType: 'manual',
        invoke,
      })
      const next = [saved, ...notes]
      setNotes(next)
      selectNote(saved)
    } catch {
      setError('创建双链笔记失败，请稍后重试。')
    }
  }

  async function handleSave() {
    setError(null)
    try {
      const saved = await saveKnowledgeNote({
        id: selectedId ?? undefined,
        title,
        body,
        tags: tagsText.split(','),
        sourceType: selectedNote?.sourceType ?? 'manual',
        projectId: selectedNote?.projectId,
        taskId: selectedNote?.taskId,
        materialId: selectedNote?.materialId,
        invoke,
      })
      const next = [saved, ...notes.filter((note) => note.id !== saved.id)]
      setNotes(next)
      selectNote(saved)
    } catch {
      setError('保存失败，请稍后重试。')
    }
  }

  async function handleDelete() {
    if (!selectedId) return
    setError(null)
    try {
      await deleteKnowledgeNote(selectedId, invoke)
      const next = notes.filter((note) => note.id !== selectedId)
      setNotes(next)
      if (next[0]) selectNote(next[0])
      else startNewNote()
    } catch {
      setError('删除失败，笔记仍保留在当前列表中。')
    }
  }

  return (
    <div className="grid h-full grid-cols-[280px_minmax(0,1fr)_300px] overflow-hidden bg-bg">
      <aside className="flex min-w-0 flex-col gap-3 border-r border-border bg-bg-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold text-foreground">知识库</h1>
            <p className="mt-1 text-[11px] leading-relaxed text-fg-3">长期笔记、双链和学习沉淀</p>
          </div>
          <button
            onClick={startNewNote}
            className="shrink-0 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
          >
            新建
          </button>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索标题、正文、标签、双链"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
        />

        <section className="rounded-lg border border-border bg-surface px-3 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-[11px] font-semibold text-fg-3">标签</div>
            {activeTag && (
              <button onClick={() => setActiveTag(null)} className="text-[11px] text-primary hover:text-primary-hover">
                清除
              </button>
            )}
          </div>
          <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
            {tagSummaries.length === 0 ? (
              <span className="text-[11px] text-fg-3">暂无标签</span>
            ) : (
              tagSummaries.map((item) => (
                <button
                  key={item.tag}
                  onClick={() => setActiveTag((current) => current === item.tag ? null : item.tag)}
                  className={cn(
                    'rounded px-2 py-1 text-[11px] transition-colors duration-fast',
                    activeTag === item.tag
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-bg-2 text-fg-2 hover:bg-bg-3 hover:text-foreground',
                  )}
                >
                  {item.tag} · {item.count}
                </button>
              ))
            )}
          </div>
        </section>

        <div className="flex-1 overflow-y-auto">
          <div className="mb-2 text-[11px] text-fg-3">{visibleNotes.length} 条笔记</div>
          <div className="flex flex-col gap-1.5">
            {visibleNotes.length === 0 ? (
              <div className="rounded-lg border border-border bg-surface px-3 py-4 text-[12px] leading-relaxed text-fg-3">
                没有找到匹配的笔记。
              </div>
            ) : (
              visibleNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left transition-colors duration-fast',
                    selectedId === note.id
                      ? 'border-accent-raw bg-accent text-accent-foreground'
                      : 'border-border bg-surface text-fg-2 hover:bg-bg-3',
                  )}
                >
                  <div className="truncate text-xs font-semibold">{note.title}</div>
                  <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed opacity-75">
                    {note.body || '空白笔记'}
                  </div>
                  {note.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded bg-bg-2 px-1.5 py-0.5 text-[10px] opacity-80">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      <main className="min-w-0 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-[900px] flex-col gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="笔记标题"
            className="w-full border-0 border-b border-border bg-transparent px-1 py-2 font-display text-2xl font-bold text-foreground outline-none focus:border-primary"
          />
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="标签，用逗号分隔"
            className="w-full rounded-lg border border-border bg-bg-2 px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="写下长期可复用的知识。可以用 [[笔记标题]] 连接另一条笔记。"
            className="min-h-[480px] w-full resize-y rounded-lg border border-border bg-surface px-4 py-3 text-[13px] leading-[1.8] text-foreground outline-none focus:border-primary"
          />

          {error && (
            <div className="rounded-lg border border-err bg-err-bg px-3 py-2 text-[12px] text-err">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] text-fg-3">
              {selectedNote ? `更新于 ${formatDate(selectedNote.updatedAt)}` : '新笔记尚未保存'}
            </div>
            <div className="flex gap-2">
              {selectedId && (
                <button
                  onClick={() => void handleDelete()}
                  className="rounded border border-err bg-err-bg px-3 py-2 text-xs font-medium text-err hover:brightness-95"
                >
                  删除
                </button>
              )}
              <button
                onClick={() => void handleSave()}
                className="rounded bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
              >
                保存笔记
              </button>
            </div>
          </div>
        </div>
      </main>

      <aside className="min-w-0 overflow-y-auto border-l border-border bg-surface p-4">
        <div className="flex flex-col gap-4">
          <ContextSection title="来源">
            {selectedNote ? (
              <div className="grid gap-2 text-[12px] leading-relaxed text-fg-2">
                <div>{SOURCE_LABELS[selectedNote.sourceType]}</div>
                {selectedNote.projectId && <MetaLine label="项目" value={selectedNote.projectId} />}
                {selectedNote.taskId && <MetaLine label="任务" value={selectedNote.taskId} />}
                {selectedNote.materialId && <MetaLine label="资料" value={selectedNote.materialId} />}
              </div>
            ) : (
              <EmptyText>选择或保存一条笔记后显示来源。</EmptyText>
            )}
          </ContextSection>

          <ContextSection title="双链">
            {!selectedNote ? (
              <EmptyText>当前没有选中的笔记。</EmptyText>
            ) : outgoingLinks.length === 0 ? (
              <EmptyText>正文里还没有 [[双链]]。</EmptyText>
            ) : (
              <div className="grid gap-2">
                {outgoingLinks.map((link) => (
                  <button
                    key={link.title}
                    onClick={() => {
                      if (link.exists && link.noteId) selectNoteById(link.noteId)
                      else void handleOpenWikiLink(link.title)
                    }}
                    className={cn(
                      'rounded-md border px-3 py-2 text-left text-[12px] transition-colors duration-fast',
                      link.exists
                        ? 'border-border bg-bg-2 text-fg-2 hover:border-primary hover:text-foreground'
                        : 'border-primary/40 bg-accent text-accent-foreground hover:border-primary',
                    )}
                  >
                    {link.exists ? link.title : `创建：${link.title}`}
                  </button>
                ))}
              </div>
            )}
          </ContextSection>

          <ContextSection title="反向链接">
            {!selectedNote ? (
              <EmptyText>当前没有选中的笔记。</EmptyText>
            ) : backlinks.length === 0 ? (
              <EmptyText>还没有其他笔记链接到这里。</EmptyText>
            ) : (
              <div className="grid gap-2">
                {backlinks.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className="rounded-md bg-bg-2 px-3 py-2 text-left text-xs text-fg-2 hover:bg-bg-3 hover:text-foreground"
                  >
                    {note.title}
                  </button>
                ))}
              </div>
            )}
          </ContextSection>
        </div>
      </aside>
    </div>
  )
}

function ContextSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-bg-2 px-3 py-3">
      <div className="mb-2 text-xs font-semibold text-foreground">{title}</div>
      {children}
    </section>
  )
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-surface px-2 py-1.5">
      <span className="text-fg-3">{label}：</span>
      <span className="break-all text-fg-2">{value}</span>
    </div>
  )
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] leading-relaxed text-fg-3">{children}</div>
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}
