import { SignupForm } from "@/components/auth"

export default function SignupPage() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="text-sm text-muted-foreground">
          Sign up to get started.
        </p>
      </div>
      <SignupForm />
    </div>
  )
}
