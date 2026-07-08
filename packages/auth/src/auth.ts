import { betterAuth, type Session } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { nextCookies } from "better-auth/next-js"
import { db } from "@workspace/database"
import * as schema from "@workspace/database"
import { serverEnv } from "@workspace/env/server"
import { sendAuthEmail, templates } from "@workspace/email"
import { organization } from "better-auth/plugins"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
}

/**
 * Organization plugin options shared between the runtime auth instance and the
 * test auth instance. Kept in sync by living in the same file.
 */
const organizationPluginOptions = {
  requireEmailVerificationOnInvitation: true,

  sendInvitationEmail: async ({
    email,
    organization: org,
    inviter,
    invitation,
  }: {
    email: string
    organization: { name: string }
    inviter: { user?: { name?: string | null; email: string } | null }
    invitation: { id: string; role?: string; expiresAt: Date }
  }) => {
    const inviteLink = `${serverEnv.BETTER_AUTH_URL}/accept-invitation?id=${invitation.id}`
    void sendAuthEmail({
      to: email,
      subject: `Join ${org.name}`,
      react: templates.InvitationEmail({
        inviteLink,
        organizationName: org.name,
        inviterName: inviter.user?.name ?? inviter.user?.email ?? "Someone",
        inviterEmail: inviter.user?.email ?? "",
        role: invitation.role ?? "member",
        expiresAt: new Date(invitation.expiresAt),
      }),
      tags: [{ name: "flow", value: "invitation" }],
      idempotencyKey: invitation.id,
    })
  },
}

export const auth = betterAuth({
  baseURL: serverEnv.BETTER_AUTH_URL,
  secret: serverEnv.BETTER_AUTH_SECRET,
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    ...serverEnv.ALLOWED_ORIGINS,
  ],

  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      console.log("[DEBUG] sendResetPassword callback FIRED for:", user.email)
      void sendAuthEmail({
        to: user.email,
        subject: "Reset your password",
        react: templates.ResetPassword({ url, userEmail: user.email }),
        tags: [{ name: "flow", value: "reset-password" }],
      })
    },
  },

  emailVerification: {
    sendOnSignUp: false,
    sendVerificationEmail: async ({ user, url }) => {
      console.log("[DEBUG] better-auth sendVerificationEmail callback FIRED for:", user.email, "| url:", url?.slice(0, 60))
      await sendAuthEmail({
        to: user.email,
        subject: "Verify your email",
        react: templates.VerifyEmail({ url, userEmail: user.email }),
        tags: [{ name: "flow", value: "verify-email" }],
      })
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },

  advanced: {
    useSecureCookies: true,
  },

  experimental: {
    joins: true,
  },

  // Auto-create an org on every signup — fires BEFORE the session row is
  // written. Returning activeOrganizationId sets it in the session.
  databaseHooks: {
    session: {
      create: {
        before: async (
          session: Session & {
            user?: { name?: string | null; email?: string } | null
          },
        ) => {
          const userName =
            session.user?.name ?? session.user?.email?.split("@")[0] ?? "Personal"

          const org = await (auth.api as any).createOrganization({
            body: {
              name: `${userName}'s workspace`,
              slug: slugify(userName),
              // userId omitted → better-auth uses the session user
            },
            headers: new Headers(),
          })

          return {
            data: {
              ...session,
              activeOrganizationId: org.id,
            },
          }
        },
      },
    },
  },

  plugins: [
    organization({
      ...organizationPluginOptions,
      // After accepting an invitation, set the invited org as the active one.
      organizationHooks: {
        afterAcceptInvitation: async ({ organization: org }) => {
          await (auth.api as any).setActiveOrganization({
            body: { organizationId: org.id },
            headers: new Headers(),
          })
        },
      },
    }),
    nextCookies(),
  ],
}) as unknown as ReturnType<typeof betterAuth>

// Type exports for consumers
export type AuthInstance = typeof auth
export type { Session, User } from "better-auth"
