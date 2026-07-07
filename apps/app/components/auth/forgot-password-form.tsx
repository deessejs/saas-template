"use client"

import Link from "next/link"
import { useActionState } from "react"
import { forgotPasswordAction } from "@/app/(unprotected)/(auth)/actions.server"
import type { ForgotPasswordState } from "@/app/(unprotected)/(auth)/actions"
import { Input } from "@workspace/ui/components/input"
import { SubmitButton } from "./submit-button"

const initialState: ForgotPasswordState = null

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState)
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {}

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
        <p className="font-medium">Email sent</p>
        <p>{state.message}</p>
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            aria-invalid={!!fieldErrors.email?.length}
            aria-describedby={fieldErrors.email?.length ? "email-error" : undefined}
          />
          {fieldErrors.email?.map((e) => (
            <p key={e} id="email-error" className="text-sm text-destructive" role="alert">
              {e}
            </p>
          ))}
        </div>

        <SubmitButton>Send reset link</SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
