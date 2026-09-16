import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BellRing, ArrowRight, Pin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnnouncementDialog } from './announcement-dialog'
import { getNoticeExcerpt } from './notice-content'
import { getNotices } from '@/lib/api/services/notices'
import { useAuth } from '@/features/auth/auth-context'
import { formatDateTime } from '@/lib/format'

export function RecentNotices() {
  const { announcementsEnabled, user } = useAuth()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const query = useQuery({ queryKey: ['announcements', user?.email, 1], queryFn: () => getNotices(1), enabled: announcementsEnabled })
  const items = [...(query.data?.items ?? [])].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || (b.created_at ?? 0) - (a.created_at ?? 0))
  const selected = items.find(item => item.id === selectedId) ?? null
  return (
    <section className='flex min-w-0 flex-col rounded-3xl border bg-card p-5' aria-label='最近公告'>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <h2 className='flex items-center gap-2 font-semibold'><BellRing className='size-4' />最近公告</h2>
        {announcementsEnabled ? <Button variant='ghost' size='sm' asChild><Link to='/announcements'>全部<ArrowRight className='size-4' /></Link></Button> : null}
      </div>
      {!announcementsEnabled ? <p className='py-8 text-sm text-muted-foreground'>公告展示已关闭。</p> : query.isPending ? <p role='status' className='py-8 text-sm text-muted-foreground'>正在加载公告…</p> : query.isError ? <div role='alert' className='flex flex-col items-start gap-3 py-6'><p className='text-sm text-muted-foreground'>公告加载失败。</p><Button variant='outline' size='sm' onClick={() => void query.refetch()}>重新加载</Button></div> : !items.length ? <p className='py-8 text-sm text-muted-foreground'>暂无公告，新的服务通知会显示在这里。</p> : (
        <div className='divide-y'>
          {items.slice(0, 4).map(notice => <button type='button' key={notice.id} onClick={() => setSelectedId(notice.id)} className='flex w-full min-w-0 flex-col gap-2 rounded-lg px-2 py-4 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring'>
            <span className='flex flex-wrap items-center gap-2'>{notice.pinned ? <Pin className='size-3.5 shrink-0' aria-label='置顶' /> : null}<span className='line-clamp-1 break-all text-sm font-medium'>{notice.title}</span>{notice.require_ack ? <Badge variant='outline'>{notice.acknowledged ? '已确认' : '待确认'}</Badge> : null}</span>
            <span className='line-clamp-2 break-all text-xs leading-5 text-muted-foreground'>{getNoticeExcerpt(notice.content)}</span>
            <time className='text-xs text-muted-foreground'>{formatDateTime(notice.created_at)}</time>
          </button>)}
        </div>
      )}
      <AnnouncementDialog notice={selected} open={Boolean(selected)} onOpenChange={open => { if (!open) setSelectedId(null) }} />
    </section>
  )
}
