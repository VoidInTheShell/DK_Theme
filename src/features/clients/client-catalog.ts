import { appConfig } from '@/lib/config'
import type { ClientCatalogItemData } from '@/lib/api/services/clients'

export type DeviceType = 'desktop' | 'mobile'
export type DesktopPlatform = 'windows' | 'mac-intel' | 'mac-apple-silicon' | 'linux'
export type MobilePlatform = 'ios' | 'android'
export type PlatformFilter = DesktopPlatform | MobilePlatform
export type SubscriptionTemplate = 'general' | 'singbox' | 'clash' | 'clashmeta' | 'stash' | 'surge' | 'surfboard'

export type ClientDownloadOption = {
  label: string
  href: string
}

export type ClientItem = {
  id: string
  name: string
  logoUrl?: string
  description: string
  deviceTypes: DeviceType[]
  platforms: PlatformFilter[]
  tags: string[]
  downloadUrl: string
  downloadOptions?: ClientDownloadOption[]
  downloadLabel?: string
  quickImportEnabled: boolean
  quickImportUrl?: string
  quickImportLabel?: string
  subscriptionTemplate: SubscriptionTemplate
  docsUrl?: string
  order: number
  scopes?: ClientScope[]
  subscriptionUrl?: string
  importHint: string
  compatibilityNote?: string
}

export type ClientScope = {
  deviceType: DeviceType
  platform: PlatformFilter
  sortOrder: number
}

export const platformLabels: Record<PlatformFilter, string> = {
  windows: 'Windows',
  'mac-intel': 'Mac (Intel)',
  'mac-apple-silicon': 'Mac (Apple Silicon)',
  linux: 'Linux',
  ios: 'iOS',
  android: 'Android',
}

export const templateLabels: Record<SubscriptionTemplate, string> = {
  general: '通用订阅',
  singbox: 'Sing-box',
  clash: 'Clash',
  clashmeta: 'Clash Meta',
  stash: 'Stash',
  surge: 'Surge',
  surfboard: 'Surfboard',
}

const desktopPlatforms: DesktopPlatform[] = ['windows', 'mac-intel', 'mac-apple-silicon', 'linux']
const clashImportUrl = 'clash://install-config?url={url}&name={name}'

