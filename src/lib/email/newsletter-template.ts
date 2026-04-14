/**
 * Template HTML da Newsletter — Radar Ambiental
 * Portado do radar-ambiental original com identidade Vieira Castro
 */

interface RadarItem {
  id: number
  titulo: string
  resumo: string | null
  url: string | null
  fonte: string
  fonte_nome: string | null
  categoria: string | null
  data_publicacao: string | null
}

// Cores da paleta
const VERDE = "#1a3a2a"
const CREME = "#f5f0e8"
const COBRE = "#c17f59"
const VERDE_MEDIO = "#2d5a3f"

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]

function calcularEdicao(): number {
  const agora = new Date()
  const inicio = new Date(agora.getFullYear(), 0, 1)
  return Math.ceil((agora.getTime() - inicio.getTime()) / (7 * 24 * 60 * 60 * 1000))
}

function limpar(texto: string): string {
  return texto
    .replace(/<[^>]*>/g, " ")
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/<[^>]*>/g, " ")
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&[a-z]+;/gi, " ")
    .replace(/\bhttps?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim()
}

function esc(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function fmtData(d: string | null): string {
  if (!d) return ""
  const [ano, mes, dia] = d.split("-")
  return `${dia}/${mes}/${ano}`
}

function normalizarFonte(fonteNome: string | null): string {
  if (!fonteNome) return "DOU"
  return fonteNome.replace(/^DOU\s+DO\d+$/i, "DOU")
}

function extrairTituloNorma(tituloCompleto: string): { titulo: string; ementa: string } {
  const limpo = limpar(tituloCompleto)
  const matchDOU = limpo.match(/^\[DOU\]\s*(.+?):\s*(.+)$/i)
  if (matchDOU) return { titulo: matchDOU[1].trim(), ementa: matchDOU[2].trim() }
  const matchMG = limpo.match(/^(.+?)\s*[\u2014\u2013\-]+\s*(.+)$/)
  if (matchMG) return { titulo: matchMG[1].trim(), ementa: matchMG[2].trim() }
  return { titulo: limpo, ementa: "" }
}

function resumoDistinto(titulo: string, resumo: string | null): string {
  if (!resumo) return ""
  const r = limpar(resumo), t = limpar(titulo)
  if (t.toLowerCase().includes(r.toLowerCase().slice(0, 60))) return ""
  if (r.toLowerCase().includes(t.toLowerCase().slice(0, 60))) return ""
  return r
}

// Card de norma federal
function renderItemFederal(item: RadarItem, idx: number): string {
  const escuro = idx === 0
  const bg = escuro ? VERDE : "#ffffff"
  const corTexto = escuro ? CREME : VERDE
  const corEmenta = escuro ? "rgba(245,240,232,0.6)" : "#666666"
  const corData = escuro ? "rgba(245,240,232,0.5)" : "#888888"
  const borda = escuro ? "" : `border:1px solid rgba(26,58,42,0.1);`
  const badgeBg = escuro ? COBRE : VERDE_MEDIO
  const badgeCor = escuro ? "#ffffff" : CREME
  const corLink = escuro ? COBRE : VERDE

  const badge = normalizarFonte(item.fonte_nome)
  const { titulo: tituloNorma, ementa } = extrairTituloNorma(item.titulo)
  const ementaFinal = ementa || resumoDistinto(item.titulo, item.resumo)

  const tituloHTML = item.url
    ? `<a href="${esc(item.url)}" style="color:${corLink};text-decoration:none;" target="_blank">${esc(tituloNorma)}</a>`
    : `<span style="color:${corTexto};">${esc(tituloNorma)}</span>`

  return `
    <tr><td style="padding:0 0 12px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${bg};border-radius:12px;${borda}">
        <tr><td style="padding:20px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="background-color:${badgeBg};color:${badgeCor};font-size:9px;padding:3px 8px;border-radius:4px;font-family:Arial,sans-serif;letter-spacing:1px;">${esc(badge)}</td>
            <td style="padding-left:8px;font-size:11px;color:${corData};font-family:Arial,sans-serif;">${fmtData(item.data_publicacao)}</td>
          </tr></table>
          <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${corTexto};margin:12px 0 8px;line-height:1.4;">${tituloHTML}</p>
          ${ementaFinal ? `<p style="font-family:Arial,sans-serif;font-size:12px;color:${corEmenta};margin:0;line-height:1.5;">${esc(ementaFinal.slice(0, 250))}</p>` : ""}
        </td></tr>
      </table>
    </td></tr>`
}

// Card de norma estadual
function renderItemEstadual(item: RadarItem): string {
  const sigla = (item.fonte_nome || "MG").slice(0, 2).toUpperCase()
  const { titulo: tituloNorma, ementa } = extrairTituloNorma(item.titulo)

  const tituloHTML = item.url
    ? `<a href="${esc(item.url)}" style="color:${VERDE};text-decoration:none;" target="_blank">${esc(tituloNorma)}</a>`
    : esc(tituloNorma)

  return `
    <tr><td style="padding:0 0 12px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid rgba(26,58,42,0.1);">
        <tr><td style="padding:16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td style="width:32px;height:32px;border-radius:50%;background-color:#e8f0e4;text-align:center;vertical-align:middle;font-size:11px;font-weight:bold;color:${VERDE_MEDIO};font-family:Arial,sans-serif;" width="32">${sigla}</td>
            <td style="padding-left:12px;vertical-align:top;">
              <p style="font-family:Arial,sans-serif;font-size:10px;color:${COBRE};margin:0 0 4px;letter-spacing:1px;text-transform:uppercase;">${esc(item.fonte_nome || "MG")}${item.data_publicacao ? ` <span style="color:#888888;letter-spacing:0;text-transform:none;">&middot; ${fmtData(item.data_publicacao)}</span>` : ""}</p>
              <p style="font-family:Georgia,'Times New Roman',serif;font-size:13px;color:${VERDE};margin:0;line-height:1.3;">${tituloHTML}</p>
              ${ementa ? `<p style="font-family:Arial,sans-serif;font-size:11px;color:#666666;margin:6px 0 0;line-height:1.4;">${esc(ementa.slice(0, 200))}</p>` : ""}
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>`
}

// Item de notícia
const CORES_BORDA = [COBRE, VERDE_MEDIO, "#8a7a5a"]
function renderItemNoticia(item: RadarItem, idx: number): string {
  const corBorda = CORES_BORDA[idx % CORES_BORDA.length]
  const tituloLimpo = limpar(item.titulo)
  const resumo = resumoDistinto(item.titulo, item.resumo)

  const tituloHTML = item.url
    ? `<a href="${esc(item.url)}" style="color:${VERDE};text-decoration:none;" target="_blank">${esc(tituloLimpo)}</a>`
    : esc(tituloLimpo)

  const metaPartes: string[] = []
  if (item.fonte_nome) metaPartes.push(esc(item.fonte_nome))
  if (item.data_publicacao) metaPartes.push(fmtData(item.data_publicacao))

  return `
    <tr><td style="padding:0 0 16px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="4" style="background-color:${corBorda};border-radius:2px;" valign="top">&nbsp;</td>
        <td style="padding-left:14px;">
          <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${VERDE};margin:0 0 4px;line-height:1.4;">${tituloHTML}</p>
          ${resumo ? `<p style="font-family:Arial,sans-serif;font-size:11px;color:#888888;margin:0;line-height:1.5;">${esc(resumo.slice(0, 150))}</p>` : ""}
          ${metaPartes.length > 0 ? `<p style="font-family:Arial,sans-serif;font-size:10px;color:#999999;margin:4px 0 0;font-style:italic;">${metaPartes.join(" &middot; ")}</p>` : ""}
        </td>
      </tr></table>
    </td></tr>`
}

function renderTituloSecao(titulo: string): string {
  return `
    <tr><td style="padding:28px 0 16px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="width:28px;height:3px;background-color:${COBRE};border-radius:2px;" width="28">&nbsp;</td>
        <td style="padding-left:8px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;color:${VERDE};text-transform:uppercase;">${titulo}</td>
      </tr></table>
    </td></tr>`
}

export function montarNewsletterHTML(itens: RadarItem[]): { assunto: string; html: string } {
  const dou = itens.filter((i) => i.fonte === "DOU")
  const mg = itens.filter((i) => i.fonte === "MG")
  const rss = itens.filter((i) => i.fonte === "RSS")

  const edicao = calcularEdicao()
  const agora = new Date()
  const mesAno = `${MESES[agora.getMonth()]} de ${agora.getFullYear()}`
  const dataEnvio = agora.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  const assunto = `Radar Ambiental — ${dataEnvio}`

  const partes: string[] = []
  if (dou.length > 0) partes.push(`${dou.length} norma${dou.length > 1 ? "s" : ""} federa${dou.length > 1 ? "is" : "l"}`)
  if (mg.length > 0) partes.push(`${mg.length} norma${mg.length > 1 ? "s" : ""} estadua${mg.length > 1 ? "is" : "l"}`)
  if (rss.length > 0) partes.push(`${rss.length} notícia${rss.length > 1 ? "s" : ""}`)
  const resumoAbertura = `Nesta edição: ${partes.join(", ")}.`

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#e8e4dc;font-family:Arial,'Helvetica Neue',sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e8e4dc;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">

        <!-- HEADER -->
        <tr><td style="background-color:${VERDE};padding:32px 24px 28px;border-radius:12px 12px 0 0;">
          <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;color:${COBRE};margin:0 0 16px;text-transform:uppercase;">Vieira Castro Advogados</p>
          <p style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;color:${CREME};margin:0 0 8px;line-height:1.2;">Radar Ambiental</p>
          <p style="font-family:Arial,sans-serif;font-size:12px;color:rgba(245,240,232,0.6);margin:0;">Edição ${edicao} &middot; ${mesAno}</p>
        </td></tr>

        <!-- INTRO -->
        <tr><td style="background-color:${CREME};padding:24px;">
          <p style="font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#3a3a2e;line-height:1.7;margin:0;">${resumoAbertura}</p>
        </td></tr>

        ${dou.length > 0 ? `<!-- NORMAS FEDERAIS -->
        <tr><td style="background-color:${CREME};padding:0 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${renderTituloSecao("Normas federais")}
            ${dou.map((item, i) => renderItemFederal(item, i)).join("")}
          </table>
        </td></tr>` : ""}

        ${mg.length > 0 ? `<!-- NORMAS ESTADUAIS -->
        <tr><td style="background-color:${CREME};padding:0 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${renderTituloSecao("Normas estaduais &middot; MG")}
            ${mg.map((item) => renderItemEstadual(item)).join("")}
          </table>
        </td></tr>` : ""}

        ${rss.length > 0 ? `<!-- NOTÍCIAS -->
        <tr><td style="background-color:${CREME};padding:0 24px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${renderTituloSecao("Notícias")}
            ${rss.map((item, i) => renderItemNoticia(item, i)).join("")}
          </table>
        </td></tr>` : ""}

        <!-- FOOTER -->
        <tr><td style="background-color:${VERDE};padding:24px;text-align:center;border-radius:0 0 12px 12px;">
          <p style="font-family:Arial,sans-serif;font-size:10px;color:rgba(245,240,232,0.4);margin:0;line-height:1.6;">
            Vieira Castro Advogados<br>
            Monitoramento de normas e notícias ambientais
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { assunto, html }
}
