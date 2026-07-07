"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@workspace/auth"
import { APIError } from "better-auth"
import type { ResetPasswordState } from "@/app/(unprotected)/(auth)/actions"
import { resetPasswordSchema } from "@/app/(unprotected)/(auth)/actions"

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const raw = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  }

  const parsed = resetPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    const tree = z.treeifyError(parsed.error) as {
      properties?: Record<string, { errors?: string[] }>
    }
    const fieldErrors: Record<string, string[]> = {}
    for (const [key, prop] of Object.entries(tree.properties ?? {})) {
      if (prop?.errors) fieldErrors[key] = prop.errors
    }
    return { ok: false, fieldErrors }
  }

  const token = formData.get("token") as string | null
  if (!token) {
    return { ok: false, fieldErrors: { token: ["Invalid or missing token"] } }
  }

  try {
    await auth.api.resetPassword({
      body: { newPassword: parsed.data.password },
      headers: await headers(),
      query: { token },
    })
  } catch (e) {
    if (e instanceof APIError) {
      return { ok: false, fieldErrors: { token: [e.message] } }
    }
    throw e
  }

  redirect("/login")
}