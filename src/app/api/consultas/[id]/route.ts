import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/consultas/[id]
 * Retorna dados completos de uma consulta + link para download do PDF
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
  }

  const { data: consulta, error } = await supabase
    .from("consultas")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !consulta) {
    return NextResponse.json({ erro: "Consulta não encontrada" }, { status: 404 })
  }

  // Buscar documentos
  const { data: documentos } = await supabase
    .from("documentos")
    .select("id, tipo, arquivo_nome, arquivo_tamanho, created_at")
    .eq("consulta_id", id)

  // Gerar URL de download do PDF (se existir)
  let pdfUrl: string | null = null
  if (consulta.parecer_pdf_path) {
    const admin = createAdminClient()
    const { data: urlData } = await admin.storage
      .from("documentos")
      .createSignedUrl(consulta.parecer_pdf_path, 3600) // 1h

    pdfUrl = urlData?.signedUrl || null
  }

  return NextResponse.json({
    consulta: {
      ...consulta,
      pdf_url: pdfUrl,
    },
    documentos: documentos || [],
  })
}
