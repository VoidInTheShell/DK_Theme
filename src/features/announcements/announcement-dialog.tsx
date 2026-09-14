import { ArrowRight, CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { acknowledgeNotice } from './acknowledgement'
import { useAuth } from '@/features/auth/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { NoticeContent } from '@/features/announcements/notice-content'
import type { Notice, NoticePage } from '@/lib/api/types'
import { formatDateTime } from '@/lib/format'

type AnnouncementDialogProps = {
  notice: Notice | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewAll?: () => void
  popup?: boolean
}

export function AnnouncementDialog({ notice, open, onOpenChange, onViewAll, popup = false }: AnnouncementDialogProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<{ id: number; message: string } | null>(null)
  async function confirm() {
    if (!notice || busy) return
    setBusy(true)
    setFailure(null)
    try {
      await acknowledgeNotice(notice)
      queryClient.setQueriesData<NoticePage>({ queryKey: ['announcements', user?.email] }, page => page ? {
        ...page, items: page.items.map(item => item.id === notice.id ? { ...item, acknowledged: true } : item),
      } : page)
      onOpenChange(false)
    } catch (error) {
      setFailure({ id: notice.id, message: error instanceof Error ? error.message : '确认失败，请重试。' })
    } finally { setBusy(false) }
  }
  return (
    <Dialog open={open} onOpenChange={next => { if (!busy) onOpenChange(next) }}>
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] max-w-2xl flex-col overflow-hidden p-0'>
        <DialogHeader className='shrink-0 px-6 pt-6 pr-14'>
          <div className='flex flex-wrap items-center gap-2'>
            {popup ? <Badge>重要公告</Badge> : <Badge variant='outline'>系统公告</Badge>}
            {notice?.tags?.map((tag) => <Badge key={tag} variant='secondary'>{tag}</Badge>)}
          </div>
          <DialogTitle className='break-words text-xl leading-8'>{notice?.title ?? '公告详情'}</DialogTitle>
          <DialogDescription className='flex items-center gap-2'>
            <CalendarDays aria-hidden='true' />
            发布于 {formatDateTime(notice?.created_at)}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className='min-h-0 flex-1 overflow-y-auto px-6 py-5'>
          {notice?.img_url ? (
            <div className='mb-5 overflow-hidden rounded-xl border bg-muted'>
              <img
                src={notice.img_url}
                alt={`${notice.title}配图`}
                className='max-h-72 w-full object-contain'
                loading='lazy'
                referrerPolicy='no-referrer'
              />
            </div>
          ) : null}
          <NoticeContent content={notice?.content ?? ''} />
        </div>

        <Separator />

        {failure?.id === notice?.id ? <p role='alert' className='px-6 text-sm text-destructive'>{failure?.message}</p> : null}
        <div className='flex shrink-0 flex-col-reverse gap-2 px-6 py-4 sm:flex-row sm:justify-end'>
          <Button variant='outline' disabled={busy} onClick={() => onOpenChange(false)}>{notice?.require_ack && !notice.acknowledged ? '稍后阅读' : '关闭'}</Button>
          {notice?.require_ack ? <Button disabled={busy || notice.acknowledged} onClick={() => void confirm()}>{busy ? '正在确认…' : notice.acknowledged ? '已确认阅读' : '我已阅读并确认'}</Button> : null}
          {onViewAll ? (
            <Button variant='outline' disabled={busy} onClick={onViewAll}>
              查看全部公告
              <ArrowRight data-icon='inline-end' aria-hidden='true' />
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
