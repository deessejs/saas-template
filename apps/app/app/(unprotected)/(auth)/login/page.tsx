import { LoginForm } from "@/components/auth"

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Log in</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your account.
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
