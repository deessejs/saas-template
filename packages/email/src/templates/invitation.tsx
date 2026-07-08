import { Button, Heading, Link, Section, Text } from "@react-email/components"
import { BaseLayout } from "./layout.js"

interface InvitationEmailProps {
  inviteLink: string
  organizationName: string
  inviterName: string
  inviterEmail: string
  role: string
  expiresAt: Date
}

export function InvitationEmail({
  inviteLink,
  organizationName,
  inviterName,
  inviterEmail,
  role,
  expiresAt,
}: InvitationEmailProps) {
  const formattedExpiry = new Date(expiresAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <BaseLayout
      preview={`Join ${organizationName} as a ${role}. The invitation expires on ${formattedExpiry}.`}
    >
      <Heading className="text-xl font-semibold text-gray-900">
        {inviterName} invited you to {organizationName}
      </Heading>
      <Text className="text-gray-700">
        <strong>{inviterName}</strong> ({inviterEmail}) has invited you to join{" "}
        <strong>{organizationName}</strong> as a <strong>{role}</strong>.
      </Text>
      <Section className="my-6 text-center">
        <Button
          href={inviteLink}
          className="rounded-md bg-brand px-6 py-3 text-center text-base font-medium text-brandText"
        >
          Accept invitation
        </Button>
      </Section>
      <Text className="text-sm text-gray-600">
        This invitation expires on {formattedExpiry}.
        <br />
        Or copy and paste this link:
        <br />
        <Link href={inviteLink} className="text-brand underline">
          {inviteLink}
        </Link>
      </Text>
    </BaseLayout>
  )
}