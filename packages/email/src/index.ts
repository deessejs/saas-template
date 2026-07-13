import { mailer } from "./transport.js"
import { VerifyEmail } from "./templates/verify-email.js"
import { ResetPassword } from "./templates/reset-password.js"
import type { MailerTransport, SendArgs } from "./types.js"

export { mailer, type MailerTransport, type SendArgs }

/**
 * Send a transactional email. Fire-and-forget per better-auth's
 * "Avoid awaiting the email sending to prevent timing attacks" recommendation.
 *
 * Call sites do `void sendAuthEmail(...)` inside better-auth callbacks.
 */
export async function sendAuthEmail(opts: {
  to: string
  subject: string
  react: React.ReactNode
  tags?: Array<{ name: string; value: string }>
  idempotencyKey?: string
}): Promise<void> {
  console.log("[DEBUG] sendAuthEmail() called — subject:", opts.subject)
  void mailer.send({
    to: opts.to,
    subject: opts.subject,
    react: opts.react,
    ...(opts.tags ? { tags: opts.tags } : {}),
    ...(opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : {}),
  })
}

/**
 * Re-export the templates under a `templates` namespace for ergonomic imports
 * from packages/auth:
 *
 *   import { sendAuthEmail, templates } from "@workspace/email"
 *   templates.VerifyEmail({ url, userEmail: user.email })
 */
export const templates = {
  VerifyEmail,
  ResetPassword,
}
