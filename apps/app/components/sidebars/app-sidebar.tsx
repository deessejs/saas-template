"use client"

import { NavMain } from "@/components/sidebars/nav-main"
import { NavUser } from "@/components/sidebars/nav-user"
import { TeamSwitcher } from "@/components/sidebars/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar"

import { APP_NAME } from "@workspace/ui/lib/config"
import { Home, Settings } from "lucide-react"

// TODO: replace with real user data from auth session
const data = {
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/user.png",
  },
  teams: [
    {
      name: APP_NAME,
      logo: <span className="text-xs font-bold">{APP_NAME.charAt(0)}</span>,
      plan: "SaaS",
    },
  ],
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: <Home />,
      isActive: true,
      items: [],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: <Settings />,
      items: [],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex h-14 flex-row items-center border-b p-0">
        <div className="flex w-full items-center">
          <TeamSwitcher teams={data.teams} />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="border-t">
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
