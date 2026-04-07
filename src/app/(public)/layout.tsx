import Link from "next/link"
import { HeaderLogo } from "@/components/acam"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="acam-header">
        <div className="acam-header-content">
          <HeaderLogo />
          <nav className="acam-header-nav">
            <Link href="/login" className="acam-btn acam-btn-ghost acam-btn-sm">Entrar</Link>
            <Link href="/registro" className="acam-btn acam-btn-primary acam-btn-sm">Criar conta</Link>
          </nav>
        </div>
      </header>
      <main style={{ maxWidth: "var(--max-width-4xl)", margin: "0 auto", padding: "var(--spacing-8) var(--spacing-6)", width: "100%" }}>
        {children}
      </main>
      <footer className="acam-footer" style={{ marginTop: "auto" }}>
        <div className="acam-footer-content">
          <span className="acam-footer-text">© 2026 ACAM · Vieira Castro Sociedade Individual de Advocacia</span>
        </div>
      </footer>
    </div>
  )
}
