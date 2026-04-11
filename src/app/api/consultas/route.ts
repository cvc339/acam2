import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { creditos } from "@/lib/creditos"
import {
  analisarCND,
} from "@/lib/services/analise-documental"
import { analisarMatriculaPipeline } from "@/lib/services/analise-matricula"
import { analisarImovelIDESisema, processarKML, processarGeoJSON, consultarBaciaHidrografica } from "@/lib/services/analise-geoespacial"
import { consultarVTN } from "@/lib/services/mvar"

const CUSTO_POR_FERRAMENTA: Record<string, number> = {
  "dest-uc-base": 5,
  "dest-uc-app": 6,
  "dest-uc-ma": 7,
}

const FERRAMENTAS_COM_BACIA = ["dest-uc-app", "dest-uc-ma"]

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
  let custoCreditos = 5

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
    custoCreditos = CUSTO_POR_FERRAMENTA[ferramentaId] ?? 5
    const precisaBacia = FERRAMENTAS_COM_BACIA.includes(ferramentaId)

    if (!matriculaFile) {
      return NextResponse.json({ erro: "Matrícula (PDF) é obrigatória." }, { status: 400 })
    }
    if (!kmlFile) {
      return NextResponse.json({ erro: "Arquivo geoespacial (KML/GeoJSON) é obrigatório." }, { status: 400 })
    }

    // 3+4. Debitar créditos ANTES do processamento (atômico: verifica saldo + debita)
    const resultadoDebito = await creditos.debitar(user.id, custoCreditos, {
      descricao: `Análise ${ferramentaId} — ${nomeImovel || "Sem nome"}`,
      ferramenta_id: ferramentaId,
    })

    if (!resultadoDebito.sucesso) {
      const status = resultadoDebito.erro?.includes("Saldo insuficiente") ? 400 : 500
      return NextResponse.json({
        erro: resultadoDebito.erro || "Erro ao debitar créditos",
        saldo: resultadoDebito.saldo_restante,
      }, { status })
    }

    const saldoAtual = resultadoDebito.saldo_restante + custoCreditos // saldo antes do débito

    // 5. Criar registro da consulta
    const { data: consulta, error: erroConsulta } = await admin.from("consultas").insert({
      usuario_id: user.id,
      ferramenta_id: ferramentaId,
      nome_imovel: nomeImovel,
      municipio,
      status: "processando",
      creditos_usados: custoCreditos,
    }).select("id").single()

    if (erroConsulta || !consulta) {
      await creditos.reembolsar(user.id, custoCreditos, {
        descricao: "Reembolso — erro ao criar consulta",
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

    // 7. Análise geoespacial + documental
    const kmlContent = kmlBuffer.toString("utf-8")
    const kmlNome = kmlFile.name.toLowerCase()

    // 7a. Primeiro: geo + CND + KML em paralelo (para obter dados de UC)
    const [resultadoCND, resultadoKML, resultadoGeo] = await Promise.all([
      cndBuffer ? analisarCND(cndBuffer) : Promise.resolve(null),
      kmlNome.endsWith(".geojson") || kmlNome.endsWith(".json")
        ? Promise.resolve(processarGeoJSON(kmlContent))
        : processarKML(kmlContent),
      analisarImovelIDESisema(kmlContent),
    ])

    // 7a-bis. Consultar bacia hidrográfica (se ferramenta exige)
    const resultadoBacia = precisaBacia && resultadoKML.sucesso && resultadoKML.bbox && resultadoKML.centroide
      ? await consultarBaciaHidrografica(resultadoKML.bbox, resultadoKML.centroide)
      : null

    // 7b. Detectar UC de proteção integral do IDE-Sisema
    const ucProtecaoIntegral = resultadoGeo.ucs_encontradas.find(
      (uc) => uc.protecao_integral === true,
    )
    const opcoesUC = {
      imovelEmUC: !!ucProtecaoIntegral,
      nomeUC: ucProtecaoIntegral?.nome ?? null,
      categoriaUC: ucProtecaoIntegral?.categoria ?? null,
      percentualSobreposicao: ucProtecaoIntegral?.percentual_sobreposicao ?? null,
    }

    // 7c. Pipeline de matrícula com contexto UC
    const pipelineMatricula = await analisarMatriculaPipeline(matriculaBuffer, opcoesUC)

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

    // 8. VTN
    const municipioVTN = municipio || pipelineMatricula.imovel.municipio || ""
    const vtn = consultarVTN(municipioVTN, "MG")
    if (vtn.encontrado && vtn.valor_referencia && areaPadronizada > 0) {
      vtn.valor_estimado = Math.round(vtn.valor_referencia * areaPadronizada * 100) / 100
      vtn.area_hectares = areaPadronizada
    }

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
        qualificacao: p.qualificacao || null,
        estado_civil: p.estado_civil || null,
        conjuge: p.conjuge || null,
        regime_bens: p.regime_bens || null,
        ato_aquisitivo: p.ato_aquisitivo,
        data_aquisicao: p.data_aquisicao || null,
      })),
      // Outorga conjugal
      outorga_conjugal: pm.outorga_conjugal,
      // Georreferenciamento
      georeferenciamento: pm.georeferenciamento,
      // Pipeline: ônus ativos com classificação por nível
      onus_gravames: pm.onus_ativos.map((o) => ({
        tipo: o.tipo,
        nivel: o.nivel,
        nivel_descricao: o.nivel_descricao,
        numero_averbacao: o.ato,
        descricao: o.descricao,
        impacto_compra_venda: o.impacto_transmissao,
      })),
      onus_extintos: pm.onus_extintos,
      // Restrições ambientais da matrícula
      restricoes_ambientais: pm.restricoes_ambientais,
      contexto_historico_ambiental: pm.contexto_historico_ambiental,
      regime_uc: pm.regime_uc,
      // Pipeline: todos os atos para transparência
      atos_registrais: pm.atos,
      cancelamentos: pm.cancelamentos,
      // Análise de transmissibilidade (Prompt C)
      analise_transmissibilidade: pm.analise_transmissibilidade,
      // Semáforo do pipeline (determinístico)
      semaforo: pm.semaforo,
      semaforo_justificativa: pm.semaforo_justificativa,
      recomendacoes: pm.recomendacoes,
      documentos_faltantes: pm.documentos_faltantes,
      alertas_matricula: [...pm.alertas, ...alertasArea],
      // Confiança OCR
      confianca_ocr: pm.imovel.confianca_ocr,
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
      // Bacia hidrográfica (dest-uc-app, dest-uc-ma)
      bacia: resultadoBacia?.sucesso && resultadoBacia.bacia ? {
        sigla: resultadoBacia.bacia.sigla,
        nome: resultadoBacia.bacia.nome,
        bacia_federal: resultadoBacia.bacia.bacia_federal,
        comite: resultadoBacia.bacia.comite,
        sede_comite: resultadoBacia.bacia.sede_comite,
      } : null,
      // VTN
      vtn: vtn.encontrado ? {
        encontrado: true,
        municipio: vtn.municipio,
        valor_referencia: vtn.valor_referencia,
        valor_estimado: vtn.valor_estimado,
        exercicio: vtn.exercicio,
      } : null,
      // Tokens consumidos
      tokens: pm.tokens_consumidos,
    }

    // 10. Gerar parecer PDF (React-PDF com template ACAM2)
    let parecerPdfPath: string | null = null
    try {
      const { gerarParecerPDF } = await import("@/lib/services/parecer-pdf")
      const pdfBuffer = await gerarParecerPDF({
        nomeImovel: nomeImovel || pm.imovel.denominacao || "",
        municipio: municipio || pm.imovel.municipio || "",
        estado: "MG",
        areaHa: areaPadronizada,
        areaFonte,
        ferramenta: ferramentaId,
        pipeline: pm,
        mvar: null,
        ideSisema: resultadoGeo,
        bacia: resultadoBacia?.sucesso && resultadoBacia.bacia ? {
          sigla: resultadoBacia.bacia.sigla,
          nome: resultadoBacia.bacia.nome,
          bacia_federal: resultadoBacia.bacia.bacia_federal,
          comite: resultadoBacia.bacia.comite,
        } : null,
        cnd: resultadoCND ? {
          tipo: resultadoCND.tipo,
          cib: resultadoCND.cib,
          data_emissao: resultadoCND.data_emissao,
          data_validade: resultadoCND.data_validade,
          area_hectares: resultadoCND.area_hectares,
          nome_contribuinte: resultadoCND.nome_contribuinte,
        } : null,
        vtn: vtn.encontrado ? {
          encontrado: true,
          municipio: vtn.municipio ?? null,
          valor_referencia: vtn.valor_referencia ?? null,
          valor_estimado: vtn.valor_estimado ?? null,
          exercicio: vtn.exercicio ?? null,
        } : null,
      })

      const pdfPath = `${user.id}/${consultaId}/parecer.pdf`
      await admin.storage.from("documentos").upload(pdfPath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      })
      parecerPdfPath = pdfPath
    } catch (erroPdf) {
      console.error("Erro ao gerar parecer PDF:", erroPdf)
    }

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
      creditos_restantes: saldoAtual - custoCreditos,
    })

  } catch (error) {
    console.error("Erro na consulta:", error)

    // Reembolsar créditos em caso de erro
    if (consultaId) {
      await creditos.reembolsar(user.id, custoCreditos, {
        descricao: `Reembolso — erro no processamento da consulta ${consultaId}`,
        consulta_id: consultaId,
      })
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
