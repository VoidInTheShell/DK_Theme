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
  const [dismissedKey, setDismissedKey] = useState<string | null>(null)
  const noticesQuery = useQuery({
    queryKey: ['announcements', 1],
    queryFn: () => getNotices(1),
    enabled: announcementsEnabled,
    staleTime: 5 * 60 * 1000,
  })
  const notice = noticesQuery.data?.items.find((item) => item.popup) ?? null
  const storageKey = notice ? getStorageKey(notice.id, notice.updated_at ?? notice.created_at, user?.email) : null
  const isAnnouncementPage = location.pathname === '/announcements'
  const open = Boolean(notice && !isAnnouncementPage && storageKey !== dismissedKey && !hasSeenAnnouncement(storageKey))

  function closePopup() {
    markAnnouncementSeen(storageKey)
    setDismissedKey(storageKey)
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
