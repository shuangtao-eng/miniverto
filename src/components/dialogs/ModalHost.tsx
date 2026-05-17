import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useUIStore } from '@/stores/ui-store'
import { CreateProjectDialog } from './CreateProjectDialog'
import { ReplanDialog } from './ReplanDialog'
import { CommandPalette } from './CommandPalette'
import { AssessmentRunner } from '@/components/assessment/AssessmentRunner'
import { AssessmentReport } from '@/components/assessment/AssessmentReport'

export function ModalHost() {
  const navigate = useNavigate()
  const activeModal = useUIStore((s) => s.activeModal)
  const assessmentType = useUIStore((s) => s.assessmentType)
  const openModal = useUIStore((s) => s.openModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const [assessScore, setAssessScore] = useState<{ correct: number; total: number } | null>(null)

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'k') {
        e.preventDefault()
        if (activeModal === 'cmd') closeModal()
        else openModal('cmd')
      }
      if (mod && e.key === 'n') {
        e.preventDefault()
        openModal('create')
      }
      if (mod && e.key === ',') {
        e.preventDefault()
        closeModal()
        navigate({ to: '/settings' })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeModal, openModal, closeModal, navigate])

  // Lock body scroll when modal is open
  useEffect(() => {
    const hasModal = activeModal !== 'none'
    if (hasModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [activeModal])

  return (
    <>
      {activeModal === 'create' && (
        <CreateProjectDialog onClose={closeModal} onCreated={closeModal} />
      )}
      {activeModal === 'replan' && (
        <ReplanDialog onClose={closeModal} />
      )}
      {activeModal === 'cmd' && (
        <CommandPalette onClose={closeModal} />
      )}
      {activeModal === 'assessment' && !assessScore && (
        <AssessmentRunner
          type={assessmentType}
          onComplete={(result) => setAssessScore(result)}
          onClose={closeModal}
        />
      )}
      {activeModal === 'assessment' && assessScore && (
        <AssessmentReport
          type={assessmentType}
          score={assessScore}
          onClose={() => { setAssessScore(null); closeModal() }}
          onContinue={() => { setAssessScore(null); closeModal() }}
        />
      )}
    </>
  )
}
