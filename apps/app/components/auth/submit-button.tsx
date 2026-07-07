"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@workspace/ui/components/button"

interface SubmitButtonProps {
  children?: React.ReactNode
  className?: string
}

export function SubmitButton({ children = "Submit", className }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? "Loading…" : children}
    </Button>
  )
}
