import { ForgotPasswordForm } from "@/components/auth"

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Forgot password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  )
}
