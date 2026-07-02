import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "SaaS Template",
  description: "SaaS application built with Next.js and shared UI components",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
