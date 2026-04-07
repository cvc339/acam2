import Link from "next/link"

interface HeaderLogoProps {
  subtitle?: string
  href?: string
}

export function HeaderLogo({ subtitle = "Compensações Ambientais", href = "/" }: HeaderLogoProps) {
  return (
    <Link href={href} className="acam-header-logo">
      <div className="acam-header-logo-icon">
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
        </svg>
      </div>
      <div>
        <div className="acam-header-logo-title">ACAM</div>
        <div className="acam-header-logo-subtitle">{subtitle}</div>
      </div>
    </Link>
  )
}
