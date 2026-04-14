import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { getResend, REMETENTE } from "@/lib/email/resend"
import { montarNewsletterHTML } from "@/lib/email/newsletter-template"

/**
 * POST /api/admin/newsletter/enviar
 *
 * Gera o HTML da newsletter com os itens selecionados e envia para todos os assinantes ativos.
 */
export async function POST() {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  const admin = createAdminClient()

  // 1. Buscar itens selecionados
  const { data: itens } = await admin
    .from("radar_itens")
    .select("*")
    .eq("incluir_email", true)
    .order("fonte")
    .order("relevancia", { ascending: false })

  if (!itens || itens.length === 0) {
    return NextResponse.json({ erro: "Nenhum item selecionado" }, { status: 400 })
  }

  // 2. Buscar destinatários de 3 fontes (sem duplicação por email)
  const emailsMap = new Map<string, string>() // email → nome

  // Fonte 1: radar_destinatarios (manuais)
  const { data: manuais } = await admin
    .from("radar_destinatarios")
    .select("email, nome")
    .eq("ativo", true)

  if (manuais) {
    for (const d of manuais) emailsMap.set(d.email.toLowerCase(), d.nome || "")
  }

  // Fonte 2: leads do ACAM (aceita_marketing)
  const { data: leads } = await admin
    .from("leads")
    .select("email, nome")
    .eq("aceita_marketing", true)

  if (leads) {
    for (const l of leads) {
      const email = l.email.toLowerCase()
      if (!emailsMap.has(email)) emailsMap.set(email, l.nome || "")
    }
  }

  // Fonte 3: perfis de usuários (que aceitaram comunicações)
  const { data: perfis } = await admin
    .from("perfis")
    .select("email")

  if (perfis) {
    for (const p of perfis) {
      const email = p.email.toLowerCase()
      if (!emailsMap.has(email)) emailsMap.set(email, "")
    }
  }

  const assinantes = Array.from(emailsMap.entries()).map(([email, nome]) => ({ email, nome }))

  if (assinantes.length === 0) {
    return NextResponse.json({ erro: "Nenhum destinatário encontrado" }, { status: 400 })
  }

  // 3. Gerar HTML com template profissional
  const { assunto, html } = montarNewsletterHTML(itens as Array<{
    id: number; titulo: string; resumo: string | null; url: string | null;
    fonte: string; fonte_nome: string | null; categoria: string | null; data_publicacao: string | null
  }>)

  // 4. Enviar via Resend
  const resend = getResend()
  if (!resend) {
    return NextResponse.json({ erro: "RESEND_API_KEY não configurada" }, { status: 500 })
  }

  let enviados = 0
  const erros: string[] = []

  // Enviar individualmente (Resend free tier não suporta batch)
  for (const assinante of assinantes) {
    try {
      const { error } = await resend.emails.send({
        from: REMETENTE,
        to: assinante.email,
        subject: assunto,
        html,
      })

      if (error) {
        erros.push(`${assinante.email}: ${error.message}`)
      } else {
        enviados++
      }
    } catch (err) {
      erros.push(`${assinante.email}: ${(err as Error).message}`)
    }
  }

  // 5. Registrar envio
  await admin.from("radar_envios").insert({
    assunto,
    conteudo_html: html,
    destinatarios_count: enviados,
    itens_count: itens.length,
  })

  // 6. Marcar itens como enviados (não deletar)
  const idsEnviados = itens.map((i) => i.id)
  await admin
    .from("radar_itens")
    .update({ incluir_email: false, enviado_em: new Date().toISOString() })
    .in("id", idsEnviados)

  if (erros.length > 0) {
    console.error("[newsletter] Erros de envio:", erros)
  }

  return NextResponse.json({
    sucesso: true,
    destinatarios: enviados,
    itens: itens.length,
    erros: erros.length,
  })
}
