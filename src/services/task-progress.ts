import type { Task } from '@/types'
import type { TaskAssessmentRecord } from '@/types'
import type { InvokeFn } from './material-ingest'

interface UpdatePersistedTaskProgressArgs {
  taskId: string
  status: Task['status']
  userNote?: string
  assessmentHistory?: TaskAssessmentRecord[]
  invoke?: InvokeFn
}

export async function updatePersistedTaskProgress(
  args: UpdatePersistedTaskProgressArgs,
): Promise<void> {
  if (!args.invoke) return
  await args.invoke('update_task_progress', {
      taskId: args.taskId,
      status: args.status,
      userNote: args.userNote,
      assessmentHistoryJson: args.assessmentHistory ? JSON.stringify(args.assessmentHistory) : null,
    })
}