export const defaultClients: ClientItem[] = [
  {
    id: 'clash-party',
    name: 'Clash Party',
    logoUrl: 'https://github.com/mihomo-party-org.png?size=160',
    description: '原 Mihomo Party。面向桌面端的 Mihomo 图形客户端，适合日常规则分流与多订阅管理。',
    deviceTypes: ['desktop'],
    platforms: desktopPlatforms,
    tags: ['推荐', '原 Mihomo Party'],
    downloadUrl: 'https://github.com/mihomo-party-org/clash-party/releases',
    downloadLabel: '前往下载',
    quickImportEnabled: true,
    quickImportUrl: clashImportUrl,
    quickImportLabel: '快速导入',
    subscriptionTemplate: 'clashmeta',
    docsUrl: 'https://clashparty.org/',
    order: 10,
    importHint: '支持 Clash Scheme，可从当前页面直接尝试拉起客户端并导入订阅。',
  },
  {
    id: 'clash-verge',
    name: 'Clash Verge',
    logoUrl: 'https://github.com/clash-verge-rev.png?size=160',
    description: '跨平台 Mihomo 桌面客户端，适合 Windows、macOS 与 Linux 用户。',
    deviceTypes: ['desktop'],
    platforms: desktopPlatforms,
    tags: ['桌面端', 'Mihomo'],
    downloadUrl: 'https://github.com/clash-verge-rev/clash-verge-rev/releases',
    downloadLabel: '前往下载',
    quickImportEnabled: true,
    quickImportUrl: clashImportUrl,
    quickImportLabel: '快速导入',
    subscriptionTemplate: 'clashmeta',
    docsUrl: 'https://clashvergerev.com/',
    order: 20,
    importHint: '推荐先安装最新版，再通过快速导入按钮添加当前 Clash Meta 订阅。',
  },
  {
    id: 'flclash',
    name: 'FlClash',
    logoUrl: 'https://github.com/chen08209.png?size=160',
    description: '基于 Flutter 的跨平台 Clash Meta 客户端，同一套界面覆盖桌面端与 Android。',
    deviceTypes: ['desktop', 'mobile'],
    platforms: [...desktopPlatforms, 'android'],
    tags: ['跨平台', 'Android'],
    downloadUrl: 'https://github.com/chen08209/FlClash/releases',
    downloadLabel: '前往下载',
    quickImportEnabled: true,
    quickImportUrl: clashImportUrl,
    quickImportLabel: '快速导入',
    subscriptionTemplate: 'clashmeta',
    docsUrl: 'https://github.com/chen08209/FlClash',
    order: 30,
    importHint: '安装后可尝试通过 Clash Scheme 导入；若系统未拉起应用，可复制订阅手动添加。',
  },
  {
    id: 'clash-mi',
    name: 'Clash Mi',
    logoUrl: 'https://github.com/KaringX.png?size=160',
    description: '基于 Flutter 与 Mihomo 的现代客户端，本目录默认提供 Android 入口。',
    deviceTypes: ['mobile'],
    platforms: ['android'],
    tags: ['Android', 'Mihomo'],
    downloadUrl: 'https://github.com/KaringX/clashmi/releases',
    downloadLabel: '前往下载',
    quickImportEnabled: true,
    quickImportUrl: clashImportUrl,
    quickImportLabel: '快速导入',
    subscriptionTemplate: 'clashmeta',
    docsUrl: 'https://clashmi.app/',
    order: 40,
    importHint: 'Android 安装完成后可尝试直接拉起导入，也可以复制链接后在应用内添加。',
  },
  {
    id: 'clash-meta-android',
    name: 'Clash Meta',
    logoUrl: 'https://github.com/MetaCubeX.png?size=160',
    description: 'MetaCubeX 提供的 Android 图形客户端，面向 Clash Meta 配置与规则体系。',
    deviceTypes: ['mobile'],
    platforms: ['android'],
    tags: ['Android', 'Clash Meta'],
    downloadUrl: 'https://github.com/MetaCubeX/ClashMetaForAndroid/releases',
    downloadLabel: '前往下载',
    quickImportEnabled: true,
    quickImportUrl: 'clashmeta://install-config?url={url}&name={name}',
    quickImportLabel: '快速导入',
    subscriptionTemplate: 'clashmeta',
    docsUrl: 'https://github.com/MetaCubeX/ClashMetaForAndroid',
    order: 50,
    importHint: '客户端原生支持 Clash Meta Scheme；拉起失败时仍可复制订阅或扫码导入。',
  },
  {
    id: 'hiddify',
    name: 'Hiddify',
    logoUrl: 'https://github.com/hiddify.png?size=160',
    description: '界面简洁的多协议客户端，支持 Sing-box、Clash 与 Clash Meta 等订阅格式。',
    deviceTypes: ['mobile'],
    platforms: ['android'],
    tags: ['Android', 'Sing-box'],
    downloadUrl: 'https://github.com/hiddify/hiddify-app/releases',
    downloadLabel: '前往下载',
    quickImportEnabled: false,
    subscriptionTemplate: 'singbox',
    docsUrl: 'https://hiddify.com/',
    order: 60,
    importHint: '默认使用 Sing-box 模板；建议复制订阅链接后在 Hiddify 中添加远程配置。',
  },
  {
    id: 'surfboard',
    name: 'Surfboard',
    logoUrl: 'https://github.com/getsurfboard.png?size=160',
    description: '面向 Android 的规则代理客户端，适合使用 Surfboard 配置模板的用户。',
    deviceTypes: ['mobile'],
    platforms: ['android'],
    tags: ['Android', 'Surfboard'],
    downloadUrl: 'https://github.com/getsurfboard/surfboard/releases',
    downloadLabel: '前往下载',
    quickImportEnabled: false,
    subscriptionTemplate: 'surfboard',
    docsUrl: 'https://getsurfboard.com/',
    order: 70,
    importHint: '默认使用 Surfboard 模板；复制订阅链接后在应用内新建远程配置。',
  },
  {
    id: 'v2rayn',
    name: 'v2rayN',
    logoUrl: 'https://pub-56954302827c4850ac0f10fdb853206b.r2.dev/original/landscape/20260410-a5535cd1.avif',
    description: '支持 Windows 与 macOS，适合希望按设备架构分别下载的用户。',
    deviceTypes: ['desktop'],
    platforms: ['windows', 'mac-intel', 'mac-apple-silicon'],
    tags: ['通用订阅'],
    downloadUrl: 'https://github.com/2dust/v2rayN/releases',
    downloadOptions: [
      { label: 'Windows', href: appConfig.downloads.v2rayN.windows },
      { label: 'Mac Intel 芯片', href: appConfig.downloads.v2rayN.macIntel },
      { label: 'Mac M 芯片', href: appConfig.downloads.v2rayN.macAppleSilicon },
    ],
    downloadLabel: '选择版本下载',
    quickImportEnabled: false,
    subscriptionTemplate: 'general',
    docsUrl: '/knowledge#v2rayn',
    order: 80,
    importHint: '下载按钮已按 Windows、Mac Intel、Mac M 芯片区分，可复制通用订阅后手动添加。',
  },
  {
    id: 'nekobox',
    name: 'NekoBox',
    logoUrl: 'https://pub-56954302827c4850ac0f10fdb853206b.r2.dev/landscape/webp/20260410-d92866f9.webp',
    description: '适合 Android 设备，支持订阅导入与常见代理协议。',
    deviceTypes: ['mobile'],
    platforms: ['android'],
    tags: ['Android', '通用订阅'],
    downloadUrl: 'https://github.com/MatsuriDayo/NekoBoxForAndroid/releases',
    downloadLabel: '前往下载',
    quickImportEnabled: false,
    subscriptionTemplate: 'general',
    docsUrl: '/knowledge#nekobox',
    order: 80,
    importHint: 'Android 端推荐复制订阅或使用二维码扫码导入。',
  },
  {
    id: 'shadowrocket',
    name: 'Shadowrocket',
    logoUrl: 'https://pub-56954302827c4850ac0f10fdb853206b.r2.dev/original/landscape/20260410-21f67e37.webp',
    description: '适合 iPhone 与 iPad 使用，支持订阅导入和分流规则。',
    deviceTypes: ['desktop', 'mobile'],
    platforms: ['ios', 'mac-apple-silicon'],
    tags: ['推荐', 'iOS', 'Mac (Apple Silicon)'],
    downloadUrl: 'https://apps.apple.com/us/app/shadowrocket/id932747118',
    downloadLabel: '前往下载',
    quickImportEnabled: true,
    quickImportUrl: 'shadowrocket://add/sub://{base64url}',
    subscriptionTemplate: 'general',
    docsUrl: '/knowledge#shadowrocket',
    order: 100,
    importHint: '支持 Shadowrocket 一键导入，也可以通过二维码扫码添加。',
    compatibilityNote: 'Apple Silicon Mac 可直接运行对应 iOS 客户端。',
  },
  {
    id: 'stash',
    name: 'Stash',
    logoUrl: 'https://pub-56954302827c4850ac0f10fdb853206b.r2.dev/original/landscape/20260410-6a72b2b5.webp',
    description: '适合偏好规则组与策略分流的 iPhone / iPad 用户，界面现代，配置能力强。',
    deviceTypes: ['desktop', 'mobile'],
    platforms: ['ios', 'mac-apple-silicon'],
    tags: ['iOS', 'Mac (Apple Silicon)'],
    downloadUrl: 'https://apps.apple.com/us/app/stash-rule-based-proxy/id1596063349',
    downloadLabel: '前往下载',
    quickImportEnabled: true,
    quickImportUrl: 'stash://install-config?url={url}',
    subscriptionTemplate: 'stash',
    docsUrl: '/knowledge#stash',
    order: 110,
    importHint: '支持 Stash 一键导入，也可以复制订阅后手动导入。',
    compatibilityNote: 'Apple Silicon Mac 可直接运行对应 iOS 客户端。',
  },
  {
    id: 'quantumult-x',
    name: 'Quantumult X',
    logoUrl: 'https://pub-56954302827c4850ac0f10fdb853206b.r2.dev/original/landscape/20260410-26167905.webp',
    description: '适合需要策略分流、自定义规则和脚本能力的 iOS 用户。',
    deviceTypes: ['desktop', 'mobile'],
    platforms: ['ios', 'mac-apple-silicon'],
    tags: ['iOS', 'Mac (Apple Silicon)'],
    downloadUrl: 'https://apps.apple.com/us/app/quantumult-x/id1443988620',
    downloadLabel: '前往下载',
    quickImportEnabled: true,
    quickImportUrl: 'quantumult-x:///update-resource?remote-resource={url}',
    subscriptionTemplate: 'general',
    docsUrl: '/knowledge#quantumult-x',
    order: 120,
    importHint: '支持 Quantumult X 一键导入，失败时可复制订阅后手动添加资源。',
    compatibilityNote: 'Apple Silicon Mac 可直接运行对应 iOS 客户端。',
  },
  {
    id: 'surge',
    name: 'Surge',
    logoUrl: 'https://pub-56954302827c4850ac0f10fdb853206b.r2.dev/original/landscape/20260410-88fbe0bc.webp',
    description: '适合需要高级分流、脚本与策略控制的 Apple 用户。',
    deviceTypes: ['desktop', 'mobile'],
    platforms: ['ios', 'mac-apple-silicon'],
    tags: ['iOS', 'Mac (Apple Silicon)'],
    downloadUrl: 'https://apps.apple.com/us/app/surge-5/id1442620678',
    downloadLabel: '前往下载',
    quickImportEnabled: true,
    quickImportUrl: 'surge:///install-config?url={url}',
    subscriptionTemplate: 'surge',
    docsUrl: '/knowledge#surge',
    order: 130,
    importHint: '支持 Surge 一键导入，失败时可复制订阅后手动新建远程配置。',
    compatibilityNote: '仅在 Apple Silicon Mac 下归入桌面端筛选结果。',
  },
]

