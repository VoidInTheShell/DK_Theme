import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import QRCode from 'qrcode'
import {
  IconChevronDown,
  IconCopy,
  IconDeviceDesktop,
  IconDownload,
  IconExternalLink,
  IconLink,
  IconQrcode,
  IconSparkles,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/features/auth/auth-context'
import {
  buildQuickImportUrl,
  defaultClients,
  formatClientPlatforms,
  getClientSortOrder,
  normalizeCatalogClient,
  platformLabels,
  templateLabels,
  type ClientItem,
  type DesktopPlatform,
  type DeviceType,
  type MobilePlatform,
  type PlatformFilter,
} from '@/features/clients/client-catalog'
import { copyText } from '@/lib/clipboard'
import { getClientCatalog, type ClientCatalogPlatformDefaultData } from '@/lib/api/services/clients'
import { appConfig } from '@/lib/config'

const badgeClassMap: Record<string, string> = {
  推荐: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  iOS: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300',
  'Mac (Apple Silicon)': 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300',
  Android: 'border-lime-200 bg-lime-50 text-lime-700 dark:border-lime-500/30 dark:bg-lime-500/10 dark:text-lime-300',
  'Clash Meta': 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300',
  'Sing-box': 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300',
  Surfboard: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300',
}

type InitialClientFilters = {
  deviceType: DeviceType
  platform: PlatformFilter
  detected: boolean
  detectedLabel: string
}

type NavigatorUserAgentData = {
  mobile?: boolean
  platform?: string
  architecture?: string
  getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string }>
}

function getInitialClientFilters(): InitialClientFilters {
  const params = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null
  const requestedDevice = params?.get('device')
  const requestedPlatform = params?.get('platform')
  const hasExplicitPreviewFilter = requestedDevice || requestedPlatform

  if (hasExplicitPreviewFilter) {
    const deviceType: DeviceType = requestedDevice === 'mobile' ? 'mobile' : 'desktop'
    const allowedPlatforms = deviceType === 'mobile'
      ? ['ios', 'android']
      : ['windows', 'mac-intel', 'mac-apple-silicon', 'linux']
    const platform = requestedPlatform && allowedPlatforms.includes(requestedPlatform)
      ? requestedPlatform as PlatformFilter
      : deviceType === 'mobile' ? 'android' : 'windows'
    return { deviceType, platform, detected: false, detectedLabel: '已按当前页面参数选择平台' }
  }

  if (typeof navigator === 'undefined') {
    return { deviceType: 'desktop', platform: 'windows', detected: false, detectedLabel: '暂未识别设备' }
  }

  const browserNavigator = navigator as Navigator & { userAgentData?: NavigatorUserAgentData }
  const userAgent = navigator.userAgent.toLowerCase()
  const platform = (browserNavigator.userAgentData?.platform ?? navigator.platform ?? '').toLowerCase()
  const isAndroid = userAgent.includes('android') || platform.includes('android')
  const isIOS = /iphone|ipad|ipod/.test(userAgent) || (platform === 'macintel' && navigator.maxTouchPoints > 1)

  if (isAndroid) return { deviceType: 'mobile', platform: 'android', detected: true, detectedLabel: '已识别为 Android' }
  if (isIOS) return { deviceType: 'mobile', platform: 'ios', detected: true, detectedLabel: '已识别为 iOS / iPadOS' }
  if (userAgent.includes('windows') || platform.includes('win')) return { deviceType: 'desktop', platform: 'windows', detected: true, detectedLabel: '已识别为 Windows' }
  if (userAgent.includes('mac os') || platform.includes('mac')) {
    const isAppleSilicon = browserNavigator.userAgentData?.architecture?.toLowerCase().includes('arm')
    return {
      deviceType: 'desktop',
      platform: isAppleSilicon ? 'mac-apple-silicon' : 'mac-intel',
      detected: true,
      detectedLabel: isAppleSilicon ? '已识别为 macOS Apple Silicon' : '已识别为 macOS',
    }
  }
  if (userAgent.includes('linux') || platform.includes('linux')) return { deviceType: 'desktop', platform: 'linux', detected: true, detectedLabel: '已识别为 Linux' }

  return { deviceType: 'desktop', platform: 'windows', detected: false, detectedLabel: '未识别设备，已暂时显示桌面端目录' }
}

