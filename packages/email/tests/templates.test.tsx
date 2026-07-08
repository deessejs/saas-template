import { render } from "@react-email/components"
import { describe, expect, it } from "vitest"
import { VerifyEmail } from "../src/templates/verify-email.jsx"
import { ResetPassword } from "../src/templates/reset-password.jsx"
import { InvitationEmail } from "../src/templates/invitation.jsx"

describe("templates", () => {
  it("VerifyEmail renders without crashing and contains the URL", async () => {
    const url = "https://app.example.com/verify?token=abc"
    const html = await render(<VerifyEmail url={url} userEmail="u@x.com" />)
    expect(html).toContain(url)
    expect(html).toContain("Verify")
  })

  it("ResetPassword renders and contains the URL", async () => {
    const url = "https://app.example.com/reset?token=xyz"
    const html = await render(<ResetPassword url={url} userEmail="u@x.com" />)
    expect(html).toContain(url)
    expect(html).toContain("Reset")
  })

  it("InvitationEmail renders with org name and role", async () => {
    const html = await render(
      <InvitationEmail
        inviteLink="https://app.example.com/accept?id=inv1"
        organizationName="Acme"
        inviterName="Alice"
        inviterEmail="alice@acme.com"
        role="admin"
        expiresAt={new Date("2026-07-14")}
      />,
    )
    expect(html).toContain("Acme")
    expect(html).toContain("Alice")
    expect(html).toContain("admin")
    expect(html).toContain("https://app.example.com/accept?id=inv1")
  })
})