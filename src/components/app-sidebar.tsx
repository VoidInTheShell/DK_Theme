import { useSiteBranding } from '@/lib/site-branding'
import * as React from "react"
import { Link, useNavigate } from 'react-router-dom'
import {
  IconBook,
  IconBell,
  IconBrandTelegram,
  IconCreditCard,
  IconDashboard,
  IconGauge,
  IconLifebuoy,
  IconLink,
  IconPercentage,
  IconReceipt,
  IconRoute,
  IconShieldLock,
  IconTicket,
  IconUsers,
  IconTrophy,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from '@/features/auth/auth-context'
import { startNavigationProgress } from '@/lib/navigation-progress'


function SupportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { support } = useSiteBranding()
  const navigate = useNavigate()
  function go(path: string) { onOpenChange(false); startNavigationProgress(); navigate(path) }
  const hasContact = Boolean(support.telegramUrl || support.groupUrl)
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>获取支持</DialogTitle>
        <DialogDescription>{support.description || '选择可用的支持方式。'}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 pt-2 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
        {hasContact ? <div className="flex min-w-0 flex-col gap-3 rounded-2xl border bg-muted/30 p-4">
          <h3 className="flex items-center gap-2 text-sm font-medium"><IconBrandTelegram className="size-4" />联系我们</h3>
          {support.telegramUrl ? <div className="flex flex-col gap-1 text-sm"><span className="text-muted-foreground">客服 Telegram</span><a className="break-all underline underline-offset-4" href={support.telegramUrl} target="_blank" rel="noreferrer">{support.telegramLabel || '联系客服'}</a></div> : null}
          {support.groupUrl ? <div className="flex flex-col gap-1 text-sm"><span className="text-muted-foreground">Telegram 群组</span><a className="break-all underline underline-offset-4" href={support.groupUrl} target="_blank" rel="noreferrer">{support.groupLabel || '加入群组'}</a></div> : null}
        </div> : null}
        {support.tickets ? <div className="flex min-w-0 flex-col gap-3 rounded-2xl border bg-muted/30 p-4">
          <h3 className="flex items-center gap-2 text-sm font-medium"><IconUsers className="size-4" />提交工单</h3>
          <p className="text-sm leading-6 text-muted-foreground">通过工单提交账户、订阅或节点问题。</p>
          <Button className="mt-auto w-full" onClick={() => go('/tickets')}>前往工单页面</Button>
        </div> : null}
        {support.knowledge ? <div className="flex min-w-0 flex-col gap-3 rounded-2xl border bg-muted/30 p-4">
          <h3 className="flex items-center gap-2 text-sm font-medium"><IconBook className="size-4" />帮助文档</h3>
          <p className="text-sm leading-6 text-muted-foreground">查看使用说明与常见问题。</p>
          <Button className="mt-auto w-full" variant="outline" onClick={() => go('/knowledge')}>前往帮助文档</Button>
        </div> : null}
        {!hasContact && !support.tickets && !support.knowledge ? <p className="text-sm text-muted-foreground">暂未配置支持方式。</p> : null}
      </div>
    </DialogContent>
  </Dialog>
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const brand = useSiteBranding()
  const { setOpenMobile } = useSidebar()
  const { announcementsEnabled, logout, selfUseMode, user } = useAuth()
  const [supportOpen, setSupportOpen] = React.useState(false)
  const useRestrictedNavigation = selfUseMode && !user?.is_admin && !user?.is_staff

  const sidebarUser = {
    name: brand.appName,
    email: user?.email ?? 'demo@dk-theme.local',
    avatar: user?.avatar_url ?? '/avatars/shadcn.jpg',
  }

  return (
    <>
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/dashboard" onClick={() => startNavigationProgress()}>
                <span className='flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-sky-200/80 bg-sky-50/90 dark:border-sky-400/20 dark:bg-sky-400/10'>
                  <img src={brand.logo} alt='' className='h-5 w-[22px] object-contain' />
                </span>
                <span className="text-base font-semibold">{brand.appName}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={[
            { title: "用户中心", url: "/dashboard", icon: IconDashboard },
            { title: "使用记录", url: "/usage", icon: IconGauge },
            { title: "排行榜", url: "/leaderboard", icon: IconTrophy },
            { title: "订阅中心", url: "/clients", icon: IconLink },
            ...(useRestrictedNavigation
              ? [{ title: "配额信息", url: "/quota", icon: IconGauge }]
              : [{ title: "订购套餐", url: "/plans", icon: IconCreditCard }]),
            { title: "节点状态", url: "/node-status", icon: IconRoute },
            ...(announcementsEnabled ? [{ title: "系统公告", url: "/announcements", icon: IconBell }] : []),
            ...(!useRestrictedNavigation
              ? [
                  { title: "订单中心", url: "/orders", icon: IconReceipt },
                  { title: "邀请返利", url: "/invite", icon: IconPercentage },
                ]
              : []),
            { title: "工单支持", url: "/tickets", icon: IconTicket },
            { title: "安全中心", url: "/settings", icon: IconShieldLock },
            { title: "帮助文档", url: "/knowledge", icon: IconBook },
            ...(brand.support.enabled ? [{ title: "获取支持", icon: IconLifebuoy, onClick: () => { setOpenMobile(false); setSupportOpen(true) } }] : []),
          ].filter(item => !("url" in item && item.url && brand.hiddenMenus.includes(item.url)))}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} onLogout={logout} />
      </SidebarFooter>
    </Sidebar>
    {brand.support.enabled ? <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} /> : null}
    </>
  )
}
