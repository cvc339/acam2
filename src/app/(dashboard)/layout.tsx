import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/layout/logout-button"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, email, is_admin")
    .eq("id", user.id)
    .single()

  const { data: saldo } = await supabase
    .from("saldo_creditos")
    .select("saldo")
    .eq("usuario_id", user.id)
    .single()

  const nome = perfil?.nome || user.email?.split("@")[0] || "Usuário"
  const creditosDisponiveis = saldo?.saldo ?? 0

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header — fiel ao ACAM1 */}
      <header className="acam-header">
        <div className="acam-header-content">
          <Link href="/dashboard" className="acam-header-logo">
            <div className="acam-header-logo-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "var(--font-size-xl)", fontWeight: 600, color: "var(--neutral-800)" }}>ACAM</div>
              <div style={{ fontSize: "var(--font-size-xs)", color: "var(--neutral-500)" }}>Olá, {nome}</div>
            </div>
          </Link>
          <nav className="acam-header-nav">
            <div className="acam-header-credits">
              <span style={{ color: "var(--neutral-500)" }}>Créditos:</span>
              <span style={{ fontWeight: 500, color: "var(--neutral-800)" }}>{creditosDisponiveis}</span>
            </div>
            <Link href="/creditos" className="acam-btn acam-btn-primary acam-btn-sm">Comprar</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      {/* Conteúdo */}
      <main style={{ maxWidth: "var(--max-width-5xl)", margin: "0 auto", padding: "var(--spacing-8) var(--spacing-6)", width: "100%" }}>
        {children}
      </main>

      {/* Footer */}
      <footer className="acam-footer" style={{ marginTop: "auto" }}>
        <div className="acam-footer-content">
          <span style={{ fontSize: "var(--font-size-sm)", color: "var(--neutral-500)" }}>
            © 2026 ACAM. Todos os direitos reservados.
          </span>
        </div>
      </footer>
    </div>
  )
}
