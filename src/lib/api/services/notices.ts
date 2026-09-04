import { apiClient } from '@/lib/api/client'
import { mockNotices } from '@/lib/api/mock'
import type { Notice, NoticePage } from '@/lib/api/types'
import { appConfig } from '@/lib/config'

const NOTICE_PAGE_SIZE = 5

type RawNotice = Record<string, unknown>
type RawNoticeEnvelope = {
  data?: unknown
  total?: unknown
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
  return false
}

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map(toText).filter(Boolean)))
  }

  if (typeof value !== 'string' || !value.trim()) return []

  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return Array.from(new Set(parsed.map(toText).filter(Boolean)))
    }
  } catch {
    // Older records may store a comma-separated string instead of JSON.
  }

  return Array.from(new Set(value.split(/[,，\n]/).map((tag) => tag.trim()).filter(Boolean)))
}

function normalizeImageUrl(value: unknown) {
  const url = toText(value)
  if (!url) return null

  if (url.startsWith('/') && !url.startsWith('//')) return url

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null
  } catch {
    return null
  }
}

function normalizeNotice(value: unknown): Notice | null {
  if (!value || typeof value !== 'object') return null

  const raw = value as RawNotice
  const id = toNumber(raw.id)
  const title = toText(raw.title)
  if (id == null || !title) return null

  return {
    id,
    title,
    content: typeof raw.content === 'string' ? raw.content : '',
    img_url: normalizeImageUrl(raw.img_url),
    tags: normalizeTags(raw.tags),
    popup: toBoolean(raw.popup),
    sort: toNumber(raw.sort),
    created_at: toNumber(raw.created_at) ?? undefined,
    updated_at: toNumber(raw.updated_at) ?? undefined,
  }
}

function createPage(items: Notice[], total: number, current: number): NoticePage {
  return {
    items,
    total,
    current,
    pageSize: NOTICE_PAGE_SIZE,
    pageCount: total > 0 ? Math.ceil(total / NOTICE_PAGE_SIZE) : 0,
  }
}

export async function getNotices(current = 1): Promise<NoticePage> {
  const normalizedCurrent = Math.max(1, Math.floor(current))

  if (appConfig.enableMock) {
    const offset = (normalizedCurrent - 1) * NOTICE_PAGE_SIZE
    return createPage(mockNotices.slice(offset, offset + NOTICE_PAGE_SIZE), mockNotices.length, normalizedCurrent)
  }

  const response = await apiClient.get<RawNoticeEnvelope>('/api/v1/user/notice/fetch', {
    params: { current: normalizedCurrent },
  })
  const rawItems = Array.isArray(response.data.data) ? response.data.data : []
  const items = rawItems.map(normalizeNotice).filter((notice): notice is Notice => notice != null)
  const total = Math.max(0, toNumber(response.data.total) ?? items.length)

  return createPage(items, total, normalizedCurrent)
}
