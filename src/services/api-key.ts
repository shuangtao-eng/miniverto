import type { InvokeFn } from './material-ingest'

export async function saveApiKey(providerId: string, apiKey: string, invoke?: InvokeFn): Promise<void> {
  if (!invoke) return
  await invoke('save_api_key', { providerId, apiKey })
}

export async function hasApiKey(providerId: string, invoke?: InvokeFn): Promise<boolean> {
  if (!invoke) return false
  return await invoke('has_api_key', { providerId }) as boolean
}

export async function deleteApiKey(providerId: string, invoke?: InvokeFn): Promise<void> {
  if (!invoke) return
  await invoke('delete_api_key', { providerId })
}
