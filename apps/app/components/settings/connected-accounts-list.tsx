"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"

const PROVIDERS = {
  google: { name: "Google", icon: "G" },
  github: { name: "GitHub", icon: "GH" },
}

const DUMMY_LINKED = [
  { id: "1", providerId: "google", accountId: "user@gmail.com" },
]

export function ConnectedAccountsList() {
  const [linked, setLinked] = useState(DUMMY_LINKED)
  const [linking, setLinking] = useState<string | null>(null)
  const [unlinking, setUnlinking] = useState<string | null>(null)

  function handleLink(provider: string) {
    setLinking(provider)
    // TODO: wire to better-auth
    setTimeout(() => {
      setLinked((prev) => [
        ...prev,
        { id: Math.random().toString(), providerId: provider, accountId: `${provider}@example.com` },
      ])
      setLinking(null)
    }, 1500)
  }

  function handleUnlink(id: string, providerId: string) {
    if (!confirm(`Unlink ${providerId}?`)) return
    setUnlinking(id)
    setTimeout(() => {
      setLinked((prev) => prev.filter((a) => a.id !== id))
      setUnlinking(null)
    }, 1000)
  }

  return (
    <div className="flex flex-col gap-4">
      {linked.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Linked accounts</p>
          {linked.map((account) => {
            const info = PROVIDERS[account.providerId as keyof typeof PROVIDERS] ?? {
              name: account.providerId,
              icon: account.providerId.slice(0, 2).toUpperCase(),
            }
            return (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg border bg-muted text-xs font-bold">
                    {info.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{info.name}</p>
                    <p className="text-xs text-muted-foreground">{account.accountId}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlink(account.id, account.providerId)}
                  disabled={unlinking === account.id}
                >
                  {unlinking === account.id ? "Unlinking…" : "Unlink"}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Link a new account</p>
        <div className="flex gap-2">
          {(["google", "github"] as const).map((provider) => {
            const isLinked = linked.some((a) => a.providerId === provider)
            const info = PROVIDERS[provider]
            return (
              <Button
                key={provider}
                variant="outline"
                size="sm"
                onClick={() => handleLink(provider)}
                disabled={isLinked || linking === provider}
              >
                {linking === provider ? "Linking…" : `Link ${info.name}`}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
