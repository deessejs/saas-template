import { SiteHeader } from "@/components/headers/site-header"

export default function UnprotectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  )
}