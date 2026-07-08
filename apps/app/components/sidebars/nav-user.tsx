"use client"

import { useState } from "react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { ChevronsUpDownIcon, SparklesIcon, BadgeCheckIcon, CreditCardIcon, BellIcon, LogOutIcon } from "lucide-react"
import { logoutAction } from "@/app/(protected)/logout-actions.server"

const VERCEL_AVATAR_BASE = "https://vercel.com/api/www/avatar"

type NavUserProps = {
  user: {
    name: string
    email: string
    /** better-auth sets this for OAuth providers (Google/GitHub). Null for
     *  email/password signups. When null, we fall back to a Vercel avatar
     *  seeded with the email, then to initials. */
    image?: string | null | undefined
  } | null
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

function getAvatarUrl(user: NonNullable<NavUserProps["user"]>): string {
  if (user.image) return user.image
  // Vercel avatar endpoint accepts any string; email gives a stable per-user
  // identicon-style avatar.
  return `${VERCEL_AVATAR_BASE}?s=40&u=${encodeURIComponent(user.email)}&dpl=dpl_AS99V7XmtTzE4xdb72tYFtNTVV48`
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()
  const [loggingOut, setLoggingOut] = useState(false)

  // No session — render an anonymous "Guest" placeholder rather than crashing.
  // The proxy.ts gate should prevent this, but defensive for SSR edge cases.
  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">?</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Guest</span>
              <span className="truncate text-xs">Not signed in</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const avatarUrl = getAvatarUrl(user)
  const initials = getInitials(user.name)

  async function handleLogout() {
    setLoggingOut(true)
    await logoutAction()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatarUrl} alt={user.name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatarUrl} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <SparklesIcon
                />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheckIcon
                />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon
                />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon
                />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={loggingOut} aria-busy={loggingOut}>
              <LogOutIcon
              />
              {loggingOut ? "Signing out…" : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}