import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMaterialStore } from '@/stores/material-store'
import { cn } from '@/lib/utils'
import { collectMaterialCounts, formatBytes, type LearningMaterial, type MaterialKind } from '@/data/materials'
import { getTauriInvoke } from '@/services/material-ingest'
import { deletePersistedMaterial, listPersistedMaterials } from '@/services/material-library'

type FilterKey = 'all' | MaterialKind

const FILTERS: FilterKey[] = ['all', 'text', 'document', 'slides', 'audio', 'unsupported']

export function MaterialsPage() {
  const { t } = useTranslation()
  const materials = useMaterialStore((s) => s.materials)
  const addMaterials = useMaterialStore((s) => s.addMaterials)
  const removeMaterial = useMaterialStore((s) => s.removeMaterial)
  const toggleSelected = useMaterialStore((s) => s.toggleSelected)
  const [filter, setFilter] = useState<FilterKey>('all')
  const counts = useMemo(() => collectMaterialCounts(materials), [materials])

  useEffect(() => {
    let active = true
    async function hydrate() {
      const invoke = await getTauriInvoke()
      const persisted = await listPersistedMaterials(invoke)
      if (active && persisted.length > 0) addMaterials(persisted)
    }

    void hydrate()
    return () => { active = false }
  }, [addMaterials])

  const visible = useMemo(
    () => filter === 'all' ? materials : materials.filter((material) => material.kind === filter),
    [filter, materials],
  )

  return (
    <div className="h-full overflow-y-auto px-8 py-7 flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-bold text-foreground tracking-[-0.5px] mb-1">
            {t('materials.title')}
          </h1>
          <p className="text-[13px] text-fg-3">
            {t('materials.summary', { total: counts.total, selected: materials.filter((m) => m.selected).length })}
          </p>
        </div>
        <div className="px-3.5 py-2 rounded-lg bg-info-bg border border-info text-info text-xs max-w-[360px] leading-normal">
          {t('materials.privacyNote')}
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'px-[13px] py-[5px] rounded-full text-xs border transition-all duration-fast',
              filter === key
                ? 'bg-accent text-accent-foreground border-accent-raw font-semibold'
                : 'bg-bg-2 text-fg-2 border-border hover:bg-bg-3',
            )}
          >
            {t(`materials.filters.${key}`)} · {key === 'all' ? counts.total : counts[key]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="flex-1 min-h-[320px] flex items-center justify-center border border-dashed border-border rounded-lg bg-bg-2">
          <div className="text-center max-w-[340px]">
            <div className="text-3xl mb-3">T</div>
            <h2 className="text-base font-semibold text-foreground mb-1">{t('materials.emptyTitle')}</h2>
            <p className="text-[13px] text-fg-3 leading-normal">{t('materials.emptyDescription')}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
          {visible.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              onToggle={() => toggleSelected(material.id)}
              onRemove={async () => {
                const invoke = await getTauriInvoke()
                await deletePersistedMaterial(material.id, invoke)
                removeMaterial(material.id)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MaterialCard({ material, onToggle, onRemove }: {
  material: LearningMaterial
  onToggle: () => void
  onRemove: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3.5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-accent-foreground text-sm font-bold shrink-0">
          {materialIcon(material.kind)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-foreground truncate">{material.name}</div>
          <div className="text-[11px] text-fg-3 mt-px">
            {t(`materials.filters.${material.kind}`)} · {formatBytes(material.sizeBytes)} · {t(`create.materials.status.${material.status}`)}
          </div>
        </div>
      </div>
      {material.note && (
        <p className="text-xs text-fg-2 leading-[1.6] line-clamp-3 bg-bg-2 rounded-md px-3 py-2">
          {material.note}
        </p>
      )}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onToggle}
          className={cn(
            'px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors duration-fast',
            material.selected
              ? 'bg-ok-bg border-ok text-ok'
              : 'bg-bg-2 border-border text-fg-2 hover:bg-bg-3',
          )}
        >
          {material.selected ? t('materials.selectedForPlanning') : t('materials.useForPlanning')}
        </button>
        <button
          onClick={onRemove}
          className="ml-auto px-3 py-1.5 rounded-lg text-[11px] font-medium bg-err-bg border border-err text-err hover:brightness-95 transition-colors duration-fast"
        >
          {t('common.delete')}
        </button>
      </div>
    </div>
  )
}

function materialIcon(kind: MaterialKind) {
  if (kind === 'text') return 'T'
  if (kind === 'document') return 'D'
  if (kind === 'slides') return 'S'
  if (kind === 'audio') return 'A'
  return '?'
}
