import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { analisarADASNUC } from "@/lib/services/analise-snuc"

/**
 * POST /api/consultas/calc-snuc
 *
 * Análise geoespacial da ADA para auto-detecção de fatores SNUC.
 * Recebe arquivo KML/GeoJSON, retorna fatores detectados.
 *
 * Não debita créditos aqui — o débito acontece no client
 * quando o usuário clica "Calcular" (igual ao calculo-modalidade2).
 */
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const arquivo = formData.get("arquivo") as File | null

    if (!arquivo) {
      return NextResponse.json({ erro: "Arquivo não enviado" }, { status: 400 })
    }

    // Determinar formato
    const nome = arquivo.name.toLowerCase()
    let formato: "kml" | "geojson"
    if (nome.endsWith(".kml")) {
      formato = "kml"
    } else if (nome.endsWith(".geojson") || nome.endsWith(".json")) {
      formato = "geojson"
    } else {
      return NextResponse.json(
        { erro: "Formato não suportado. Envie arquivo .kml ou .geojson" },
        { status: 400 },
      )
    }

    // Ler conteúdo
    const conteudo = await arquivo.text()
    if (!conteudo || conteudo.length < 10) {
      return NextResponse.json({ erro: "Arquivo vazio ou inválido" }, { status: 400 })
    }

    // Analisar
    const resultado = await analisarADASNUC(conteudo, formato)

    if (!resultado.sucesso) {
      return NextResponse.json(
        { erro: resultado.erro || "Erro na análise geoespacial" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      sucesso: true,
      fatores: {
        fr3a: resultado.fr3a,
        fr3b: resultado.fr3b,
        fr4: resultado.fr4,
        fr5: resultado.fr5,
        areaPrioritaria: resultado.areaPrioritaria,
      },
      detalhes: {
        ucs: resultado.ucsDetectadas,
        ecossistemas: resultado.ecossistemasDetectados,
        cavidades: resultado.cavidadesDetectadas,
      },
      geometria: {
        areaHa: resultado.areaHa,
        bbox: resultado.bbox,
        centroide: resultado.centroide,
      },
    })
  } catch (error) {
    console.error("[calc-snuc] Erro:", (error as Error).message)
    return NextResponse.json(
      { erro: "Erro interno ao processar análise" },
      { status: 500 },
    )
  }
}
