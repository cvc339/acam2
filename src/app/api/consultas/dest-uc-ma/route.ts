import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { creditos } from "@/lib/creditos"
import { analisarCND } from "@/lib/services/analise-documental"
import type { ResultadoAnalise, DadosMatricula } from "@/lib/services/analise-documental"
import { analisarMatriculaPipeline } from "@/lib/services/analise-matricula"
import type { ResultadoPipeline } from "@/lib/services/analise-matricula"
import {
  processarKML,
  processarGeoJSON,
  consultarBaciaHidrografica,
  verificarMataAtlantica,
  analisarImovelIDESisema,
  analisarCoberturaDetalhada,
  analisarDinamicaVegetal,
} from "@/lib/services/analise-geoespacial"
import type { BBox, Centroide } from "@/lib/services/analise-geoespacial"
import { calcularMVAR, consultarVTN } from "@/lib/services/mvar"
import { avaliarCriteriosMA } from "@/lib/services/criterios-ma"
import { analiseSentinel2 } from "@/lib/services/sentinel-ndvi"

const CUSTO_CREDITOS = 7

/** Converte ResultadoPipeline (v3) para o formato que calcularMVAR() espera */
function pipelineParaMVAR(pm: ResultadoPipeline): ResultadoAnalise<DadosMatricula> {
  return {
    sucesso: true,
    dados: {
      matricula: pm.imovel.matricula,
      cartorio: pm.imovel.cartorio,
      data_emissao: pm.imovel.data_abertura,
      dias_desde_emissao: null,
      proprietarios: pm.proprietarios_atuais.map((p) => ({
        nome: p.nome,
        percentual: p.percentual ?? 0,
        cpf_cnpj: p.cpf,
        estado_civil: p.estado_civil,
        conjuge: p.conjuge,
        regime_bens: p.regime_bens,
      })),
      onus_gravames: pm.onus_ativos.map((o) => ({
        tipo: o.tipo,
        numero_averbacao: o.ato,
        descricao: o.descricao,
        valor: o.valor ? String(o.valor) : null,
        credor: o.credor,
        data: o.data,
        impacto_compra_venda: o.impacto_transmissao,
      })),
      area_hectares: pm.imovel.area_ha,
      ccir: pm.imovel.ccir,
      codigo_imovel_incra: pm.imovel.codigo_incra,
      nirf: pm.imovel.nirf,
      municipio: pm.imovel.municipio,
      estado: pm.imovel.uf,
      alertas: pm.alertas,
    },
  }
}
const FERRAMENTA_ID = "dest-uc-ma"

