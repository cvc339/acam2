import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { HeaderLogo } from "@/components/acam"
import { LogoutButton } from "@/components/layout/logout-button"

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let nome = ""
  let creditosDisponiveis = 0

  if (user) {
    const { data: perfil } = await supabase
      .from("perfis")
      .select("nome")
      .eq("id", user.id)
      .single()

    const { data: saldo } = await supabase
      .from("saldo_creditos")
      .select("saldo")
      .eq("usuario_id", user.id)
      .single()

    nome = perfil?.nome || user.email?.split("@")[0] || "Usuário"
    creditosDisponiveis = saldo?.saldo ?? 0
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="acam-header">
        <div className="acam-header-content">
          <HeaderLogo
            subtitle={user ? `Olá, ${nome}` : undefined}
            href={user ? "/dashboard" : "/"}
          />
          <nav className="acam-header-nav">
            {user ? (
              <>
                <div className="acam-header-credits">
                  <span className="acam-header-credits-label">Créditos:</span>
                  <span className="acam-header-credits-value">{creditosDisponiveis}</span>
                </div>
                <Link href="/creditos" className="acam-btn acam-btn-primary acam-btn-sm">Comprar</Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="acam-btn acam-btn-ghost acam-btn-sm">Entrar</Link>
                <Link href="/registro" className="acam-btn acam-btn-primary acam-btn-sm">Criar conta</Link>
              </>
            )}
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
