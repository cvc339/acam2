import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  analisarCND,
} from "@/lib/services/analise-documental"
import { analisarMatriculaPipeline } from "@/lib/services/analise-matricula"
import { analisarImovelIDESisema, processarKML, processarGeoJSON } from "@/lib/services/analise-geoespacial"
// import { calcularMVAR } from "@/lib/services/mvar"  // Substituído pelo pipeline
// import { gerarParecerPDF } from "@/lib/services/parecer-pdf"  // TODO: adaptar ao pipeline

const CUSTO_CREDITOS = 5

/**
 * POST /api/consultas
 * Orquestração completa: upload → docs → geo → MVAR → PDF
 *
 * Body: FormData com campos:
 * - ferramenta_id: string (ex: "dest-uc-base")
 * - nome_imovel: string
 * - municipio: string
 * - matricula: File (PDF, obrigatório)
 * - kml: File (KML/GeoJSON, obrigatório)
 * - ccir: File (PDF, opcional)
 * - itr: File (PDF, opcional)
 * - cnd: File (PDF, opcional)
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  // 1. Autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
  }

  let consultaId: string | null = null

  try {
    const formData = await request.formData()

    const ferramentaId = formData.get("ferramenta_id") as string || "dest-uc-base"
    const nomeImovel = formData.get("nome_imovel") as string || ""
    const municipio = formData.get("municipio") as string || ""

    const matriculaFile = formData.get("matricula") as File | null
    const kmlFile = formData.get("kml") as File | null
    const ccirFile = formData.get("ccir") as File | null
    const itrFile = formData.get("itr") as File | null
    const cndFile = formData.get("cnd") as File | null

    // 2. Validação
    if (!matriculaFile) {
      return NextResponse.json({ erro: "Matrícula (PDF) é obrigatória." }, { status: 400 })
    }
    if (!kmlFile) {
      return NextResponse.json({ erro: "Arquivo geoespacial (KML/GeoJSON) é obrigatório." }, { status: 400 })
    }

    // 3. Verificar saldo
    const { data: saldo } = await admin
      .from("saldo_creditos")
      .select("saldo")
      .eq("usuario_id", user.id)
      .single()

    const saldoAtual = saldo?.saldo ?? 0
    if (saldoAtual < CUSTO_CREDITOS) {
      return NextResponse.json({
        erro: `Saldo insuficiente. Você tem ${saldoAtual} créditos, mas precisa de ${CUSTO_CREDITOS}.`,
        saldo: saldoAtual,
      }, { status: 400 })
    }

    // 4. Debitar créditos ANTES do processamento
    const { error: erroDebito } = await admin.from("transacoes_creditos").insert({
      usuario_id: user.id,
      tipo: "uso",
      quantidade: CUSTO_CREDITOS,
      descricao: `Análise ${ferramentaId} — ${nomeImovel || "Sem nome"}`,
    })

    if (erroDebito) {
      console.error("Erro ao debitar créditos:", erroDebito)
      return NextResponse.json({ erro: "Erro ao debitar créditos" }, { status: 500 })
    }

    // 5. Criar registro da consulta
    const { data: consulta, error: erroConsulta } = await admin.from("consultas").insert({
      usuario_id: user.id,
      ferramenta_id: ferramentaId,
      nome_imovel: nomeImovel,
      municipio,
      status: "processando",
      creditos_usados: CUSTO_CREDITOS,
    }).select("id").single()

    if (erroConsulta || !consulta) {
      // Reembolsar
      await admin.from("transacoes_creditos").insert({
        usuario_id: user.id, tipo: "reembolso", quantidade: CUSTO_CREDITOS,
        descricao: `Reembolso — erro ao criar consulta`,
      })
      return NextResponse.json({ erro: "Erro ao criar consulta" }, { status: 500 })
    }

    consultaId = consulta.id

    // 6. Upload dos arquivos para Supabase Storage
    const uploads: Record<string, string> = {}

    async function uploadFile(file: File, tipo: string): Promise<Buffer> {
      const buffer = Buffer.from(await file.arrayBuffer())
      const path = `${user!.id}/${consultaId}/${tipo}_${file.name}`

      await admin.storage.from("documentos").upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

      // Registrar documento
      await admin.from("documentos").insert({
        consulta_id: consultaId,
        usuario_id: user!.id,
        tipo,
        arquivo_nome: file.name,
        arquivo_path: path,
        arquivo_tamanho: buffer.length,
      })

      uploads[tipo] = path
      return buffer
    }

    const matriculaBuffer = await uploadFile(matriculaFile, "matricula")
    const kmlBuffer = await uploadFile(kmlFile, "kml")
    const ccirBuffer = ccirFile ? await uploadFile(ccirFile, "ccir") : null
    const itrBuffer = itrFile ? await uploadFile(itrFile, "itr") : null
    const cndBuffer = cndFile ? await uploadFile(cndFile, "cnd") : null

    // 7. Análise documental + geoespacial (em PARALELO para reduzir tempo)
    const kmlContent = kmlBuffer.toString("utf-8")
    const kmlNome = kmlFile.name.toLowerCase()

    // 7. Análise em PARALELO: Pipeline Matrícula + CND + KML + IDE-Sisema
    const [pipelineMatricula, resultadoCND, resultadoKML, resultadoGeo] = await Promise.all([
      analisarMatriculaPipeline(matriculaBuffer),
      cndBuffer ? analisarCND(cndBuffer) : Promise.resolve(null),
      kmlNome.endsWith(".geojson") || kmlNome.endsWith(".json")
        ? Promise.resolve(processarGeoJSON(kmlContent))
        : processarKML(kmlContent),
      analisarImovelIDESisema(kmlContent),
    ])

    const geojsonImovel = resultadoKML.sucesso ? resultadoKML.geojson : null

    // Salvar dados extraídos
    await admin.from("documentos")
      .update({ dados_extraidos: pipelineMatricula })
      .eq("consulta_id", consultaId)
      .eq("tipo", "matricula")

    // Área padronizada por consenso
    const areaKML = resultadoKML.sucesso && resultadoKML.areaHa != null ? parseFloat(resultadoKML.areaHa.toFixed(2)) : null
    const areaMatricula = pipelineMatricula.imovel.area_ha ?? null
    const areaCND = resultadoCND?.area_hectares ?? null

    function diverge(a: number, b: number): boolean {
      if (a === 0 || b === 0) return true
      return Math.abs((a - b) / Math.max(a, b)) > 0.10
    }

    let areaPadronizada: number
    let areaFonte: string
    const alertasArea: string[] = []

    if (areaMatricula != null && areaMatricula > 0) {
      const cndConcorda = areaCND != null && areaCND > 0 && !diverge(areaMatricula, areaCND)
      const kmlConcorda = areaKML != null && areaKML > 0 && !diverge(areaMatricula, areaKML)
      const cndEKmlConcordam = areaCND != null && areaKML != null && areaCND > 0 && areaKML > 0 && !diverge(areaCND, areaKML)

      if (cndConcorda || kmlConcorda || (areaCND == null && areaKML == null)) {
        areaPadronizada = areaMatricula
        areaFonte = "Matrícula"
      } else if (cndEKmlConcordam) {
        areaPadronizada = areaCND!
        areaFonte = "CND-ITR (matrícula com possível erro de leitura)"
        alertasArea.push(`Área da matrícula (${areaMatricula} ha) diverge da CND (${areaCND} ha) e KML (${areaKML} ha). Utilizando CND-ITR.`)
      } else if (areaCND != null && areaCND > 0) {
        areaPadronizada = areaCND
        areaFonte = "CND-ITR"
      } else {
        areaPadronizada = areaMatricula
        areaFonte = "Matrícula"
      }
    } else if (areaCND != null && areaCND > 0) {
      areaPadronizada = areaCND
      areaFonte = "CND-ITR"
    } else if (areaKML != null && areaKML > 0) {
      areaPadronizada = areaKML
      areaFonte = "KML (cálculo geométrico)"
    } else {
      areaPadronizada = 0
      areaFonte = "Não disponível"
    }
    console.log(`[AREA] Matrícula: ${areaMatricula}, CND: ${areaCND}, KML: ${areaKML} → Padronizada: ${areaPadronizada} (${areaFonte})`)

    // 9. Montar parecer JSON com dados do pipeline
    const pm = pipelineMatricula
    const parecer = {
      imovel: {
        nome: nomeImovel || pm.imovel.denominacao,
        municipio: municipio || pm.imovel.municipio,
        estado: "MG",
        area_hectares: areaPadronizada,
        area_fonte: areaFonte,
        area_fontes: { kml: areaKML, matricula: areaMatricula, cnd: areaCND },
        matricula: pm.imovel.matricula,
        cartorio: pm.imovel.cartorio,
        ccir: pm.imovel.ccir,
        nirf: pm.imovel.nirf,
        codigo_incra: pm.imovel.codigo_incra,
        car: pm.imovel.car,
        georreferenciamento: pm.imovel.georreferenciamento,
        data_emissao: null as string | null,
        dias_desde_emissao: null as number | null,
      },
      // Pipeline: proprietários com estrutura rica
      proprietarios: pm.proprietarios_atuais.map((p) => ({
        nome: p.nome,
        percentual: p.percentual || null,
        fracao: p.fracao || null,
        cpf_cnpj: p.cpf || null,
        estado_civil: p.estado_civil || null,
        conjuge: p.conjuge || null,
        regime_bens: p.regime_bens || null,
        ato_aquisitivo: p.ato_aquisitivo,
      })),
      // Pipeline: ônus ativos com classificação por nível
      onus_gravames: pm.onus_ativos.map((o) => ({
        tipo: o.tipo,
        nivel: o.nivel,
        nivel_descricao: o.nivel_descricao,
        numero_averbacao: o.ato,
        descricao: o.descricao,
        impacto_compra_venda: o.impacto_transmissao,
      })),
      // Pipeline: todos os atos para transparência
      atos_registrais: pm.atos,
      cancelamentos: pm.cancelamentos,
      // Semáforo do pipeline
      semaforo: pm.semaforo,
      semaforo_justificativa: pm.semaforo_justificativa,
      recomendacoes: pm.recomendacoes,
      documentos_faltantes: pm.documentos_faltantes,
      alertas_matricula: [...pm.alertas, ...alertasArea],
      // CND
      cnd: resultadoCND ? {
        tipo: resultadoCND.tipo,
        cib: resultadoCND.cib,
        data_emissao: resultadoCND.data_emissao,
        data_validade: resultadoCND.data_validade,
        area_hectares: resultadoCND.area_hectares,
        nome_contribuinte: resultadoCND.nome_contribuinte,
      } : null,
      // IDE-Sisema
      ide_sisema: {
        sucesso: resultadoGeo.sucesso,
        ucs: resultadoGeo.ucs_encontradas,
        bbox: resultadoGeo.bbox,
        centroide: resultadoGeo.centroide,
        geojson_imovel: geojsonImovel,
      },
      // Tokens consumidos
      tokens: pm.tokens_consumidos,
    }

    // 10. Gerar parecer PDF (por enquanto desabilitado — será adaptado ao pipeline)
    let parecerPdfPath: string | null = null
    // TODO: adaptar parecer-pdf.tsx para a nova estrutura do pipeline

    // 15. Atualizar consulta com resultado
    await admin.from("consultas").update({
      status: "concluida",
      parecer_json: parecer,
      parecer_pdf_path: parecerPdfPath,
      area_hectares: areaPadronizada,
      updated_at: new Date().toISOString(),
    }).eq("id", consultaId)

    return NextResponse.json({
      sucesso: true,
      consulta_id: consultaId,
      status: "concluida",
      parecer,
      creditos_restantes: saldoAtual - CUSTO_CREDITOS,
    })

  } catch (error) {
    console.error("Erro na consulta:", error)

    // Reembolsar créditos em caso de erro
    if (consultaId) {
      await admin.from("transacoes_creditos").insert({
        usuario_id: user.id, tipo: "reembolso", quantidade: CUSTO_CREDITOS,
        descricao: `Reembolso — erro no processamento da consulta ${consultaId}`,
      })
      await admin.from("consultas").update({
        status: "reembolsada",
        updated_at: new Date().toISOString(),
      }).eq("id", consultaId)
    }

    return NextResponse.json({
      erro: "Erro ao processar consulta. Créditos reembolsados.",
      detalhes: (error as Error).message,
    }, { status: 500 })
  }
}

/**
 * GET /api/consultas
 * Lista consultas do usuário autenticado
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
  }

  const { data: consultas, error } = await supabase
    .from("consultas")
    .select("id, ferramenta_id, nome_imovel, municipio, status, creditos_usados, created_at")
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ erro: "Erro ao buscar consultas" }, { status: 500 })
  }

  return NextResponse.json({ consultas })
}