/**
 * POST /api/consultas/dest-uc-ma
 *
 * Compensação Mata Atlântica — Destinação em UC (art. 49, II, Decreto 47.749/2019)
 *
 * Dois KMLs: área de supressão + área proposta para doação
 * 6 critérios: 2:1, bioma, bacia, sub-bacia, ecologia, UC PI
 * Análises: MapBiomas, NDVI Sentinel-2, dinâmica vegetal, MVAR
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
  }

  let consultaId: string | null = null
  let creditosDebitados = false

  try {
    const formData = await request.formData()

    const nomeImovel = formData.get("nome_imovel") as string || ""
    const municipio = formData.get("municipio") as string || ""

    const matriculaFile = formData.get("matricula") as File | null
    const cndFile = formData.get("cnd") as File | null
    const kmlSupressaoFile = formData.get("kml_supressao") as File | null
    const kmlPropostaFile = formData.get("kml_proposta") as File | null

    // Validação
    if (!matriculaFile) {
      return NextResponse.json({ erro: "Matrícula (PDF) é obrigatória." }, { status: 400 })
    }
    if (!kmlSupressaoFile) {
      return NextResponse.json({ erro: "Arquivo geoespacial da área de supressão é obrigatório." }, { status: 400 })
    }
    if (!kmlPropostaFile) {
      return NextResponse.json({ erro: "Arquivo geoespacial da área proposta é obrigatório." }, { status: 400 })
    }

    // Debitar créditos
    const resultadoDebito = await creditos.debitar(user.id, CUSTO_CREDITOS, {
      descricao: `Análise ${FERRAMENTA_ID} — ${nomeImovel || "Sem nome"}`,
      ferramenta_id: FERRAMENTA_ID,
    })

    if (!resultadoDebito.sucesso) {
      const status = resultadoDebito.erro?.includes("Saldo insuficiente") ? 400 : 500
      return NextResponse.json({
        erro: resultadoDebito.erro || "Erro ao debitar créditos",
        saldo: resultadoDebito.saldo_restante,
      }, { status })
    }
    creditosDebitados = true

    // Criar registro
    const { data: consulta, error: erroConsulta } = await admin.from("consultas").insert({
      usuario_id: user.id,
      ferramenta_id: FERRAMENTA_ID,
      nome_imovel: nomeImovel,
      municipio,
      status: "processando",
      creditos_usados: CUSTO_CREDITOS,
    }).select("id").single()

    if (erroConsulta || !consulta) {
      await creditos.reembolsar(user.id, CUSTO_CREDITOS, { descricao: "Reembolso — erro ao criar consulta" })
      return NextResponse.json({ erro: "Erro ao criar consulta" }, { status: 500 })
    }

    consultaId = consulta.id

    // Upload dos arquivos
    async function uploadFile(file: File, tipo: string): Promise<Buffer> {
      const buffer = Buffer.from(await file.arrayBuffer())
      const path = `${user!.id}/${consultaId}/${tipo}_${file.name}`
      await admin.storage.from("documentos").upload(path, buffer, { contentType: file.type, upsert: true })
      await admin.from("documentos").insert({
        consulta_id: consultaId, usuario_id: user!.id, tipo,
        arquivo_nome: file.name, arquivo_path: path, arquivo_tamanho: buffer.length,
      })
      return buffer
    }

    const matriculaBuffer = await uploadFile(matriculaFile, "matricula")
    const cndBuffer = cndFile ? await uploadFile(cndFile, "cnd") : null
    await uploadFile(kmlSupressaoFile, "kml_supressao")
    await uploadFile(kmlPropostaFile, "kml_proposta")

    // ============================================
    // ETAPA 1: PROCESSAR GEOMETRIAS
    // ============================================

    const kmlSupressaoContent = Buffer.from(await kmlSupressaoFile.arrayBuffer()).toString("utf-8")
    const kmlPropostaContent = Buffer.from(await kmlPropostaFile.arrayBuffer()).toString("utf-8")

    function processarArquivoGeo(content: string, nome: string) {
      const lower = nome.toLowerCase()
      if (lower.endsWith(".geojson") || lower.endsWith(".json")) return processarGeoJSON(content)
      return processarKML(content)
    }

    const [resultadoSupressao, resultadoProposta] = await Promise.all([
      processarArquivoGeo(kmlSupressaoContent, kmlSupressaoFile.name),
      processarArquivoGeo(kmlPropostaContent, kmlPropostaFile.name),
    ])

    if (!resultadoSupressao.sucesso) throw new Error(`Erro ao processar KML da supressão: ${resultadoSupressao.erro}`)
    if (!resultadoProposta.sucesso) throw new Error(`Erro ao processar KML da proposta: ${resultadoProposta.erro}`)

    const bboxSup = resultadoSupressao.bbox as BBox
    const centSup = resultadoSupressao.centroide as Centroide
    const bboxProp = resultadoProposta.bbox as BBox
    const centProp = resultadoProposta.centroide as Centroide
    const geomProposta = resultadoProposta.geometria as GeoJSON.Polygon | GeoJSON.MultiPolygon
    const geomSupressao = resultadoSupressao.geometria as GeoJSON.Polygon | GeoJSON.MultiPolygon

    // ============================================
    // ETAPA 2: ANÁLISES GEOESPACIAIS (paralelo)
    // ============================================

    const [
      maSupressao,
      maProposta,
      baciaSupressao,
      baciaProposta,
      coberturaSupressao,
      coberturaProposta,
      resultadoUC,
      resultadoCND,
    ] = await Promise.all([
      verificarMataAtlantica(bboxSup, centSup),
      verificarMataAtlantica(bboxProp, centProp),
      consultarBaciaHidrografica(bboxSup, centSup),
      consultarBaciaHidrografica(bboxProp, centProp),
      analisarCoberturaDetalhada(geomSupressao, resultadoSupressao.areaHa || 0, 8),
      analisarCoberturaDetalhada(geomProposta, resultadoProposta.areaHa || 0, 8),
      analisarImovelIDESisema(kmlPropostaContent),
      cndBuffer ? analisarCND(cndBuffer) : Promise.resolve(null),
    ])

    // UC de proteção integral
    const ucProtecaoIntegral = resultadoUC.ucs_encontradas.find((uc) => uc.protecao_integral === true)

    // ============================================
    // ETAPA 3: DINÂMICA VEGETAL + SENTINEL-2 (proposta)
    // ============================================

    const [dinamicaVegetal, sentinel2] = await Promise.all([
      analisarDinamicaVegetal(geomProposta, resultadoProposta.areaHa || 0),
      analiseSentinel2(
        geomProposta,
        coberturaProposta.classes?.[0]?.classe || "Formação Florestal",
        coberturaProposta.classes?.[0]?.tipo || "natural",
        coberturaProposta.classes?.map((c) => ({ classe: c.classe, tipo: c.tipo, percentual: c.percentual })) || null,
      ),
    ])

    // ============================================
    // ETAPA 4: PIPELINE MATRÍCULA + MVAR
    // ============================================

    const opcoesUC = {
      imovelEmUC: !!ucProtecaoIntegral,
      nomeUC: ucProtecaoIntegral?.nome ?? null,
      categoriaUC: ucProtecaoIntegral?.categoria ?? null,
      percentualSobreposicao: ucProtecaoIntegral?.percentual_sobreposicao ?? null,
    }

    const pipelineMatricula = await analisarMatriculaPipeline(matriculaBuffer, opcoesUC)

    // Salvar dados extraídos
    await admin.from("documentos").update({ dados_extraidos: pipelineMatricula }).eq("consulta_id", consultaId).eq("tipo", "matricula")

    // MVAR
    const dadosMVAR = pipelineParaMVAR(pipelineMatricula)
    const mvarResult = await calcularMVAR(
      dadosMVAR,
      resultadoCND,
      resultadoUC,
      { tipoOperacao: "doacao_uc", municipio: municipio || pipelineMatricula.imovel.municipio || "", areaPadronizada: resultadoProposta.areaHa },
    )

    // VTN
    const municipioVTN = municipio || pipelineMatricula.imovel.municipio || ""
    const vtn = consultarVTN(municipioVTN, "MG")
    const areaPropostaHa = resultadoProposta.areaHa ? parseFloat(resultadoProposta.areaHa.toFixed(2)) : 0
    if (vtn.encontrado && vtn.valor_referencia && areaPropostaHa > 0) {
      vtn.valor_estimado = Math.round(vtn.valor_referencia * areaPropostaHa * 100) / 100
      vtn.area_hectares = areaPropostaHa
    }

    // ============================================
    // ETAPA 5: AVALIAR CRITÉRIOS
    // ============================================

    const areaSupressaoHa = resultadoSupressao.areaHa ? parseFloat(resultadoSupressao.areaHa.toFixed(2)) : 0

    const resultadoCriterios = avaliarCriteriosMA({
      areaSuprimidaHa: areaSupressaoHa,
      areaPropostaHa,
      maSuprimida: maSupressao.estaNaMataAtlantica,
      maProposta: maProposta.estaNaMataAtlantica,
      baciaSuprimida: baciaSupressao?.bacia || null,
      baciaProposta: baciaProposta?.bacia || null,
      coberturaSuprimida: coberturaSupressao,
      coberturaProposta: coberturaProposta,
      ucPrincipal: ucProtecaoIntegral ? {
        nome: ucProtecaoIntegral.nome,
        categoria: ucProtecaoIntegral.categoria,
        protecao_integral: ucProtecaoIntegral.protecao_integral,
        percentual_sobreposicao: ucProtecaoIntegral.percentual_sobreposicao ?? null,
      } : null,
    })

    // ============================================
    // ETAPA 6: MONTAR RESPOSTA
    // ============================================

    const parecer = {
      tipo: "Mata Atlântica — Destinação em UC",
      base_legal: "Art. 49, II, Decreto Estadual nº 47.749/2019",

      area_supressao: {
        area_ha: areaSupressaoHa,
        bacia: baciaSupressao?.bacia || null,
        mata_atlantica: maSupressao.estaNaMataAtlantica,
        cobertura: coberturaSupressao,
        geojson: resultadoSupressao.geojson || null,
        bbox: resultadoSupressao.bbox || null,
        centroide: resultadoSupressao.centroide || null,
      },
      area_proposta: {
        area_ha: areaPropostaHa,
        bacia: baciaProposta?.bacia || null,
        mata_atlantica: maProposta.estaNaMataAtlantica,
        cobertura: coberturaProposta,
        em_uc_pi: !!ucProtecaoIntegral,
        uc: ucProtecaoIntegral || null,
        ucs_encontradas: resultadoUC.ucs_encontradas,
        geojson: resultadoProposta.geojson || null,
        bbox: resultadoProposta.bbox || null,
        centroide: resultadoProposta.centroide || null,
      },

      criterios: resultadoCriterios.criterios,
      compensacao: resultadoCriterios.compensacao,
      viabilidade: resultadoCriterios.viabilidade,
      recomendacao: resultadoCriterios.recomendacao,
      alertas: resultadoCriterios.alertas,

      dinamica_vegetal: dinamicaVegetal.sucesso ? dinamicaVegetal : null,
      sentinel2: sentinel2,

      mvar: mvarResult,

      imovel: {
        nome: nomeImovel || pipelineMatricula.imovel.denominacao,
        municipio: municipio || pipelineMatricula.imovel.municipio,
        estado: "MG",
        matricula: pipelineMatricula.imovel.matricula,
        cartorio: pipelineMatricula.imovel.cartorio,
        ccir: pipelineMatricula.imovel.ccir,
        nirf: pipelineMatricula.imovel.nirf,
        car: pipelineMatricula.imovel.car,
        georreferenciamento: pipelineMatricula.imovel.georreferenciamento,
      },
      proprietarios: pipelineMatricula.proprietarios_atuais.map((p) => ({
        nome: p.nome, percentual: p.percentual || null,
        estado_civil: p.estado_civil || null, conjuge: p.conjuge || null,
      })),
      onus_gravames: pipelineMatricula.onus_ativos.map((o) => ({
        tipo: o.tipo, nivel: o.nivel, nivel_descricao: o.nivel_descricao,
        numero_averbacao: o.ato, descricao: o.descricao, impacto_compra_venda: o.impacto_transmissao,
      })),
      semaforo: pipelineMatricula.semaforo,
      analise_transmissibilidade: pipelineMatricula.analise_transmissibilidade,
      confianca_ocr: pipelineMatricula.imovel.confianca_ocr,

      cnd: resultadoCND ? {
        tipo: resultadoCND.tipo, cib: resultadoCND.cib,
        data_validade: resultadoCND.data_validade, area_hectares: resultadoCND.area_hectares,
      } : null,

      vtn: vtn.encontrado ? {
        encontrado: true, municipio: vtn.municipio,
        valor_referencia: vtn.valor_referencia, valor_estimado: vtn.valor_estimado,
        exercicio: vtn.exercicio,
      } : null,

      tokens: pipelineMatricula.tokens_consumidos,
    }

    // ============================================
    // ETAPA 7: GERAR PDF
    // ============================================

    let parecerPdfPath: string | null = null
    console.log("[ROUTE-MA] Iniciando geração do PDF...")
    try {
      const { gerarParecerMaPDF } = await import("@/lib/services/parecer-ma-pdf")
      console.log("[ROUTE-MA] Módulo importado, chamando gerarParecerMaPDF...")
      const pdfBuffer = await gerarParecerMaPDF({
        nomeImovel: nomeImovel || pipelineMatricula.imovel.denominacao || "",
        municipio: municipio || pipelineMatricula.imovel.municipio || "",
        estado: "MG",
        viabilidade: resultadoCriterios.viabilidade,
        recomendacao: resultadoCriterios.recomendacao,
        baseLegal: "Art. 49, II, Decreto Estadual nº 47.749/2019",
        criterios: resultadoCriterios.criterios,
        compensacao: resultadoCriterios.compensacao,
        areaSupressao: { area_ha: areaSupressaoHa, bacia: baciaSupressao?.bacia || null, cobertura: coberturaSupressao },
        areaProposta: {
          area_ha: areaPropostaHa, bacia: baciaProposta?.bacia || null, cobertura: coberturaProposta,
          uc: ucProtecaoIntegral ? { nome: ucProtecaoIntegral.nome, categoria: ucProtecaoIntegral.categoria, protecao_integral: true, percentual_sobreposicao: ucProtecaoIntegral.percentual_sobreposicao ?? null } : null,
          ucs_encontradas: resultadoUC.ucs_encontradas.map((uc) => ({ nome: uc.nome, categoria: uc.categoria, protecao_integral: uc.protecao_integral, percentual_sobreposicao: uc.percentual_sobreposicao ?? null })),
          mapaClassificacao: coberturaProposta.mapaClassificacao,
        },
        dinamicaVegetal: dinamicaVegetal.sucesso ? dinamicaVegetal : null,
        sentinel2,
        mvar: mvarResult,
        pipeline: pipelineMatricula,
        cnd: resultadoCND ? { tipo: resultadoCND.tipo, cib: resultadoCND.cib, data_validade: resultadoCND.data_validade, area_hectares: resultadoCND.area_hectares } : null,
        vtn: vtn.encontrado ? { encontrado: true, municipio: vtn.municipio ?? null, valor_referencia: vtn.valor_referencia ?? null, valor_estimado: vtn.valor_estimado ?? null, exercicio: vtn.exercicio ?? null } : null,
      })

      const pdfPath = `${user.id}/${consultaId}/parecer.pdf`
      await admin.storage.from("documentos").upload(pdfPath, pdfBuffer, { contentType: "application/pdf", upsert: true })
      parecerPdfPath = pdfPath
    } catch (erroPdf) {
      console.error("Erro ao gerar parecer PDF MA:", erroPdf)
      console.error("Stack:", (erroPdf as Error).stack)
    }

    // Atualizar consulta
    await admin.from("consultas").update({
      status: "concluida",
      parecer_json: parecer,
      parecer_pdf_path: parecerPdfPath,
      area_hectares: areaPropostaHa,
      updated_at: new Date().toISOString(),
    }).eq("id", consultaId)

    const saldoAtual = (resultadoDebito.saldo_restante ?? 0) + CUSTO_CREDITOS

    return NextResponse.json({
      sucesso: true,
      consulta_id: consultaId,
      status: "concluida",
      parecer,
      creditos_restantes: saldoAtual - CUSTO_CREDITOS,
    })

  } catch (error) {
    console.error("Erro na consulta dest-uc-ma:", error)

    if (creditosDebitados) {
      await creditos.reembolsar(user.id, CUSTO_CREDITOS, {
        descricao: `Reembolso — erro no processamento da consulta ${consultaId || "?"}`,
        consulta_id: consultaId || undefined,
      })
    }

    return NextResponse.json({
      erro: "Erro ao processar consulta. Créditos reembolsados.",
      detalhes: (error as Error).message,
    }, { status: 500 })
  }
}
