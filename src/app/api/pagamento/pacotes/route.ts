import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/pagamento/pacotes
 *
 * Retorna pacotes de créditos com preços do banco.
 * Público (usado na landing e na página de compra).
 */
export async function GET() {
  const admin = createAdminClient()

  const { data: config } = await admin
    .from("configuracoes")
    .select("valor")
    .eq("chave", "precos")
    .single()

  if (!config?.valor) {
    // Fallback hardcoded (nunca deveria acontecer em produção)
    return NextResponse.json({
      sucesso: true,
      credito_avulso: 12,
      pacotes: [
        { id: "avulso", nome: "Avulso", creditos: 1, valor: 12, per: "R$ 12/un" },
        { id: "basico", nome: "Básico", creditos: 10, valor: 100, per: "R$ 10/un" },
        { id: "intermediario", nome: "Intermediário", creditos: 25, valor: 225, per: "R$ 9/un" },
        { id: "premium", nome: "Premium", creditos: 50, valor: 400, per: "R$ 8/un" },
      ],
    })
  }

  const precos = config.valor as {
    credito_avulso: number
    pacotes: Array<{ nome: string; creditos: number; desconto: number }>
  }

  const base = precos.credito_avulso
  const pacotes = [
    { id: "avulso", nome: "Avulso", creditos: 1, valor: base, per: `R$ ${base}/un` },
    ...precos.pacotes.map((p) => {
      const valor = parseFloat((p.creditos * base * (1 - p.desconto)).toFixed(2))
      const perUn = parseFloat((valor / p.creditos).toFixed(0))
      const id = p.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      return { id, nome: p.nome, creditos: p.creditos, valor, per: `R$ ${perUn}/un` }
    }),
  ]

  return NextResponse.json({ sucesso: true, credito_avulso: base, pacotes })
}
