"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { PasswordInput } from "@/components/auth/password-input"

export function PasswordForm() {
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: wire to better-auth
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {saved && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Password updated.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="current" className="text-sm font-medium">Current password</label>
        <PasswordInput id="current" name="current" autoComplete="current-password" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="new" className="text-sm font-medium">New password</label>
        <PasswordInput id="new" name="new" autoComplete="new-password" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm" className="text-sm font-medium">Confirm new password</label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" />
      </div>

      <div className="flex justify-end">
        <Button type="submit">Update password</Button>
      </div>
    </form>
  )
}
