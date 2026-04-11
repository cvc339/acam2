import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { creditos } from "@/lib/creditos"
import { createHmac } from "crypto"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Valida a assinatura do webhook do Mercado Pago.
 *
 * O MP envia o header x-signature no formato:
 *   ts=<timestamp>,v1=<hmac_hash>
 *
 * O HMAC é calculado sobre o template:
 *   id:<data.id>;request-id:<x-request-id>;ts:<timestamp>;
 *
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
function validarAssinatura(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  webhookSecret: string
): boolean {
  if (!xSignature || !xRequestId) return false

  // Extrair ts e v1 do header
  const parts: Record<string, string> = {}
  for (const part of xSignature.split(",")) {
    const [key, ...rest] = part.split("=")
    parts[key.trim()] = rest.join("=").trim()
  }

  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false

  // Montar template conforme documentação do MP
  const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  // Calcular HMAC-SHA256
  const hmac = createHmac("sha256", webhookSecret)
  hmac.update(template)
  const hash = hmac.digest("hex")

  return hash === v1
}

export async function POST(request: Request) {
  try {
    // Ler body como texto para possível validação, depois parsear
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)
    const { type, data } = body

    // Mercado Pago envia diferentes tipos de notificação
    if (type !== "payment" || !data?.id) {
      return NextResponse.json({ received: true })
    }

    const paymentId = data.id
    const mpToken = process.env.MP_ACCESS_TOKEN
    const webhookSecret = process.env.MP_WEBHOOK_SECRET

    if (!mpToken) {
      return NextResponse.json({ received: true })
    }

    // ── FIX 1: Validar assinatura do Mercado Pago ──
    if (webhookSecret) {
      const xSignature = request.headers.get("x-signature")
      const xRequestId = request.headers.get("x-request-id")

      if (!validarAssinatura(xSignature, xRequestId, String(paymentId), webhookSecret)) {
        console.error("[webhook] Assinatura inválida:", { xSignature, xRequestId, paymentId })
        return NextResponse.json({ received: true })
      }
    } else {
      // Em desenvolvimento (sem secret configurado), logar aviso
      console.warn("[webhook] MP_WEBHOOK_SECRET não configurado — assinatura não validada")
    }

    // Buscar detalhes do pagamento no Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    })

    if (!response.ok) {
      console.error("[webhook] Erro ao buscar pagamento:", response.status)
      return NextResponse.json({ received: true })
    }

    const payment = await response.json()
    const externalReference = payment.external_reference
    const status = payment.status // approved, pending, rejected

    if (!externalReference) {
      return NextResponse.json({ received: true })
    }

    // Extrair usuario_id do external_reference (formato: ACAM_{userId}_{timestamp})
    const parts = externalReference.split("_")
    const usuarioId = parts[1]

    // ── FIX 2: Validar formato UUID ──
    if (!usuarioId || !UUID_REGEX.test(usuarioId)) {
      console.error("[webhook] UUID inválido no external_reference:", externalReference)
      return NextResponse.json({ received: true })
    }

    const admin = createAdminClient()

    // ── FIX 3: Idempotência — verificar se este payment_id já foi processado ──
    const { data: jaProcessado } = await admin
      .from("pagamentos")
      .select("id, status")
      .eq("payment_id", String(paymentId))
      .limit(1)
      .maybeSingle()

    if (jaProcessado) {
      // Já processamos este pagamento — ignorar reenvio
      return NextResponse.json({ received: true })
    }

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
      console.error("[webhook] Pagamento pendente não encontrado para usuário:", usuarioId)
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

    // Atualizar status do pagamento (grava payment_id para idempotência)
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
      const resultado = await creditos.creditar(usuarioId, pagamento.creditos, {
        valor_pago: pagamento.valor,
        pagamento_id: pagamento.id,
        descricao: `Compra via Mercado Pago - Pacote ${pagamento.pacote}`,
      })

      if (!resultado.sucesso) {
        console.error("[webhook] Erro ao creditar:", resultado.erro)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[webhook] Erro:", error)
    // Sempre retornar 200 para evitar reenvios do MP
    return NextResponse.json({ received: true })
  }
}
