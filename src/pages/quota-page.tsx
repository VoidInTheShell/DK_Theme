import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { useAuth } from '@/features/auth/auth-context'
import { formatBytes, formatDateTime } from '@/lib/format'
import { CalendarClock, Gauge, Layers3, Network, RotateCw, Router, ShieldCheck, Users } from 'lucide-react'

function formatSpeedLimit(limit?: number | null) {
  return limit && limit > 0 ? `${limit} Mbps` : '不限速'
}

function formatDeviceLimit(limit?: number | null) {
  return limit && limit > 0 ? `${limit} 台` : '不限设备'
}

function formatResetPolicy(method?: number | null) {
  const labels: Record<number, string> = {
    0: '每月 1 日重置',
    1: '按订阅周期重置',
    2: '不自动重置',
    3: '每年 1 月 1 日重置',
    4: '按年度周期重置',
  }

  return method == null ? '跟随系统设置' : labels[method] ?? '跟随套餐规则'
}

function QuotaMetric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Gauge
  label: string
  value: string
  hint: string
}) {
  return (
    <Card className='border-slate-200/80 bg-white/75 shadow-xs dark:border-border/70 dark:bg-background/35'>
      <CardContent className='p-5'>
        <div className='flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-muted-foreground'>
          <Icon className='size-4 text-primary' />
          {label}
        </div>
        <div className='mt-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-foreground'>{value}</div>
        <div className='mt-1 text-xs leading-5 text-slate-500 dark:text-muted-foreground'>{hint}</div>
      </CardContent>
    </Card>
  )
}

