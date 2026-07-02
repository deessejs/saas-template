import { Button } from "@workspace/ui/components/button"

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Create account</h1>
      <p className="text-muted-foreground text-sm">
        Sign up to get started.
      </p>
      {/* TODO: build signup form, wire to better-auth signUp */}
      <Button type="button">Create account</Button>
    </div>
  )
}