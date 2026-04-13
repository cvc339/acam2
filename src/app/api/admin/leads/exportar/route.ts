import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/admin/leads/exportar
 *
 * Exporta todos os leads como CSV.
 */
export async function GET() {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  try {
    const admin = createAdminClient()

    const { data: leads } = await admin
      .from("leads")
      .select("email, nome, telefone, empresa, aceita_marketing, origem, created_at")
      .order("created_at", { ascending: false })

    if (!leads || leads.length === 0) {
      return new NextResponse("email,nome,telefone,empresa,marketing,origem,data\n", {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=leads.csv",
        },
      })
    }

    const header = "email,nome,telefone,empresa,marketing,origem,data"
    const rows = leads.map((l) => {
      const campos = [
        l.email,
        l.nome || "",
        l.telefone || "",
        l.empresa || "",
        l.aceita_marketing ? "Sim" : "Não",
        l.origem || "",
        new Date(l.created_at).toLocaleDateString("pt-BR"),
      ]
      return campos.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
    })

    const csv = [header, ...rows].join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ACAM-Leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error("[admin/leads/exportar] Erro:", (error as Error).message)
    return NextResponse.json({ erro: "Erro ao exportar leads" }, { status: 500 })
  }
}
