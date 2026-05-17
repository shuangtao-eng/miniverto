import { useEffect, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { StatusBar } from './StatusBar'
import { ModalHost } from '@/components/dialogs/ModalHost'
import { getTauriInvoke } from '@/services/material-ingest'
import { listPersistedProjects } from '@/services/project-library'
import { useProjectStore } from '@/stores/project-store'

export function AppLayout({ children }: { children: ReactNode }) {
  const setProjects = useProjectStore((s) => s.setProjects)

  useEffect(() => {
    let active = true
    async function hydrateProjects() {
      const invoke = await getTauriInvoke()
      const persisted = await listPersistedProjects(invoke)
      if (active && persisted.length > 0) setProjects(persisted)
    }

    void hydrateProjects()
    return () => { active = false }
  }, [setProjects])

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
      <StatusBar />
      <ModalHost />
    </div>
  )
}
