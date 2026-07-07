"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { DangerZone } from "@/components/settings"

const CONFIRM_TEXT = "DELETE"

export function DeleteAccountDialog() {
  const [confirm, setConfirm] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [done, setDone] = useState(false)

  function handleDelete() {
    if (confirm !== CONFIRM_TEXT) return
    setDeleting(true)
    // TODO: wire to better-auth
    setTimeout(() => setDone(true), 2000)
  }

  if (done) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        <p className="font-medium">Account deleted</p>
        <p>You have been signed out. Your account and data have been permanently removed.</p>
      </div>
    )
  }

  return (
    <DangerZone
      title="Delete account"
      description="Permanently delete your account and all associated data. This action cannot be undone."
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Type <strong>{CONFIRM_TEXT}</strong> to confirm.
        </p>

        <div className="flex gap-2">
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={CONFIRM_TEXT}
            autoComplete="off"
          />
          <Button
            variant="destructive"
            disabled={confirm !== CONFIRM_TEXT || deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting…" : "Delete account"}
          </Button>
        </div>
      </div>
    </DangerZone>
  )
}
