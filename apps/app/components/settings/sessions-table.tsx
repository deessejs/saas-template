"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"

const DUMMY_SESSIONS = [
  {
    id: "1",
    token: "tok_current",
    userAgent: "Chrome on macOS",
    ipAddress: "192.168.1.1",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isCurrent: true,
  },
  {
    id: "2",
    token: "tok_old",
    userAgent: "Safari on iPhone",
    ipAddress: "10.0.0.5",
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    isCurrent: false,
  },
]

export function SessionsTable() {
  const [sessions, setSessions] = useState(DUMMY_SESSIONS)
  const [revoking, setRevoking] = useState<string | null>(null)

  function handleRevoke(id: string) {
    setRevoking(id)
    setTimeout(() => {
      setSessions((prev) => prev.filter((s) => s.id !== id))
      setRevoking(null)
    }, 1000)
  }

  function handleRevokeAll() {
    if (!confirm("Sign out of all other devices?")) return
    setSessions((prev) => prev.filter((s) => s.isCurrent))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleRevokeAll}>
          Sign out everywhere else
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{session.userAgent}</p>
                {session.isCurrent && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                    Current
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {session.ipAddress} · Expires {new Date(session.expiresAt).toLocaleDateString()}
              </p>
            </div>
            {!session.isCurrent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevoke(session.id)}
                disabled={revoking === session.id}
              >
                {revoking === session.id ? "Signing out…" : "Sign out"}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
