import { create, type StoreApi, type UseBoundStore } from 'zustand'
import type { LearningMaterial, MaterialKind } from '@/data/materials'

export interface MaterialCounts extends Record<MaterialKind | 'total', number> {}

interface MaterialState {
  materials: LearningMaterial[]
  addMaterials: (materials: LearningMaterial[]) => void
  removeMaterial: (id: string) => void
  toggleSelected: (id: string) => void
  getCounts: () => MaterialCounts
}

export function createMaterialLibrary(): UseBoundStore<StoreApi<MaterialState>> {
  return create<MaterialState>((set, get) => ({
    materials: [],
    addMaterials: (materials) =>
      set((state) => {
        const existing = new Map(state.materials.map((material) => [material.id, material]))
        for (const material of materials) existing.set(material.id, material)
        return { materials: Array.from(existing.values()) }
      }),
    removeMaterial: (id) =>
      set((state) => ({ materials: state.materials.filter((material) => material.id !== id) })),
    toggleSelected: (id) =>
      set((state) => ({
        materials: state.materials.map((material) =>
          material.id === id ? { ...material, selected: !material.selected } : material,
        ),
      })),
    getCounts: () => {
      const counts: MaterialCounts = {
        total: 0,
        text: 0,
        document: 0,
        slides: 0,
        audio: 0,
        unsupported: 0,
      }

      for (const material of get().materials) {
        counts.total += 1
        counts[material.kind] += 1
      }

      return counts
    },
  }))
}

export const useMaterialStore = createMaterialLibrary()
