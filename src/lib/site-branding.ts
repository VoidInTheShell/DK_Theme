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
      logo: imageUrl(text(data.user_logo) || data.logo),
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
    applyFavicon(current.logo)
    listeners.forEach(listener => listener())
  } catch { /* Keep the existing brand usable while the public configuration is unavailable. */ }
}

/**
 * Swap the favicon link node (instead of mutating href) so the bundled
 * type="image/png" hint never mismatches a configured SVG/other logo and
 * browsers reliably pick up the change.
 */
function applyFavicon(logo: string) {
  if (!logo) return
  const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  const icon = document.createElement('link')
  icon.rel = 'icon'
  icon.href = logo
  if (existing) existing.replaceWith(icon)
  else document.head.append(icon)
}

let focusSyncStarted = false
function startFocusSync() {
  if (focusSyncStarted) return
  focusSyncStarted = true
  // The brand icon can change from the admin panel or MCP at any time;
  // re-read it when the user returns to this tab so the sidebar and favicon
  // stay current without a manual reload.
  window.addEventListener('focus', () => { void refreshSiteBranding() })
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void refreshSiteBranding()
  })
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!started) { started = true; startFocusSync(); void refreshSiteBranding() }
  return () => { listeners.delete(listener) }
}
export function useSiteBranding() { return useSyncExternalStore(subscribe, () => current, () => defaults) }
