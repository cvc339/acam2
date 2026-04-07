import Link from "next/link"

export default function CompensacoesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-muted-foreground inline-flex items-center gap-1" style={{ textDecoration: "none" }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Voltar ao dashboard
        </Link>
      </div>
      {children}
    </div>
  )
}
