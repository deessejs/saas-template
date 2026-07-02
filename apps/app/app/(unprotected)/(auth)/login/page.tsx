import { Button } from "@workspace/ui/components/button"

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Log in</h1>
      <p className="text-muted-foreground text-sm">
        Enter your credentials to access your account.
      </p>
      {/* TODO: build login form, wire to better-auth signIn */}
      <Button type="button">Continue</Button>
    </div>
  )
}