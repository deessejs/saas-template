"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@workspace/auth"
import { APIError } from "better-auth"
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  type LoginState,
  type SignupState,
  type ForgotPasswordState,
} from "./actions"

function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const tree = z.treeifyError(error) as {
    properties?: Record<string, { errors?: string[] }>
  }
  const fieldErrors: Record<string, string[]> = {}
  for (const [key, prop] of Object.entries(tree.properties ?? {})) {
    if (prop?.errors) fieldErrors[key] = prop.errors
  }
  return fieldErrors
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) }
  }

  try {
    await auth.api.signInEmail({
      body: parsed.data,
      headers: await headers(),
    })
  } catch (e) {
    if (e instanceof APIError) {
      return { ok: false, message: e.message ?? "Invalid credentials" }
    }
    throw e
  }

  redirect("/home")
}

export async function signupAction(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) }
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
      },
      headers: await headers(),
    })
  } catch (e) {
    if (e instanceof APIError) {
      return { ok: false, message: e.message ?? "Could not create account" }
    }
    throw e
  }

  redirect("/home")
}

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const raw = {
    email: formData.get("email"),
  }

  const parsed = forgotPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) }
  }

  try {
    await auth.api.requestPasswordReset({
      body: {
        email: parsed.data.email,
        redirectTo: "/reset-password",
      },
      headers: await headers(),
    })
  } catch {
    // Always succeed to avoid email enumeration
  }

  return { ok: true, message: "Check your email for a reset link." }
}
