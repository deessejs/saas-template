"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useActionState } from "react"
import { resetPasswordAction, type ResetPasswordState } from "@/app/(unprotected)/(auth)/reset-password/actions"
import { SubmitButton } from "./submit-button"
import { PasswordInput } from "./password-input"

const initialState: ResetPasswordState = null

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)
  const [confirmMismatch, setConfirmMismatch] = useState(false)
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {}

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
        <p className="font-medium">Password updated</p>
        <p>Your password has been reset. You can now log in.</p>
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium">New password</label>
          <PasswordInput
            ref={passwordRef}
            id="password"
            name="password"
            autoComplete="new-password"
            error={!!fieldErrors.password?.length}
          />
          {fieldErrors.password?.map((e) => (
            <p key={e} className="text-sm text-destructive" role="alert">
              {e}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</label>
          <PasswordInput
            ref={confirmRef}
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            error={!!(fieldErrors.confirmPassword?.length || confirmMismatch)}
            onChange={() =>
              setConfirmMismatch(
                !!passwordRef.current?.value &&
                !!confirmRef.current?.value &&
                passwordRef.current?.value !== confirmRef.current?.value
              )
            }
          />
          {confirmMismatch && (
            <p className="text-sm text-destructive" role="alert">
              Passwords do not match
            </p>
          )}
          {fieldErrors.confirmPassword?.map((e) => (
            <p key={e} className="text-sm text-destructive" role="alert">
              {e}
            </p>
          ))}
        </div>

        <SubmitButton>Reset password</SubmitButton>
      </form>
    </div>
  )
}
