import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const MAX_BYTES = 10 * 1024 * 1024 // 10MB

/**
 * POST /api/consultoria/upload-anexo
 *
 * FormData: { file }
 * Retorna: { url, nome }
 *
 * Salva o PDF no bucket 'documentos' em consultoria/{user_id}/{uuid}_{nome}.
 * URL é um signed URL de 30 dias (para o admin baixar na hora da reunião).
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ erro: "Arquivo ausente" }, { status: 400 })
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ erro: "Apenas PDF aceito" }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ erro: "Arquivo excede 10MB" }, { status: 400 })
  }

  const admin = createAdminClient()
  const buffer = Buffer.from(await file.arrayBuffer())
  const nomeSeguro = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const path = `consultoria/${user.id}/${crypto.randomUUID()}_${nomeSeguro}`

  const { error: erroUpload } = await admin.storage
    .from("documentos")
    .upload(path, buffer, {
      contentType: "application/pdf",
      upsert: false,
    })

  if (erroUpload) {
    console.error("[consultoria/upload-anexo] Erro upload:", erroUpload)
    return NextResponse.json({ erro: "Erro ao enviar arquivo" }, { status: 500 })
  }

  // Signed URL válida por 30 dias (suficiente para semana corrente + próxima + folga)
  const { data: signedData } = await admin.storage
    .from("documentos")
    .createSignedUrl(path, 60 * 60 * 24 * 30)

  return NextResponse.json({
    url: signedData?.signedUrl ?? null,
    nome: file.name,
    path,
  })
}
