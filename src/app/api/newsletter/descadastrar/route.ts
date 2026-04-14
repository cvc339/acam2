import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/newsletter/descadastrar?email=xxx
 * Exibe formulário de confirmação de descadastro.
 *
 * POST /api/newsletter/descadastrar
 * Body: { email: "xxx" }
 * Desativa o recebimento da newsletter.
 *
 * Portado de: radar-ambiental/supabase/functions/radar-descadastrar/index.ts
 * Rota pública — não requer autenticação.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email") || ""

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cancelar inscrição — Radar Ambiental</title>
<style>
  body { font-family: Arial, sans-serif; background: #f5f0e8; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
  .card { background: #fff; border-radius: 12px; padding: 2rem; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  h2 { color: #1a3a2a; margin: 0 0 0.5rem; }
  p { color: #666; font-size: 14px; }
  input[type=email] { width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; box-sizing: border-box; margin: 0.5rem 0; }
  button { background: #c17f59; color: #fff; border: none; padding: 0.5rem 1.5rem; border-radius: 6px; font-size: 14px; cursor: pointer; margin-top: 0.5rem; }
  button:hover { background: #a96b47; }
  .success { color: #2d5a3f; }
  .error { color: #c44; }
</style>
</head>
<body>
  <div class="card">
    <h2>Cancelar inscrição</h2>
    <p>Radar Ambiental — Vieira Castro Advogados</p>
    <form method="POST" action="/api/newsletter/descadastrar">
      <input type="email" name="email" value="${email.replace(/"/g, "&quot;")}" placeholder="Seu e-mail" required />
      <br/>
      <button type="submit">Confirmar cancelamento</button>
    </form>
  </div>
</body>
</html>`

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

export async function POST(request: Request) {
  let email = ""

  // Aceitar tanto form-data quanto JSON
  const contentType = request.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const body = await request.json()
    email = body.email || ""
  } else {
    const formData = await request.formData()
    email = (formData.get("email") as string) || ""
  }

  email = email.trim().toLowerCase()

  if (!email || !email.includes("@")) {
    return htmlResponse("E-mail inválido.", false)
  }

  const admin = createAdminClient()
  let encontrado = false

  // 1. Desativar em radar_destinatarios
  const { data: d1 } = await admin
    .from("radar_destinatarios")
    .update({ ativo: false })
    .ilike("email", email)
    .select("id")
  if (d1 && d1.length > 0) encontrado = true

  // 2. Desativar em leads (aceita_marketing = false)
  const { data: d2 } = await admin
    .from("leads")
    .update({ aceita_marketing: false })
    .ilike("email", email)
    .select("id")
  if (d2 && d2.length > 0) encontrado = true

  // 3. Marcar opt-out em perfis (aceita_newsletter = false)
  const { data: d3 } = await admin
    .from("perfis")
    .update({ aceita_newsletter: false })
    .ilike("email", email)
    .select("id")
  if (d3 && d3.length > 0) encontrado = true

  if (encontrado) {
    return htmlResponse("Inscrição cancelada com sucesso. Você não receberá mais o Radar Ambiental.", true)
  } else {
    return htmlResponse("E-mail não encontrado na lista de assinantes.", false)
  }
}

function htmlResponse(mensagem: string, sucesso: boolean) {
  const classe = sucesso ? "success" : "error"
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Radar Ambiental</title>
<style>
  body { font-family: Arial, sans-serif; background: #f5f0e8; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
  .card { background: #fff; border-radius: 12px; padding: 2rem; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  h2 { color: #1a3a2a; margin: 0 0 0.5rem; }
  .success { color: #2d5a3f; }
  .error { color: #c44; }
</style>
</head>
<body>
  <div class="card">
    <h2>Radar Ambiental</h2>
    <p class="${classe}">${mensagem}</p>
  </div>
</body>
</html>`

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
