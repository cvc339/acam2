import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Fallback caso o banco não tenha configuração (nunca deveria acontecer em produção)
const PACOTES_FALLBACK: Record<string, { nome: string; creditos: number; valor: number }> = {
  avulso: { nome: "Avulso", creditos: 1, valor: 12.00 },
  basico: { nome: "Básico", creditos: 10, valor: 100.00 },
  intermediario: { nome: "Intermediário", creditos: 25, valor: 225.00 },
  premium: { nome: "Premium", creditos: 50, valor: 400.00 },
}

/** Monta pacotes a partir da tabela configuracoes */
function montarPacotes(precos: { credito_avulso: number; pacotes: Array<{ nome: string; creditos: number; desconto: number }> }): Record<string, { nome: string; creditos: number; valor: number }> {
  const base = precos.credito_avulso
  const resultado: Record<string, { nome: string; creditos: number; valor: number }> = {
    avulso: { nome: "Avulso", creditos: 1, valor: base },
  }
  for (const p of precos.pacotes) {
    const id = p.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const valor = parseFloat((p.creditos * base * (1 - p.desconto)).toFixed(2))
    resultado[id] = { nome: p.nome, creditos: p.creditos, valor }
  }
  return resultado
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
    }

    const admin = createAdminClient()

    // Buscar preços do banco
    const { data: configPrecos } = await admin
      .from("configuracoes")
      .select("valor")
      .eq("chave", "precos")
      .single()

    const PACOTES = configPrecos?.valor
      ? montarPacotes(configPrecos.valor as { credito_avulso: number; pacotes: Array<{ nome: string; creditos: number; desconto: number }> })
      : PACOTES_FALLBACK

    const { pacote } = await request.json()

    if (!pacote || !PACOTES[pacote]) {
      return NextResponse.json({
        erro: "Pacote inválido",
        pacotes_disponiveis: Object.keys(PACOTES),
      }, { status: 400 })
    }

    const pacoteInfo = PACOTES[pacote]
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const mpToken = process.env.MP_ACCESS_TOKEN

    if (!mpToken) {
      return NextResponse.json({ erro: "Mercado Pago não configurado" }, { status: 500 })
    }

    // Buscar dados do usuario
    const { data: perfil } = await admin
      .from("perfis")
      .select("nome, email")
      .eq("id", user.id)
      .single()

    // Usar _ como delimitador (UUID contém hífens, - causaria parsing incorreto)
    const externalReference = `ACAM_${user.id}_${Date.now()}`

    // Montar preferencia para Mercado Pago
    const preference: Record<string, unknown> = {
      items: [
        {
          id: pacote,
          title: `ACAM - ${pacoteInfo.creditos} Créditos (${pacoteInfo.nome})`,
          description: `Pacote ${pacoteInfo.nome} - ${pacoteInfo.creditos} créditos para análises ambientais`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: pacoteInfo.valor,
        },
      ],
      payer: {
        name: perfil?.nome || "",
        email: perfil?.email || user.email || "",
      },
      external_reference: externalReference,
      statement_descriptor: "ACAM AMBIENTAL",
    }

    // back_urls apenas se não for localhost
    if (!appUrl.includes("localhost")) {
      preference.back_urls = {
        success: `${appUrl}/creditos?status=sucesso`,
        failure: `${appUrl}/creditos?status=erro`,
        pending: `${appUrl}/creditos?status=pendente`,
      }
      preference.auto_return = "approved"
      preference.notification_url = `${appUrl}/api/pagamento/webhook`
    }

    // Chamar API do Mercado Pago
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Erro Mercado Pago:", errorData)
      return NextResponse.json({
        erro: "Erro ao criar preferência de pagamento",
        detalhes: errorData.message,
      }, { status: 500 })
    }

    const mpResponse = await response.json()

    // Registrar pagamento pendente no banco (via service_role)
    const { error: dbError } = await admin.from("pagamentos").insert({
      usuario_id: user.id,
      preference_id: mpResponse.id,
      pacote,
      creditos: pacoteInfo.creditos,
      valor: pacoteInfo.valor,
      status: "pendente",
    })

    if (dbError) {
      console.error("Erro ao registrar pagamento:", dbError)
    }

    const isSandbox = mpToken.startsWith("TEST-")

    return NextResponse.json({
      sucesso: true,
      preference_id: mpResponse.id,
      init_point: isSandbox ? mpResponse.sandbox_init_point : mpResponse.init_point,
      external_reference: externalReference,
    })
  } catch (error) {
    console.error("Erro ao criar preferência:", error)
    return NextResponse.json({ erro: "Erro interno ao processar pagamento" }, { status: 500 })
  }
}
