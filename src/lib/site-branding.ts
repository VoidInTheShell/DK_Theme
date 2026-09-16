import { useSyncExternalStore } from 'react'
import { apiClient } from '@/lib/api/client'
import { appConfig } from '@/lib/config'

type SiteBranding = {
  appName: string
  logo: string
  description: string
  loginTitle: string
  loginDescription: string
  hiddenMenus: string[]
  support: {
    enabled: boolean
    description: string
    telegramLabel: string
    telegramUrl: string
    groupLabel: string
    groupUrl: string
    tickets: boolean
    knowledge: boolean
  }
}
const defaults: SiteBranding = { appName: appConfig.appName, logo: appConfig.brandMarkUrl, description: '', loginTitle: '', loginDescription: '', hiddenMenus: [], support: {
  enabled: true, description: '选择联系方式，或通过工单和帮助文档获取支持。',
  telegramLabel: appConfig.support.telegramContactLabel, telegramUrl: appConfig.support.telegramContactUrl,
  groupLabel: appConfig.support.telegramGroupLabel, groupUrl: appConfig.support.telegramGroupUrl,
  tickets: true, knowledge: true,
} }
let current = defaults
let started = false
const listeners = new Set<() => void>()
function text(value: unknown, fallback = '') { return typeof value === 'string' ? value : fallback }
function flag(value: unknown, fallback = true) { return value == null ? fallback : value === true || value === 1 || value === '1' || value === 'true' }
function supportUrl(value: unknown, fallback: string) {
  if (value == null) return fallback
  try { const url = new URL(String(value)); return ['https:', 'http:'].includes(url.protocol) ? url.href : '' } catch { return '' }
}
function imageUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return defaults.logo
  try {
    const url = new URL(value, window.location.origin)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : defaults.logo
  } catch { return defaults.logo }
}
export async function refreshSiteBranding() {
  try {
    const data = await apiClient.get<{ data: Record<string, unknown> }>('/api/v1/guest/comm/config').then(response => response.data.data)
    current = {
      appName: text(data.app_name, defaults.appName) || defaults.appName,
      logo: imageUrl(data.logo),
      description: text(data.app_description),
      loginTitle: text(data.user_login_title),
      loginDescription: text(data.user_login_description),
      hiddenMenus: Array.isArray(data.user_hidden_menus) ? data.user_hidden_menus.filter((item): item is string => typeof item === 'string') : [],
      support: {
        enabled: flag(data.user_support_enabled),
        description: text(data.user_support_description, defaults.support.description),
        telegramLabel: text(data.user_support_telegram_label, defaults.support.telegramLabel),
        telegramUrl: supportUrl(data.user_support_telegram_url, defaults.support.telegramUrl),
        groupLabel: text(data.user_support_group_label, defaults.support.groupLabel),
        groupUrl: supportUrl(data.user_support_group_url, defaults.support.groupUrl),
        tickets: flag(data.user_support_ticket_enabled), knowledge: flag(data.user_support_knowledge_enabled),
      },
    }
    document.title = current.appName
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!description) { description = document.createElement('meta'); description.name = 'description'; document.head.append(description) }
    description.content = current.description
    let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!icon) { icon = document.createElement('link'); icon.rel = 'icon'; document.head.append(icon) }
    if (current.logo) icon.href = current.logo
    listeners.forEach(listener => listener())
  } catch { /* Keep the existing brand usable while the public configuration is unavailable. */ }
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!started) { started = true; void refreshSiteBranding() }
  return () => { listeners.delete(listener) }
}
export function useSiteBranding() { return useSyncExternalStore(subscribe, () => current, () => defaults) }
