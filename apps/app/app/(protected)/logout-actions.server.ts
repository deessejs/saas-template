"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@workspace/auth"

export async function logoutAction() {
  await auth.api.signOut({ headers: await headers() })
  redirect("/login")
}