function ClientLogo({ client }: { client: ClientItem }) {
  const [failed, setFailed] = useState(false)
  const initials = client.name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (client.logoUrl && !failed) {
    return (
      <img
        src={client.logoUrl}
        alt={`${client.name} 图标`}
        className='h-full w-full object-cover'
        loading='lazy'
        onError={() => setFailed(true)}
      />
    )
  }

  return <span className='text-sm font-bold tracking-tight'>{initials || <IconDeviceDesktop className='size-6' />}</span>
}


export function ClientsPage() {
  const { subscribe } = useAuth()
  const initialFilters = getInitialClientFilters()
  const subscribeUrl = subscribe?.subscribe_url ?? 'https://example.com/sub/demo-token'
  const isLocalPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'clients'
  const catalogQuery = useQuery({
    queryKey: ['client-catalog'],
    queryFn: getClientCatalog,
    enabled: !appConfig.enableMock && !isLocalPreview,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
  const clients = useMemo(
    () => catalogQuery.data?.clients?.map(normalizeCatalogClient) ?? defaultClients,
    [catalogQuery.data],
  )
  const [copied, setCopied] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrSubscribeUrl, setQrSubscribeUrl] = useState(subscribeUrl)
  const [activeClient, setActiveClient] = useState<string | null>(null)
  const [deviceType, setDeviceType] = useState<DeviceType>(initialFilters.deviceType)
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>(initialFilters.platform)
  const [platformDetected, setPlatformDetected] = useState(initialFilters.detected)
  const [detectedLabel, setDetectedLabel] = useState(initialFilters.detectedLabel)
  const manualSelectionRef = useRef(false)

  const platformOptions = useMemo(() => {
    if (deviceType === 'desktop') {
      return [
        { value: 'windows' as const, label: platformLabels.windows },
        { value: 'mac-intel' as const, label: platformLabels['mac-intel'] },
        { value: 'mac-apple-silicon' as const, label: platformLabels['mac-apple-silicon'] },
        { value: 'linux' as const, label: platformLabels.linux },
      ]
    }

    return [
      { value: 'ios' as const, label: platformLabels.ios },
      { value: 'android' as const, label: platformLabels.android },
    ]
  }, [deviceType])

  const filteredClients = useMemo(
    () => clients
      .filter((client) => client.deviceTypes.includes(deviceType) && client.platforms.includes(platformFilter))
      .sort((a, b) => getClientSortOrder(a, deviceType, platformFilter) - getClientSortOrder(b, deviceType, platformFilter)),
    [clients, deviceType, platformFilter],
  )

  const platformDefault = useMemo<ClientCatalogPlatformDefaultData | undefined>(
    () => catalogQuery.data?.platform_defaults?.find((item) => (
      item.device_type === deviceType && item.platform === platformFilter
    )),
    [catalogQuery.data?.platform_defaults, deviceType, platformFilter],
  )
  const displayClients = filteredClients
  const recommendedClient = useMemo(() => {
    if (platformDefault?.client_slug) {
      const configured = filteredClients.find((client) => client.id === platformDefault.client_slug)
      if (configured) return configured
    }

    return filteredClients.find((client) => client.scopes?.some((scope) => (
      scope.deviceType === deviceType && scope.platform === platformFilter && scope.isDefault
    ))) ?? filteredClients[0]
  }, [deviceType, filteredClients, platformDefault, platformFilter])

  const currentFilterDescription = useMemo(() => {
    if (deviceType === 'desktop' && platformFilter === 'mac-apple-silicon') {
      return '显示 Apple Silicon 可用客户端。'
    }

    if (deviceType === 'desktop') {
      return `${platformLabels[platformFilter as DesktopPlatform]} 客户端`
    }

    return `${platformLabels[platformFilter as MobilePlatform]} 客户端`
  }, [deviceType, platformFilter])

  useEffect(() => {
    if (deviceType === 'desktop' && !['windows', 'mac-intel', 'mac-apple-silicon', 'linux'].includes(platformFilter)) {
      setPlatformFilter('windows')
    }

    if (deviceType === 'mobile' && !['ios', 'android'].includes(platformFilter)) {
      setPlatformFilter('ios')
    }
  }, [deviceType, platformFilter])

  function selectDevice(device: DeviceType) {
    manualSelectionRef.current = true
    const nextPlatform = device === 'mobile' ? 'android' : 'windows'
    setDeviceType(device)
    setPlatformFilter(nextPlatform)
    setPlatformDetected(false)
    setDetectedLabel('已切换到手动平台选择')
  }

  function selectPlatform(platform: PlatformFilter) {
    manualSelectionRef.current = true
    setPlatformFilter(platform)
    setPlatformDetected(false)
    setDetectedLabel('已切换到手动平台选择')
  }

  useEffect(() => {
    const browserNavigator = navigator as Navigator & { userAgentData?: NavigatorUserAgentData }
    const userAgent = navigator.userAgent.toLowerCase()
    const platform = (browserNavigator.userAgentData?.platform ?? navigator.platform ?? '').toLowerCase()
    const looksLikeMac = userAgent.includes('mac os') || platform.includes('mac')
    const getHighEntropyValues = browserNavigator.userAgentData?.getHighEntropyValues

    if (!looksLikeMac || !getHighEntropyValues) return

    let cancelled = false
    void getHighEntropyValues.call(browserNavigator.userAgentData, ['architecture'])
      .then(({ architecture }) => {
        if (cancelled || manualSelectionRef.current || !architecture) return
        const isArm = architecture.toLowerCase().includes('arm')
        setDeviceType('desktop')
        setPlatformFilter(isArm ? 'mac-apple-silicon' : 'mac-intel')
        setPlatformDetected(true)
        setDetectedLabel(isArm ? '已识别为 macOS Apple Silicon' : '已识别为 macOS Intel')
      })
      .catch(() => {
        // Some browsers intentionally withhold architecture. The synchronous
        // macOS result remains available and the platform selector stays visible.
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!qrOpen) return
    let mounted = true
    setQrLoading(true)
    const isDark = document.documentElement.classList.contains('dark')
    QRCode.toDataURL(qrSubscribeUrl, {
      margin: 1,
      width: 320,
      color: {
        dark: isDark ? '#eef2ff' : '#111827',
        light: isDark ? '#0f172a' : '#ffffff',
      },
    })
      .then((url: string) => {
        if (!mounted) return
        setQrDataUrl(url)
      })
      .catch(() => {
        toast.error('订阅二维码生成失败，请稍后再试')
      })
      .finally(() => {
        if (mounted) setQrLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [qrOpen, qrSubscribeUrl])

  async function copySubscribe(url = subscribeUrl) {
    try {
      await copyText(url)
      setCopied(true)
      toast.success('订阅链接已复制到剪贴板')
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('复制失败，请手动复制订阅链接')
      setCopied(false)
    }
  }

  function openQr(client?: ClientItem) {
    setActiveClient(client?.name ?? null)
    setQrSubscribeUrl(client?.subscriptionUrl ?? subscribeUrl)
    setQrOpen(true)
  }

  function handleSchemeImport(client: ClientItem) {
    const url = buildQuickImportUrl(client, client.subscriptionUrl ?? subscribeUrl)
    if (!url) return
    window.location.href = url
    toast.success(`已尝试唤起 ${client.name} 导入`)
  }

  return (
    <>
      <div className='min-w-0 max-w-full space-y-6'>
        <PageHeader
          badge='订阅中心'
          title='订阅中心'
          actions={
            <>
              <Button variant='outline' className='rounded-full bg-white/90 dark:bg-transparent' onClick={() => copySubscribe()}>
                <IconCopy className='size-4' />
                {copied ? '已复制订阅' : '复制订阅'}
              </Button>
              <Button className='rounded-full' onClick={() => openQr()}>
                <IconQrcode className='size-4' />
                订阅二维码
              </Button>
            </>
          }
        />

        <div className='grid min-w-0 max-w-full gap-6 px-4 lg:px-6'>
          <Card className='min-w-0 overflow-hidden border-slate-200/90 bg-white/96 shadow-lg shadow-slate-200/60 dark:border-border/70 dark:bg-card dark:shadow-none'>
            <CardHeader>
              <CardTitle>快速导入</CardTitle>
              <CardDescription>{detectedLabel}。请确认平台后使用推荐客户端导入订阅。</CardDescription>
            </CardHeader>
            <CardContent className='grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(17rem,0.75fr)]'>
              {recommendedClient ? (
                <div className='min-w-0 rounded-2xl border border-sky-200/90 bg-sky-50/75 p-5 shadow-sm dark:border-primary/30 dark:bg-primary/8'>
                  <div className='flex min-w-0 items-start gap-3'>
                    <div className='flex size-10 shrink-0 items-center justify-center rounded-2xl border border-sky-200/80 bg-white text-sky-700 shadow-sm dark:border-primary/30 dark:bg-background/45 dark:text-primary dark:shadow-none'>
                      <IconSparkles className='size-5' />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-xs font-medium uppercase tracking-[0.16em] text-sky-700 dark:text-primary'>推荐客户端</p>
                      <h3 className='mt-1 break-words text-xl font-semibold text-slate-900 dark:text-foreground'>{recommendedClient.name}</h3>
                      <p className='mt-2 text-sm leading-6 text-slate-600 dark:text-muted-foreground'>
                        适合当前设备与系统平台，可直接下载或导入订阅。
                      </p>
                    </div>
                  </div>
                  <div className='mt-4 flex flex-wrap gap-3'>
                    {recommendedClient.quickImportEnabled && recommendedClient.quickImportUrl ? (
                      <Button className='min-h-10 w-full justify-center sm:w-auto' onClick={() => handleSchemeImport(recommendedClient)}>
                        <IconExternalLink className='size-4' />
                        {recommendedClient.quickImportLabel ?? '快速导入'}
                      </Button>
                    ) : null}
                    {recommendedClient.downloadOptions?.length ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant={recommendedClient.quickImportEnabled ? 'outline' : 'default'} className='min-h-10 w-full justify-center bg-white/90 sm:w-auto dark:bg-transparent'>
                            <IconDownload className='size-4' />
                            {recommendedClient.downloadLabel ?? '前往下载'}
                            <IconChevronDown className='size-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='start' className='w-52'>
                          {recommendedClient.downloadOptions.map((download) => (
                            <DropdownMenuItem key={download.label} asChild>
                              <a href={download.href} target='_blank' rel='noreferrer'>
                                {download.label}
                              </a>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button variant={recommendedClient.quickImportEnabled ? 'outline' : 'default'} className='min-h-10 w-full justify-center bg-white/90 sm:w-auto dark:bg-transparent' asChild>
                        <a href={recommendedClient.downloadUrl} target='_blank' rel='noreferrer'>
                          <IconDownload className='size-4' />
                          {recommendedClient.downloadLabel ?? '前往下载'}
                        </a>
                      </Button>
                    )}
                    <Button variant='outline' className='min-h-10 w-full justify-center bg-white/90 sm:w-auto dark:bg-transparent' onClick={() => copySubscribe(recommendedClient.subscriptionUrl ?? subscribeUrl)}>
                      <IconLink className='size-4' />
                      复制订阅
                    </Button>
                    {recommendedClient.docsUrl ? (
                      <Button variant='ghost' className='min-h-10 w-full justify-center sm:w-auto' asChild>
                        <a
                          href={recommendedClient.docsUrl}
                          target={recommendedClient.docsUrl.startsWith('http') ? '_blank' : undefined}
                          rel={recommendedClient.docsUrl.startsWith('http') ? 'noreferrer' : undefined}
                        >
                          <IconExternalLink className='size-4' />
                          查看教程
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className='flex min-h-40 items-center rounded-2xl border border-dashed border-slate-300/90 bg-slate-50/90 p-5 text-sm text-slate-600 dark:border-border/70 dark:bg-background/35 dark:text-muted-foreground'>
                  当前平台暂无已配置且兼容的客户端，请选择其他平台或联系管理员补充客户端适配。
                </div>
              )}
              <div className='min-w-0 rounded-2xl border border-slate-200/90 bg-slate-50/90 p-5 text-sm shadow-sm dark:border-border/70 dark:bg-background/35 dark:shadow-none'>
                <div className='flex items-center gap-2 font-medium text-slate-900 dark:text-foreground'>
                  <IconDeviceDesktop className='size-4 text-sky-600 dark:text-primary' />
                  设备识别
                </div>
                <p className='mt-2 leading-6 text-slate-600 dark:text-muted-foreground'>{detectedLabel}</p>
                <p className='mt-2 leading-6 text-slate-500 dark:text-muted-foreground'>可在下方手动选择设备类型和系统平台；这里只展示明确适配当前平台的客户端。</p>
                {!platformDetected ? (
                  <Badge variant='outline' className='mt-3 rounded-full border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'>请确认平台</Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className='min-w-0 overflow-hidden border-slate-200/90 bg-white/96 shadow-lg shadow-slate-200/60 dark:border-border/70 dark:bg-card dark:shadow-none'>
            <CardHeader className='min-w-0'>
              <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
                <div className='space-y-2'>
                  <div>
                    <CardTitle>客户端列表</CardTitle>
                    <CardDescription>{currentFilterDescription}；下方列出同平台备选客户端和可用导入方式。</CardDescription>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Badge variant='outline' className='rounded-full border-slate-200/80 bg-white/80 dark:border-border/70 dark:bg-background/35'>{deviceType === 'desktop' ? '桌面端' : '移动端'}</Badge>
                    <Badge variant='outline' className='rounded-full border-slate-200/80 bg-white/80 dark:border-border/70 dark:bg-background/35'>
                      {deviceType === 'desktop'
                        ? platformLabels[platformFilter as DesktopPlatform]
                        : platformLabels[platformFilter as MobilePlatform]}
                    </Badge>
                    <Badge variant='outline' className='rounded-full border-primary/15 bg-primary/8 text-primary dark:bg-primary/12'>{displayClients.length} 个客户端</Badge>
                    {catalogQuery.isError ? (
                      <Badge variant='outline' className='rounded-full border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'>使用默认目录</Badge>
                    ) : null}
                  </div>
                </div>
                <div className='flex flex-col gap-3 md:flex-row xl:justify-end'>
                  <div className='grid min-w-0 gap-2 md:w-[160px]'>
                    <div className='text-sm font-medium text-slate-700 dark:text-foreground'>设备类型</div>
                    <Select value={deviceType} onValueChange={(value: DeviceType) => selectDevice(value)}>
                      <SelectTrigger className='w-full rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-border/70 dark:bg-background/35'>
                        <SelectValue placeholder='选择设备类型' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='desktop'>桌面端</SelectItem>
                        <SelectItem value='mobile'>移动端</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid min-w-0 gap-2 md:w-[200px]'>
                    <div className='text-sm font-medium text-slate-700 dark:text-foreground'>系统平台</div>
                    <Select value={platformFilter} onValueChange={(value: PlatformFilter) => selectPlatform(value)}>
                      <SelectTrigger className='w-full rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-border/70 dark:bg-background/35'>
                        <SelectValue placeholder='选择系统平台' />
                      </SelectTrigger>
                      <SelectContent>
                        {platformOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className='grid min-w-0 gap-4 xl:grid-cols-2'>
              {displayClients.length ? (
                displayClients.map((client) => {
                  return (
                    <div
                      key={client.id}
                      className='group flex min-w-0 h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/85 p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md motion-reduce:transform-none dark:border-border/70 dark:bg-background/35 dark:shadow-none dark:hover:border-primary/30'
                    >
                      <div className='flex items-start justify-between gap-4'>
                        <div className='flex min-w-0 items-start gap-4'>
                          <div className='flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-slate-700 shadow-sm dark:border-border/70 dark:bg-primary/12 dark:text-primary dark:shadow-none'>
                            <ClientLogo client={client} />
                          </div>
                          <div className='min-w-0'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <h3 className='text-lg font-semibold text-slate-900 dark:text-foreground'>{client.name}</h3>
                              {client.tags.map((badge) => (
                                <Badge
                                  key={badge}
                                  variant='outline'
                                  className={`rounded-full ${badgeClassMap[badge] ?? 'border-slate-200/80 bg-white/80 dark:border-border/70 dark:bg-background/35'}`}
                                >
                                  {badge}
                                </Badge>
                              ))}
                              <Badge
                                variant='outline'
                                className={`rounded-full ${badgeClassMap[templateLabels[client.subscriptionTemplate]] ?? 'border-slate-200/80 bg-white/80 text-slate-600 dark:border-border/70 dark:bg-background/35 dark:text-muted-foreground'}`}
                              >
                                {templateLabels[client.subscriptionTemplate]}
                              </Badge>
                            </div>
                            <p className='mt-1 break-words text-sm text-slate-500 dark:text-muted-foreground'>{formatClientPlatforms(client.platforms)}</p>
                          </div>
                        </div>
                      </div>
                      <p className='mt-4 text-sm leading-6 text-slate-600 dark:text-muted-foreground'>{client.description}</p>
                      <div className='mt-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600 dark:border-border/70 dark:bg-background/40 dark:text-muted-foreground'>
                        {client.importHint}
                      </div>
                      {client.compatibilityNote ? (
                        <div className='mt-3 rounded-2xl border border-violet-200/80 bg-violet-50/80 px-4 py-3 text-sm text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300'>
                          {client.compatibilityNote}
                        </div>
                      ) : null}
                      <div className='mt-auto pt-5'>
                        <div className='flex flex-wrap gap-3'>
                          {client.downloadOptions?.length ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button className='min-h-10 w-full justify-center sm:w-auto sm:min-w-[148px]'>
                                  <IconDownload className='size-4' />
                                  {client.downloadLabel ?? '前往下载'}
                                  <IconChevronDown className='size-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='start' className='w-52'>
                                {client.downloadOptions.map((download) => (
                                  <DropdownMenuItem key={download.label} asChild>
                                    <a href={download.href} target='_blank' rel='noreferrer'>
                                      {download.label}
                                    </a>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Button className='min-h-10 w-full justify-center sm:w-auto sm:min-w-[148px]' asChild>
                              <a href={client.downloadUrl} target='_blank' rel='noreferrer'>
                                <IconDownload className='size-4' />
                                {client.downloadLabel ?? '前往下载'}
                              </a>
                            </Button>
                          )}
                          {client.quickImportEnabled && client.quickImportUrl ? (
                            <Button variant='outline' className='min-h-10 w-full justify-center bg-white/90 sm:w-auto sm:min-w-[124px] dark:bg-transparent' onClick={() => handleSchemeImport(client)}>
                              <IconExternalLink className='size-4' />
                              {client.quickImportLabel ?? '快速导入'}
                            </Button>
                          ) : null}
                          <Button variant='outline' className='min-h-10 w-full justify-center bg-white/90 sm:w-auto sm:min-w-[124px] dark:bg-transparent' onClick={() => copySubscribe(client.subscriptionUrl ?? subscribeUrl)}>
                            <IconLink className='size-4' />
                            复制订阅
                          </Button>
                          <Button variant='outline' className='min-h-10 w-full justify-center bg-white/90 sm:w-auto sm:min-w-[124px] dark:bg-transparent' onClick={() => openQr(client)}>
                            <IconQrcode className='size-4' />
                            扫码导入
                          </Button>
                          {client.docsUrl ? (
                            <Button variant='ghost' className='min-h-10 w-full justify-center sm:w-auto sm:min-w-[124px]' asChild>
                              <a
                                href={client.docsUrl}
                                target={client.docsUrl.startsWith('http') ? '_blank' : undefined}
                                rel={client.docsUrl.startsWith('http') ? 'noreferrer' : undefined}
                              >
                                <IconExternalLink className='size-4' />
                                查看教程
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className='xl:col-span-2 rounded-2xl border border-dashed border-slate-300/90 bg-slate-50/90 p-8 text-center text-sm text-slate-500 dark:border-border/70 dark:bg-background/35 dark:text-muted-foreground'>
                  当前平台没有已配置且兼容的客户端。
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className='border-slate-200/90 bg-white/96 shadow-2xl shadow-slate-200/70 dark:border-border dark:bg-card dark:shadow-black/30'>
          <DialogHeader>
            <DialogTitle>{activeClient ? `${activeClient} 订阅二维码` : '订阅二维码'}</DialogTitle>
            <DialogDescription>
              使用客户端内的扫码导入功能扫描二维码即可添加订阅。若扫码失败，也可以直接复制订阅链接。
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='mx-auto flex min-h-80 items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-4 shadow-inner dark:border-border/70 dark:bg-slate-950 dark:shadow-none'>
              {qrLoading ? (
                <div className='text-sm text-slate-500 dark:text-muted-foreground'>二维码生成中…</div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt='订阅二维码'
                  className='h-72 w-72 rounded-xl border border-slate-200/70 bg-white p-2 dark:border-border dark:bg-slate-950'
                />
              ) : (
                <div className='text-sm text-slate-500 dark:text-muted-foreground'>暂时无法生成二维码</div>
              )}
            </div>
            <div className='rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-border/70 dark:bg-background/35'>
              <div className='text-sm text-slate-500 dark:text-muted-foreground'>当前订阅链接</div>
              <code className='mt-2 block break-all text-xs text-slate-800 dark:text-primary'>{qrSubscribeUrl}</code>
            </div>
            <div className='flex flex-wrap gap-3'>
              <Button onClick={() => copySubscribe(qrSubscribeUrl)}>
                <IconCopy className='size-4' />
                复制订阅链接
              </Button>
              <Button variant='outline' className='bg-white/90 dark:bg-transparent' onClick={() => setQrOpen(false)}>
                关闭
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
