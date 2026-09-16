import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnnouncementDialog } from '@/features/announcements/announcement-dialog'
import { useAuth } from '@/features/auth/auth-context'
import { getNotices } from '@/lib/api/services/notices'

function hashScope(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function getStorageKey(id: number, revision: number | undefined, userEmail: string | undefined) {
  return `dk-theme:announcement:${hashScope(userEmail ?? 'anonymous')}:${id}:${revision ?? 0}`
}

function hasSeenAnnouncement(key: string | null) {
  if (!key) return true
  try {
    return sessionStorage.getItem(key) === 'seen'
  } catch {
    return false
  }
}

function markAnnouncementSeen(key: string | null) {
  if (!key) return
  try {
    sessionStorage.setItem(key, 'seen')
  } catch {
    // The dialog should remain usable when browser storage is unavailable.
  }
}

export function AnnouncementPopup() {
  const { announcementsEnabled, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [dismissedKeys, setDismissedKeys] = useState<string[]>([])
  const noticesQuery = useQuery({
    queryKey: ['announcements', user?.email, 1],
    queryFn: () => getNotices(1),
    enabled: announcementsEnabled,
    staleTime: 5 * 60 * 1000,
  })
  const notice = noticesQuery.data?.items.find((item) => {
    if (!(item.popup || (item.pinned && item.require_ack)) || item.acknowledged) return false
    const key = getStorageKey(item.id, item.revision ?? item.updated_at ?? item.created_at, user?.email)
    return !dismissedKeys.includes(key) && (item.require_ack || !hasSeenAnnouncement(key))
  }) ?? null
  const storageKey = notice ? getStorageKey(notice.id, notice.revision ?? notice.updated_at ?? notice.created_at, user?.email) : null
  const isAnnouncementPage = location.pathname === '/announcements'
  const open = Boolean(notice && !isAnnouncementPage && !dismissedKeys.includes(storageKey ?? "") && (notice.require_ack || !hasSeenAnnouncement(storageKey)))

  function closePopup() {
    if (!notice?.require_ack) markAnnouncementSeen(storageKey)
    setDismissedKeys(keys => storageKey ? [...keys, storageKey] : keys)
  }

  function viewAll() {
    closePopup()
    navigate('/announcements')
  }

  return (
    <AnnouncementDialog
      notice={notice}
      open={open}
      popup
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closePopup()
      }}
      onViewAll={viewAll}
    />
  )
}