export function buildQuickImportUrl(client: ClientItem, subscribeUrl: string) {
  if (!client.quickImportEnabled || !client.quickImportUrl) return null
  return client.quickImportUrl
    .replaceAll('{base64url}', btoa(subscribeUrl))
    .replaceAll('{url}', encodeURIComponent(subscribeUrl))
    .replaceAll('{name}', encodeURIComponent(`${appConfig.appName}订阅`))
}

export function normalizeCatalogClient(client: ClientCatalogItemData): ClientItem {
  const scopes = client.scopes.map((scope) => ({
    deviceType: scope.device_type,
    platform: scope.platform,
    sortOrder: scope.sort_order,
  }))
  const deviceTypes = [...new Set(scopes.map((scope) => scope.deviceType))]
  const platforms = [...new Set(scopes.map((scope) => scope.platform))]

  return {
    id: client.slug || String(client.id),
    name: client.name,
    logoUrl: client.logo_url || undefined,
    description: client.description,
    deviceTypes,
    platforms,
    tags: client.tags,
    downloadUrl: client.download_url,
    downloadLabel: '前往下载',
    quickImportEnabled: client.quick_import_enabled,
    quickImportUrl: client.quick_import_url || undefined,
    quickImportLabel: '快速导入',
    subscriptionTemplate: client.subscription_template,
    docsUrl: client.docs_url || undefined,
    order: scopes.length ? Math.min(...scopes.map((scope) => scope.sortOrder)) : 0,
    scopes,
    subscriptionUrl: client.subscription_url,
    importHint: client.quick_import_enabled
      ? '支持从当前页面尝试拉起客户端；若系统未响应，也可以复制订阅链接后手动添加。'
      : `默认使用 ${templateLabels[client.subscription_template]} 模板，可复制订阅链接后在客户端中添加。`,
  }
}

export function getClientSortOrder(client: ClientItem, deviceType: DeviceType, platform: PlatformFilter) {
  return client.scopes?.find((scope) => scope.deviceType === deviceType && scope.platform === platform)?.sortOrder
    ?? client.order
}

export function formatClientPlatforms(platforms: PlatformFilter[]) {
  return platforms.map((platform) => platformLabels[platform]).join(' / ')
}
