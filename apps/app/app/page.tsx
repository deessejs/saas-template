import { Button } from "@workspace/ui/components/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">SaaS Template</h1>
      <p className="text-muted-foreground">
        Welcome to the monorepo. This app uses shared UI components.
      </p>
      <div className="flex gap-2">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
    </main>
  )
}
