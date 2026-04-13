import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { HeaderLogo } from "@/components/acam"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Camada 2: verificação server-side
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const admin = createAdminClient()
  const { data: perfil } = await admin
    .from("perfis")
    .select("nome, email, is_admin")
    .eq("id", user.id)
    .single()

  if (!perfil?.is_admin) redirect("/dashboard")

  const nome = perfil.nome || user.email?.split("@")[0] || "Admin"

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="acam-header">
        <div className="acam-header-content">
          <HeaderLogo subtitle="Painel Administrativo" href="/admin" />
          <nav className="acam-header-nav">
            <span className="text-sm text-muted-foreground">{nome}</span>
            <Link href="/dashboard" className="acam-btn acam-btn-ghost acam-btn-sm">
              Voltar ao Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <div className="acam-admin-container">
        <aside className="acam-admin-aside">
          <AdminSidebar />
        </aside>
        <main className="acam-admin-main">
          {children}
        </main>
      </div>
    </div>
  )
}
