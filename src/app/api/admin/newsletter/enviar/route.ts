import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { getResend, REMETENTE } from "@/lib/email/resend"

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

  // 2. Buscar assinantes ativos
  const { data: assinantes } = await admin
    .from("radar_destinatarios")
    .select("email, nome")
    .eq("ativo", true)

  if (!assinantes || assinantes.length === 0) {
    return NextResponse.json({ erro: "Nenhum assinante ativo" }, { status: 400 })
  }

  // 3. Gerar HTML
  const dataHoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  const assunto = `Radar Ambiental — ${dataHoje}`

  const itensDOU = itens.filter((i) => i.fonte === "DOU")
  const itensMG = itens.filter((i) => i.fonte === "MG")
  const itensRSS = itens.filter((i) => i.fonte === "RSS")

  function renderItens(lista: NonNullable<typeof itens>, cor: string): string {
    return lista.map((item, i) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #eee;background:${i % 2 === 0 ? "#fff" : "#fafafa"};">
          <div style="font-size:14px;font-weight:600;color:#1a3a2a;margin-bottom:4px;">
            ${item.url ? `<a href="${item.url}" style="color:${cor};text-decoration:none;">${item.titulo}</a>` : item.titulo}
          </div>
          ${item.resumo ? `<div style="font-size:12px;color:#666;line-height:1.5;">${item.resumo.slice(0, 200)}${item.resumo.length > 200 ? "..." : ""}</div>` : ""}
          <div style="font-size:11px;color:#999;margin-top:4px;">
            ${item.fonte_nome || item.fonte}${item.tipo ? ` · ${item.tipo} ${item.numero || ""}` : ""}${item.data_publicacao ? ` · ${new Date(item.data_publicacao).toLocaleDateString("pt-BR")}` : ""}
          </div>
        </td>
      </tr>
    `).join("")
  }

  function renderSecao(titulo: string, lista: NonNullable<typeof itens>, cor: string): string {
    if (!lista || lista.length === 0) return ""
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="background:${cor};padding:10px 16px;border-radius:6px 6px 0 0;">
            <span style="color:white;font-weight:700;font-size:13px;letter-spacing:0.5px;">${titulo}</span>
            <span style="color:rgba(255,255,255,0.7);font-size:11px;margin-left:8px;">${lista.length} ${lista.length === 1 ? "item" : "itens"}</span>
          </td>
        </tr>
        ${renderItens(lista, cor)}
      </table>
    `
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <tr>
      <td style="background:#1a3a2a;padding:24px 32px;text-align:center;">
        <div style="color:white;font-size:22px;font-weight:700;letter-spacing:3px;">RADAR AMBIENTAL</div>
        <div style="color:#c17f59;font-size:11px;margin-top:4px;">Vieira Castro Advogados</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 24px 8px;">
        <div style="font-size:13px;color:#666;margin-bottom:16px;">${dataHoje}</div>
        ${renderSecao("NORMAS FEDERAIS", itensDOU, "#2563eb")}
        ${renderSecao("NORMAS ESTADUAIS — MG", itensMG, "#1a3a2a")}
        ${renderSecao("NOTÍCIAS AMBIENTAIS", itensRSS, "#c17f59")}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px 24px;text-align:center;border-top:1px solid #eee;">
        <div style="font-size:11px;color:#999;line-height:1.6;">
          Radar Ambiental — Vieira Castro Advogados<br>
          <a href="https://www.acam.com.br" style="color:#1a3a2a;">acam.com.br</a><br>
          Este é um boletim informativo. Não constitui orientação jurídica.
        </div>
      </td>
    </tr>
  </table>
</div>
</body>
</html>`

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

  // 6. Desmarcar itens (não deletar — soft reset)
  await admin
    .from("radar_itens")
    .update({ incluir_email: false })
    .eq("incluir_email", true)

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
