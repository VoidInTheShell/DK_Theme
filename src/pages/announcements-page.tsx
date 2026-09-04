import { Fragment, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BellRing, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AnnouncementDialog } from '@/features/announcements/announcement-dialog'
import { getNoticeExcerpt } from '@/features/announcements/notice-content'
import { useAuth } from '@/features/auth/auth-context'
import { getNotices } from '@/lib/api/services/notices'
import { formatDateTime } from '@/lib/format'

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = 'response' in error ? (error as { response?: { data?: { message?: unknown } } }).response : undefined
    const responseMessage = maybeResponse?.data?.message
    if (typeof responseMessage === 'string' && responseMessage.trim()) return responseMessage

    const directMessage = 'message' in error ? (error as { message?: unknown }).message : undefined
    if (typeof directMessage === 'string' && directMessage.trim()) return directMessage
  }
  return '公告读取失败，请稍后重试。'
}

export function AnnouncementsPage() {
  const { announcementsEnabled } = useAuth()
  const [current, setCurrent] = useState(1)
  const [searchParams, setSearchParams] = useSearchParams()
  const noticesQuery = useQuery({
    queryKey: ['announcements', current],
    queryFn: () => getNotices(current),
    enabled: announcementsEnabled,
    staleTime: 60 * 1000,
  })
  const page = noticesQuery.data
  const selectedId = Number(searchParams.get('notice'))
  const selectedNotice = Number.isFinite(selectedId)
    ? page?.items.find((notice) => notice.id === selectedId) ?? null
    : null

  function setSelectedNotice(id: number | null) {
    const nextParams = new URLSearchParams(searchParams)
    if (id == null) nextParams.delete('notice')
    else nextParams.set('notice', String(id))
    setSearchParams(nextParams, { replace: true })
  }

  function changePage(nextPage: number) {
    setSelectedNotice(null)
    setCurrent(nextPage)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className='flex flex-col gap-8'>
      <PageHeader
        badge='服务公报'
        title='系统公告'
        description='查看维护计划、服务变化和账户安全提醒。公告按后台设定的顺序与发布时间展示。'
        actions={
          <Button variant='outline' disabled={!announcementsEnabled || noticesQuery.isFetching} onClick={() => noticesQuery.refetch()}>
            <RefreshCw data-icon='inline-start' aria-hidden='true' />
            {noticesQuery.isFetching ? '正在刷新' : '刷新公告'}
          </Button>
        }
      />

      <div className='px-4 lg:px-6'>
        {!announcementsEnabled ? (
          <Card className='shadow-none'>
            <CardHeader>
              <CardTitle>公告功能暂未开放</CardTitle>
              <CardDescription>当前站点已关闭公告展示，恢复后可在这里查看服务通知。</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card className='overflow-hidden shadow-none'>
            <CardHeader className='border-b'>
              <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
                <div className='flex flex-col gap-1'>
                  <CardTitle>公告归档</CardTitle>
                  <CardDescription>每页显示 5 条，共 {page?.total ?? 0} 条可见公告。</CardDescription>
                </div>
                {page?.pageCount ? <Badge variant='outline' aria-current='page'>第 {page.current} / {page.pageCount} 页</Badge> : null}
              </div>
            </CardHeader>

            <CardContent className='flex flex-col'>
              {noticesQuery.isError ? (
                <div role='alert' className='my-6 flex flex-col gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-5'>
                  <div className='flex flex-col gap-1'>
                    <div className='font-medium text-destructive'>公告读取失败</div>
                    <p className='text-sm text-muted-foreground'>{getErrorMessage(noticesQuery.error)}</p>
                  </div>
                  <Button variant='outline' className='self-start' onClick={() => noticesQuery.refetch()}>重新加载</Button>
                </div>
              ) : noticesQuery.isLoading ? (
                <div aria-label='公告加载中' className='flex flex-col gap-0'>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Fragment key={index}>
                      <div className='grid gap-4 py-6 md:grid-cols-[8rem_1px_minmax(0,1fr)]'>
                        <Skeleton className='h-5 w-24' />
                        <Separator orientation='vertical' className='hidden h-full md:block' />
                        <div className='flex flex-col gap-3'>
                          <Skeleton className='h-5 w-2/3' />
                          <Skeleton className='h-4 w-full' />
                          <Skeleton className='h-4 w-4/5' />
                        </div>
                      </div>
                      {index < 2 ? <Separator /> : null}
                    </Fragment>
                  ))}
                </div>
              ) : page?.items.length ? (
                page.items.map((notice, index) => (
                  <Fragment key={notice.id}>
                    <article className='grid min-w-0 gap-4 py-6 md:grid-cols-[8rem_1px_minmax(0,1fr)]'>
                      <div className='flex flex-row items-center justify-between gap-3 md:flex-col md:items-start md:justify-start'>
                        <time className='font-mono text-xs text-muted-foreground' dateTime={notice.created_at ? new Date(notice.created_at * 1000).toISOString() : undefined}>
                          {formatDateTime(notice.created_at)}
                        </time>
                        {notice.popup ? <Badge>重要</Badge> : null}
                      </div>

                      <Separator orientation='vertical' className='hidden h-full md:block' />

                      <div className='grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_12rem]'>
                        <div className='flex min-w-0 flex-col gap-4'>
                          <div className='flex flex-col gap-2'>
                            <h2 className='break-words text-lg font-semibold leading-7 text-foreground'>{notice.title}</h2>
                            {notice.tags?.length ? (
                              <div className='flex flex-wrap gap-2'>
                                {notice.tags.map((tag) => <Badge key={tag} variant='secondary'>{tag}</Badge>)}
                              </div>
                            ) : null}
                          </div>
                          <p className='break-words text-sm leading-7 text-muted-foreground'>{getNoticeExcerpt(notice.content) || '该公告暂无正文摘要。'}</p>
                          <Button variant='outline' className='self-start' onClick={() => setSelectedNotice(notice.id)}>
                            查看完整公告
                            <ChevronRight data-icon='inline-end' aria-hidden='true' />
                          </Button>
                        </div>

                        {notice.img_url ? (
                          <div className='overflow-hidden rounded-xl border bg-muted'>
                            <img src={notice.img_url} alt={`${notice.title}配图`} className='h-36 w-full object-contain lg:h-full' loading='lazy' referrerPolicy='no-referrer' />
                          </div>
                        ) : null}
                      </div>
                    </article>
                    {index < page.items.length - 1 ? <Separator /> : null}
                  </Fragment>
                ))
              ) : (
                <div role='status' className='flex min-h-64 flex-col items-center justify-center gap-3 py-12 text-center'>
                  <span className='flex size-12 items-center justify-center rounded-full border bg-muted text-muted-foreground'>
                    <BellRing aria-hidden='true' />
                  </span>
                  <div className='flex flex-col gap-1'>
                    <div className='font-medium'>当前没有公告</div>
                    <p className='text-sm text-muted-foreground'>新的维护和服务通知会显示在这里。</p>
                  </div>
                </div>
              )}
            </CardContent>

            {page && page.pageCount > 1 ? (
              <CardFooter className='flex flex-col gap-3 border-t py-4 sm:flex-row sm:justify-between'>
                <p className='text-xs text-muted-foreground'>第 {page.current} 页，共 {page.pageCount} 页</p>
                <nav aria-label='公告分页' className='flex items-center gap-2'>
                  <Button variant='outline' size='sm' disabled={page.current <= 1 || noticesQuery.isFetching} onClick={() => changePage(page.current - 1)}>
                    <ChevronLeft data-icon='inline-start' aria-hidden='true' />
                    上一页
                  </Button>
                  <Button variant='outline' size='sm' disabled={page.current >= page.pageCount || noticesQuery.isFetching} onClick={() => changePage(page.current + 1)}>
                    下一页
                    <ChevronRight data-icon='inline-end' aria-hidden='true' />
                  </Button>
                </nav>
              </CardFooter>
            ) : null}
          </Card>
        )}
      </div>

      <AnnouncementDialog notice={selectedNotice} open={Boolean(selectedNotice)} onOpenChange={(open) => !open && setSelectedNotice(null)} />
    </div>
  )
}
