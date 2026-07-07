import { ResetPasswordForm } from "@/components/auth"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<URLSearchParams>
}) {
  const params = await searchParams
  const token = params.get("token") ?? ""

  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Choose a new password for your account.
        </p>
      </div>
      <ResetPasswordForm token={token} />
    </div>
  )
}
