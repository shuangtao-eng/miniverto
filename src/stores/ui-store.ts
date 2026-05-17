import { create } from 'zustand'
import type { ModalType, AssessmentType } from '@/types'

interface UIState {
  sidebarCollapsed: boolean
  isOffline: boolean
  isGenerating: boolean
  generationText: string
  generationProgress: number
  activeModal: ModalType
  assessmentType: AssessmentType

  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  setOffline: (v: boolean) => void
  setGenerating: (v: boolean, text?: string) => void
  setGenerationProgress: (v: number) => void
  openModal: (modal: ModalType) => void
  closeModal: () => void
  setAssessmentType: (t: AssessmentType) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  isOffline: false,
  isGenerating: false,
  generationText: '',
  generationProgress: 0,
  activeModal: 'none',
  assessmentType: 'baseline',

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setOffline: (v) => set({ isOffline: v }),
  setGenerating: (v, text) => set({ isGenerating: v, generationText: text ?? '', generationProgress: 0 }),
  setGenerationProgress: (v) => set({ generationProgress: v }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: 'none' }),
  setAssessmentType: (t) => set({ assessmentType: t }),
}))
