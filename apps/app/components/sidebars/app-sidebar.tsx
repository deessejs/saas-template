"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NavMain } from "@/components/sidebars/nav-main"
import { NavUser } from "@/components/sidebars/nav-user"
import { SettingsNav } from "@/components/sidebars/settings-nav"
import { SidebarBackAction } from "@/components/sidebar-back-action"
import { OrgSwitcher } from "@/components/sidebars/org-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar"

import { Home, Settings } from "lucide-react"

const dashboardNav = [
  {
    title: "Home",
    url: "/",
    icon: <Home />,
    items: [],
  },
]

/**
 * Pinned "Settings" shortcut rendered at the bottom of the scrollable
 * sidebar content via `mt-auto`. Hidden on /settings/* — the SettingsNav
 * renders the full settings menu there, and SidebarBackAction brings the
 * user home, so adding a third entry would be redundant.
 */
function SettingsShortcut() {
  return (
    <SidebarGroup className="mt-auto">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings">
                <Settings className="size-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

/**
 * Returns true when the current path lives under /settings (but NOT a path
 * that merely starts with the same letters, e.g. /settings-pro).
 */
function isSettingsPath(pathname: string): boolean {
  return pathname === "/settings" || pathname.startsWith("/settings/")
}

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const inSettings = isSettingsPath(pathname)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex h-14 flex-row items-center border-b p-0">
        <div className="flex w-full items-center">
          <OrgSwitcher />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarBackAction />
          </SidebarGroupContent>
        </SidebarGroup>
        {inSettings ? <SettingsNav /> : <NavMain items={dashboardNav} />}
        {!inSettings && <SettingsShortcut />}
      </SidebarContent>
      <SidebarFooter className="border-t">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}