import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, data } = body

    // Mercado Pago envia diferentes tipos de notificacao
    if (type !== "payment" || !data?.id) {
      return NextResponse.json({ received: true })
    }

    const paymentId = data.id
    const mpToken = process.env.MP_ACCESS_TOKEN

    if (!mpToken) {
      return NextResponse.json({ received: true })
    }

    // Buscar detalhes do pagamento no Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    })

    if (!response.ok) {
      console.error("Erro ao buscar pagamento:", response.status)
      return NextResponse.json({ received: true })
    }

    const payment = await response.json()
    const externalReference = payment.external_reference
    const status = payment.status // approved, pending, rejected

    if (!externalReference) {
      return NextResponse.json({ received: true })
    }

    // Extrair usuario_id do external_reference (formato: ACAM_{userId}_{timestamp})
    // UUID contém hifens, então usamos _ como delimitador
    const parts = externalReference.split("_")
    const usuarioId = parts[1]

    if (!usuarioId) {
      console.error("Não foi possível extrair usuario_id de:", externalReference)
      return NextResponse.json({ received: true })
    }

    const admin = createAdminClient()

    // Buscar pagamento pendente no banco
    const { data: pagamento } = await admin
      .from("pagamentos")
      .select("*")
      .eq("usuario_id", usuarioId)
      .eq("status", "pendente")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!pagamento) {
      console.error("Pagamento não encontrado no banco")
      return NextResponse.json({ received: true })
    }

    // Mapear status do MP para status ACAM
    const statusMap: Record<string, string> = {
      approved: "aprovado",
      pending: "pendente",
      rejected: "rejeitado",
      cancelled: "cancelado",
      in_process: "pendente",
    }

    // Atualizar status do pagamento
    await admin
      .from("pagamentos")
      .update({
        payment_id: String(paymentId),
        status: statusMap[status] || "pendente",
        metodo_pagamento: payment.payment_method_id,
        dados_pagamento: {
          status_detail: payment.status_detail,
          transaction_amount: payment.transaction_amount,
          date_approved: payment.date_approved,
        },
      })
      .eq("id", pagamento.id)

    // Se aprovado, adicionar creditos
    if (status === "approved") {
      // Registrar transacao de credito (atomico)
      const { error: transacaoError } = await admin
        .from("transacoes_creditos")
        .insert({
          usuario_id: usuarioId,
          tipo: "compra",
          quantidade: pagamento.creditos,
          valor_pago: pagamento.valor,
          descricao: `Compra via Mercado Pago - Pacote ${pagamento.pacote}`,
          pagamento_id: pagamento.id,
        })

      if (transacaoError) {
        console.error("Erro ao registrar transação:", transacaoError)
      } else {
        console.log(`${pagamento.creditos} créditos adicionados ao usuário ${usuarioId}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Erro no webhook:", error)
    // Sempre retornar 200 para evitar reenvios do MP
    return NextResponse.json({ received: true })
  }
}
