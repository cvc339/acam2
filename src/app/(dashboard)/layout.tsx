import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { HeaderLogo } from "@/components/acam"
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
      <header className="acam-header">
        <div className="acam-header-content">
          <HeaderLogo subtitle={`Olá, ${nome}`} href="/dashboard" />
          <nav className="acam-header-nav">
            <div className="acam-header-credits">
              <span className="acam-header-credits-label">Créditos:</span>
              <span className="acam-header-credits-value">{creditosDisponiveis}</span>
            </div>
            <Link href="/creditos" className="acam-btn acam-btn-primary acam-btn-sm">Comprar</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: "var(--max-width-5xl)", margin: "0 auto", padding: "var(--spacing-8) var(--spacing-6)", width: "100%" }}>
        {children}
      </main>

      <footer className="acam-footer" style={{ marginTop: "auto" }}>
        <div className="acam-footer-content">
          <span className="acam-footer-text">© 2026 ACAM. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  )
}
