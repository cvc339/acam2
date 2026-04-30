import Link from "next/link"
import Image from "next/image"

interface HeaderLogoProps {
  subtitle?: string
  href?: string
}

export function HeaderLogo({ subtitle = "Compensações Ambientais", href = "/" }: HeaderLogoProps) {
  return (
    <Link href={href} className="acam-header-logo">
      <div className="acam-header-logo-icon">
        <Image
          src="/acam-simbolo.svg"
          alt=""
          width={40}
          height={40}
          priority
        />
      </div>
      <div>
        <div className="acam-header-logo-title">ACAM</div>
        <div className="acam-header-logo-subtitle">{subtitle}</div>
      </div>
    </Link>
  )
}
