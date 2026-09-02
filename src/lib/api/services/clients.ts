import { apiClient } from '@/lib/api/client'
import type { ApiEnvelope } from '@/lib/api/types'

export type ClientCatalogScopeData = {
  device_type: 'desktop' | 'mobile'
  platform: 'windows' | 'mac-intel' | 'mac-apple-silicon' | 'linux' | 'ios' | 'android'
  sort_order: number
}

export type ClientCatalogItemData = {
  id: number
  slug: string
  name: string
  description: string
  logo_mode: 'upload' | 'url'
  logo_url?: string | null
  tags: string[]
  download_url: string
  docs_url?: string | null
  quick_import_enabled: boolean
  quick_import_url?: string | null
  subscription_template: 'singbox' | 'clash' | 'clashmeta' | 'stash' | 'surge' | 'surfboard'
  subscription_url: string
  scopes: ClientCatalogScopeData[]
}

export type ClientCatalogData = {
  clients: ClientCatalogItemData[]
  templates: string[]
  device_platforms: Record<string, string[]>
}

export async function getClientCatalog() {
  const response = await apiClient.get<ApiEnvelope<ClientCatalogData>>('/api/v1/user/client/fetch')
  return response.data.data
}