export function QuotaPage() {
  const { subscribe, user } = useAuth()
  const plan = subscribe?.plan_details
  const planName = subscribe?.plan ?? user?.plan ?? '未分配套餐'
  const totalTraffic = subscribe?.transfer_enable ?? user?.transfer_enable ?? 0
  const uploadTraffic = subscribe?.u ?? 0
  const downloadTraffic = subscribe?.d ?? user?.d ?? 0
  const usedTraffic = uploadTraffic + downloadTraffic
  const remainingTraffic = Math.max(totalTraffic - usedTraffic, 0)
  const usageRate = totalTraffic > 0 ? Math.min(100, Math.round((usedTraffic / totalTraffic) * 100)) : 0
  const expiredAt = subscribe?.expired_at ?? user?.expired_at
  const speedLimit = subscribe?.speed_limit ?? plan?.speed_limit
  const deviceLimit = subscribe?.device_limit ?? plan?.device_limit
  const nextResetAt = subscribe?.next_reset_at
  const isExpired = Boolean(expiredAt && expiredAt * 1000 < Date.now())
  const resetHint = nextResetAt
    ? `下次重置：${formatDateTime(nextResetAt)}`
    : subscribe?.reset_day
      ? `重置日：每月 ${subscribe.reset_day} 日`
      : '具体时间以套餐规则为准'

  return (
    <div className='space-y-8'>
      <PageHeader
        badge='配额信息'
        title='当前套餐与网络配额'
        description='集中查看当前账户的流量、限速、设备数量、到期时间与重置规则。'
        actions={(
          <Badge
            variant='outline'
            className={isExpired
              ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'}
          >
            <ShieldCheck className='size-3.5' />
            {isExpired ? '套餐已到期' : '配额有效'}
          </Badge>
        )}
      />

      <div className='grid gap-6 px-4 lg:grid-cols-[1.08fr_0.92fr] lg:px-6'>
        <Card className='overflow-hidden border-sky-200/80 bg-[linear-gradient(145deg,rgba(239,248,255,0.98),rgba(255,255,255,0.96)_54%,rgba(238,246,255,0.92))] shadow-sm dark:border-sky-400/20 dark:bg-[linear-gradient(145deg,rgba(10,27,45,0.96),rgba(15,23,42,0.94))]'>
          <CardContent className='flex h-full flex-col p-6'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div>
                <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300'>
                  <Network className='size-4' />
                  UEG Global CDN
                </div>
                <div className='mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white'>{planName}</div>
                <div className='mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300'>
                  {plan?.content || '当前账户已接入 UEG 全球网络，以下用量按本订阅周期实时统计。'}
                </div>
              </div>
              <div className='flex size-14 items-center justify-center rounded-2xl border border-sky-200/80 bg-white/80 shadow-sm dark:border-sky-400/20 dark:bg-white/5'>
                <img src='/ueg-mark.png' alt='UEG' className='h-11 w-12 object-contain' />
              </div>
            </div>

            <div className='mt-8 rounded-3xl border border-white/90 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5'>
              <div className='flex flex-wrap items-end justify-between gap-4'>
                <div>
                  <div className='flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-muted-foreground'>
                    <Gauge className='size-4 text-primary' />
                    本周期已用配额
                  </div>
                  <div className='mt-2 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white'>{usageRate}%</div>
                </div>
                <div className='text-right text-sm text-slate-500 dark:text-muted-foreground'>
                  <div>剩余 <span className='font-semibold text-slate-900 dark:text-foreground'>{formatBytes(remainingTraffic)}</span></div>
                  <div className='mt-1'>总量 {formatBytes(totalTraffic)}</div>
                </div>
              </div>

              <div className='mt-5 h-3 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10'>
                <div
                  className={`h-full rounded-full transition-[width] ${usageRate >= 85 ? 'bg-rose-500' : usageRate >= 60 ? 'bg-amber-500' : 'bg-sky-500'}`}
                  style={{ width: `${Math.max(usageRate, totalTraffic > 0 ? 4 : 0)}%` }}
                />
              </div>

              <div className='mt-4 grid gap-3 text-sm sm:grid-cols-3'>
                <div className='rounded-2xl bg-slate-50/90 px-4 py-3 dark:bg-white/5'>
                  <div className='text-xs text-slate-500 dark:text-muted-foreground'>上传</div>
                  <div className='mt-1 font-semibold text-slate-900 dark:text-foreground'>{formatBytes(uploadTraffic)}</div>
                </div>
                <div className='rounded-2xl bg-slate-50/90 px-4 py-3 dark:bg-white/5'>
                  <div className='text-xs text-slate-500 dark:text-muted-foreground'>下载</div>
                  <div className='mt-1 font-semibold text-slate-900 dark:text-foreground'>{formatBytes(downloadTraffic)}</div>
                </div>
                <div className='rounded-2xl bg-slate-50/90 px-4 py-3 dark:bg-white/5'>
                  <div className='text-xs text-slate-500 dark:text-muted-foreground'>合计</div>
                  <div className='mt-1 font-semibold text-slate-900 dark:text-foreground'>{formatBytes(usedTraffic)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='grid gap-4 sm:grid-cols-2'>
          <QuotaMetric icon={Gauge} label='网络限速' value={formatSpeedLimit(speedLimit)} hint='当前账户生效的速率上限' />
          <QuotaMetric icon={Users} label='设备数量' value={formatDeviceLimit(deviceLimit)} hint='允许同时使用的设备数量' />
          <QuotaMetric icon={CalendarClock} label='套餐到期' value={formatDateTime(expiredAt)} hint={isExpired ? '当前套餐已过期' : '账户配额有效期'} />
          <QuotaMetric icon={RotateCw} label='流量重置' value={formatResetPolicy(plan?.reset_traffic_method)} hint={resetHint} />
        </div>
      </div>

      <div className='grid gap-4 px-4 md:grid-cols-3 lg:px-6'>
        <div className='flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-sm dark:border-border/70 dark:bg-background/35'>
          <Layers3 className='mt-0.5 size-4 shrink-0 text-primary' />
          <div><div className='font-medium text-slate-900 dark:text-foreground'>套餐</div><div className='mt-1 text-slate-500 dark:text-muted-foreground'>{planName}</div></div>
        </div>
        <div className='flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-sm dark:border-border/70 dark:bg-background/35'>
          <Router className='mt-0.5 size-4 shrink-0 text-primary' />
          <div><div className='font-medium text-slate-900 dark:text-foreground'>账户</div><div className='mt-1 break-all text-slate-500 dark:text-muted-foreground'>{user?.email ?? '--'}</div></div>
        </div>
        <div className='flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-sm dark:border-border/70 dark:bg-background/35'>
          <ShieldCheck className='mt-0.5 size-4 shrink-0 text-primary' />
          <div><div className='font-medium text-slate-900 dark:text-foreground'>状态</div><div className='mt-1 text-slate-500 dark:text-muted-foreground'>{isExpired ? '套餐已到期，请联系管理员' : '配额正常，可继续使用'}</div></div>
        </div>
      </div>
    </div>
  )
}
