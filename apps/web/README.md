# `apps/web`

Public marketing and landing page for the SaaS template.

## Purpose

`apps/web` is the public-facing entry point — what anonymous visitors see before they sign up. It includes the landing page, pricing, and general marketing content.

## Stack

- Next.js 16 (App Router)
- Tailwind CSS v4 via `@workspace/ui/postcss.config`
- shadcn/ui components from `@workspace/ui`
- Shared config from `@workspace/ui/lib/config` (`APP_NAME`, `APP_CONFIG`)

## Setup

No additional env vars required. Shared app config is read from `NEXT_PUBLIC_APP_*` variables:

```env
NEXT_PUBLIC_APP_NAME="SaaS Template"
NEXT_PUBLIC_APP_DESCRIPTION="..."
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Structure

```
app/
├── layout.tsx              # Root layout: fonts, ThemeProvider, SiteHeader
├── page.tsx                # Landing page
└── globals.css             # Imports @workspace/ui/globals.css

components/
├── headers/
│   └── site-header.tsx     # Top nav with login/signup CTAs
└── footers/
    └── app-footer.tsx      # Footer with links and copyright
```

## Relationship to `apps/app`

`apps/web` is public. `apps/app` contains the authenticated dashboard and user-facing features (auth routes, settings, etc.). Both share `@workspace/ui` for components and styling.

Links to `/login` and `/signup` in the header point to `apps/app`'s route groups.
