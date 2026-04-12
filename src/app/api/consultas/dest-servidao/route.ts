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
  consultarFitofisionomia,
  consultarAreasPrioritarias,
  consultarCorredorEcologico,
  consultarPrioridadeBiodiversidade,
} from "@/lib/services/analise-geoespacial"
import type { BBox, Centroide } from "@/lib/services/analise-geoespacial"
import { calcularMVAR, consultarVTN } from "@/lib/services/mvar"
import { avaliarCriteriosServidao } from "@/lib/services/criterios-servidao"
import { analiseSentinel2 } from "@/lib/services/sentinel-ndvi"

const CUSTO_CREDITOS = 7
const FERRAMENTA_ID = "dest-servidao"

/** Converte ResultadoPipeline (v3) para formato MVAR */
function pipelineParaMVAR(pm: ResultadoPipeline): ResultadoAnalise<DadosMatricula> {
  return {
    sucesso: true,
    dados: {
      matricula: pm.imovel.matricula,
      cartorio: pm.imovel.cartorio,
      data_emissao: pm.imovel.data_abertura,
      dias_desde_emissao: null,
      proprietarios: pm.proprietarios_atuais.map((p) => ({
        nome: p.nome, percentual: p.percentual ?? 0, cpf_cnpj: p.cpf,
        estado_civil: p.estado_civil, conjuge: p.conjuge, regime_bens: p.regime_bens,
      })),
      onus_gravames: pm.onus_ativos.map((o) => ({
        tipo: o.tipo, numero_averbacao: o.ato, descricao: o.descricao,
        valor: o.valor ? String(o.valor) : null, credor: o.credor, data: o.data,
        impacto_compra_venda: o.impacto_transmissao,
      })),
      area_hectares: pm.imovel.area_ha,
      ccir: pm.imovel.ccir, codigo_imovel_incra: pm.imovel.codigo_incra,
      nirf: pm.imovel.nirf, municipio: pm.imovel.municipio, estado: pm.imovel.uf,
      alertas: pm.alertas,
    },
  }
}

/**
 * POST /api/consultas/dest-servidao
 *
 * Compensação MA — Servidão Ambiental ou RPPN (Art. 50, Decreto 47.749/2019)
 * Dois KMLs: área de supressão + área proposta para servidão/RPPN
 * Critérios Art. 50 + ganho ambiental §1º
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

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

    if (!matriculaFile) return NextResponse.json({ erro: "Matrícula (PDF) é obrigatória." }, { status: 400 })
    if (!kmlSupressaoFile) return NextResponse.json({ erro: "Arquivo geoespacial da área de supressão é obrigatório." }, { status: 400 })
    if (!kmlPropostaFile) return NextResponse.json({ erro: "Arquivo geoespacial da área proposta é obrigatório." }, { status: 400 })

    // Debitar créditos
    const resultadoDebito = await creditos.debitar(user.id, CUSTO_CREDITOS, {
      descricao: `Análise ${FERRAMENTA_ID} — ${nomeImovel || "Sem nome"}`,
      ferramenta_id: FERRAMENTA_ID,
    })
    if (!resultadoDebito.sucesso) {
      return NextResponse.json({ erro: resultadoDebito.erro || "Erro ao debitar créditos", saldo: resultadoDebito.saldo_restante }, { status: resultadoDebito.erro?.includes("Saldo insuficiente") ? 400 : 500 })
    }
    creditosDebitados = true

    // Criar registro
    const { data: consulta, error: erroConsulta } = await admin.from("consultas").insert({
      usuario_id: user.id, ferramenta_id: FERRAMENTA_ID, nome_imovel: nomeImovel,
      municipio, status: "processando", creditos_usados: CUSTO_CREDITOS,
    }).select("id").single()

    if (erroConsulta || !consulta) {
      await creditos.reembolsar(user.id, CUSTO_CREDITOS, { descricao: "Reembolso — erro ao criar consulta" })
      return NextResponse.json({ erro: "Erro ao criar consulta" }, { status: 500 })
    }
    consultaId = consulta.id

    // Upload
    async function uploadFile(file: File, tipo: string): Promise<Buffer> {
      const buffer = Buffer.from(await file.arrayBuffer())
      const path = `${user!.id}/${consultaId}/${tipo}_${file.name}`
      await admin.storage.from("documentos").upload(path, buffer, { contentType: file.type, upsert: true })
      await admin.from("documentos").insert({ consulta_id: consultaId, usuario_id: user!.id, tipo, arquivo_nome: file.name, arquivo_path: path, arquivo_tamanho: buffer.length })
      return buffer
    }

    const matriculaBuffer = await uploadFile(matriculaFile, "matricula")
    const cndBuffer = cndFile ? await uploadFile(cndFile, "cnd") : null
    await uploadFile(kmlSupressaoFile, "kml_supressao")
    await uploadFile(kmlPropostaFile, "kml_proposta")

    // ETAPA 1: PROCESSAR GEOMETRIAS
    const kmlSupContent = Buffer.from(await kmlSupressaoFile.arrayBuffer()).toString("utf-8")
    const kmlPropContent = Buffer.from(await kmlPropostaFile.arrayBuffer()).toString("utf-8")

    function processarGeo(content: string, nome: string) {
      const lower = nome.toLowerCase()
      if (lower.endsWith(".geojson") || lower.endsWith(".json")) return processarGeoJSON(content)
      return processarKML(content)
    }

    const [resultadoSup, resultadoProp] = await Promise.all([
      processarGeo(kmlSupContent, kmlSupressaoFile.name),
      processarGeo(kmlPropContent, kmlPropostaFile.name),
    ])
    if (!resultadoSup.sucesso) throw new Error(`Erro KML supressão: ${resultadoSup.erro}`)
    if (!resultadoProp.sucesso) throw new Error(`Erro KML proposta: ${resultadoProp.erro}`)

    const bboxSup = resultadoSup.bbox as BBox, centSup = resultadoSup.centroide as Centroide
    const bboxProp = resultadoProp.bbox as BBox, centProp = resultadoProp.centroide as Centroide
    const geomProposta = resultadoProp.geometria as GeoJSON.Polygon | GeoJSON.MultiPolygon
    const geomSupressao = resultadoSup.geometria as GeoJSON.Polygon | GeoJSON.MultiPolygon

    // ETAPA 2: ANÁLISES GEOESPACIAIS (paralelo)
    const [
      maSupressao, maProposta,
      baciaSupressao, baciaProposta,
      coberturaSupressao, coberturaProposta,
      fitofisionomiaSuprimida, fitofisionomaProposta,
      areaPrioritaria, corredor, biodiversidade,
      resultadoUC, resultadoCND,
    ] = await Promise.all([
      verificarMataAtlantica(bboxSup, centSup),
      verificarMataAtlantica(bboxProp, centProp),
      consultarBaciaHidrografica(bboxSup, centSup),
      consultarBaciaHidrografica(bboxProp, centProp),
      analisarCoberturaDetalhada(geomSupressao, resultadoSup.areaHa || 0, 8),
      analisarCoberturaDetalhada(geomProposta, resultadoProp.areaHa || 0, 8),
      consultarFitofisionomia(bboxSup, centSup),
      consultarFitofisionomia(bboxProp, centProp),
      consultarAreasPrioritarias(bboxProp, centProp),
      consultarCorredorEcologico(bboxProp, centProp),
      consultarPrioridadeBiodiversidade(bboxProp, centProp),
      analisarImovelIDESisema(kmlPropContent),
      cndBuffer ? analisarCND(cndBuffer) : Promise.resolve(null),
    ])

    const temUCProxima = resultadoUC.ucs_encontradas.length > 0

    // ETAPA 3: DINÂMICA + SENTINEL
    const [dinamicaVegetal, sentinel2] = await Promise.all([
      analisarDinamicaVegetal(geomProposta, resultadoProp.areaHa || 0),
      analiseSentinel2(
        geomProposta,
        coberturaProposta.classes?.[0]?.classe || "Formação Florestal",
        coberturaProposta.classes?.[0]?.tipo || "natural",
        coberturaProposta.classes?.map((c) => ({ classe: c.classe, tipo: c.tipo, percentual: c.percentual })) || null,
      ),
    ])

    // ETAPA 4: MATRÍCULA + MVAR
    const pipelineMatricula = await analisarMatriculaPipeline(matriculaBuffer, {})
    await admin.from("documentos").update({ dados_extraidos: pipelineMatricula }).eq("consulta_id", consultaId).eq("tipo", "matricula")

    const dadosMVAR = pipelineParaMVAR(pipelineMatricula)
    const mvarResult = await calcularMVAR(dadosMVAR, resultadoCND, resultadoUC, {
      tipoOperacao: "servidao_rppn", municipio: municipio || pipelineMatricula.imovel.municipio || "",
      areaPadronizada: resultadoProp.areaHa,
    })

    const municipioVTN = municipio || pipelineMatricula.imovel.municipio || ""
    const vtn = consultarVTN(municipioVTN, "MG")
    const areaPropostaHa = resultadoProp.areaHa ? parseFloat(resultadoProp.areaHa.toFixed(2)) : 0
    if (vtn.encontrado && vtn.valor_referencia && areaPropostaHa > 0) {
      vtn.valor_estimado = Math.round(vtn.valor_referencia * areaPropostaHa * 100) / 100
    }

    // ETAPA 5: AVALIAR CRITÉRIOS
    const areaSupHa = resultadoSup.areaHa ? parseFloat(resultadoSup.areaHa.toFixed(2)) : 0
    const resultadoCriterios = avaliarCriteriosServidao({
      areaSuprimidaHa: areaSupHa, areaPropostaHa,
      maSuprimida: maSupressao.estaNaMataAtlantica,
      maProposta: maProposta.estaNaMataAtlantica,
      baciaSuprimida: baciaSupressao?.bacia || null,
      baciaProposta: baciaProposta?.bacia || null,
      coberturaSuprimida: coberturaSupressao, coberturaProposta,
      fitofisionomiaSuprimida: fitofisionomiaSuprimida,
      fitofisionomaProposta: fitofisionomaProposta,
      areaPrioritaria, corredor, biodiversidade, temUCProxima,
    })

    // ETAPA 6: MONTAR RESPOSTA
    const parecer = {
      tipo: "Mata Atlântica — Servidão Ambiental / RPPN",
      base_legal: "Art. 50, Decreto Estadual nº 47.749/2019",

      area_supressao: {
        area_ha: areaSupHa, bacia: baciaSupressao?.bacia || null,
        mata_atlantica: maSupressao.estaNaMataAtlantica,
        cobertura: coberturaSupressao, fitofisionomia: fitofisionomiaSuprimida,
        geojson: resultadoSup.geojson || null, bbox: resultadoSup.bbox || null, centroide: resultadoSup.centroide || null,
      },
      area_proposta: {
        area_ha: areaPropostaHa, bacia: baciaProposta?.bacia || null,
        mata_atlantica: maProposta.estaNaMataAtlantica,
        cobertura: coberturaProposta, fitofisionomia: fitofisionomaProposta,
        ucs_encontradas: resultadoUC.ucs_encontradas,
        geojson: resultadoProp.geojson || null, bbox: resultadoProp.bbox || null, centroide: resultadoProp.centroide || null,
      },

      criterios: resultadoCriterios.criterios,
      compensacao: resultadoCriterios.compensacao,
      ganho_ambiental: resultadoCriterios.ganhoAmbiental,
      viabilidade: resultadoCriterios.viabilidade,
      recomendacao: resultadoCriterios.recomendacao,
      alertas: resultadoCriterios.alertas,

      area_prioritaria: areaPrioritaria,
      corredor_ecologico: corredor,
      biodiversidade,

      dinamica_vegetal: dinamicaVegetal.sucesso ? dinamicaVegetal : null,
      sentinel2,
      mvar: mvarResult,

      imovel: {
        nome: nomeImovel || pipelineMatricula.imovel.denominacao,
        municipio: municipio || pipelineMatricula.imovel.municipio, estado: "MG",
        matricula: pipelineMatricula.imovel.matricula, cartorio: pipelineMatricula.imovel.cartorio,
        ccir: pipelineMatricula.imovel.ccir, nirf: pipelineMatricula.imovel.nirf,
        car: pipelineMatricula.imovel.car, georreferenciamento: pipelineMatricula.imovel.georreferenciamento,
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
      confianca_ocr: pipelineMatricula.imovel.confianca_ocr,

      cnd: resultadoCND ? { tipo: resultadoCND.tipo, cib: resultadoCND.cib, data_validade: resultadoCND.data_validade, area_hectares: resultadoCND.area_hectares } : null,
      vtn: vtn.encontrado ? { encontrado: true, municipio: vtn.municipio, valor_referencia: vtn.valor_referencia, valor_estimado: vtn.valor_estimado, exercicio: vtn.exercicio } : null,
      tokens: pipelineMatricula.tokens_consumidos,
    }

    // ETAPA 7: PDF
    let parecerPdfPath: string | null = null
    console.log("[ROUTE-SERVIDAO] Iniciando geração do PDF...")
    try {
      const { gerarParecerServidaoPDF } = await import("@/lib/services/parecer-servidao-pdf")
      const pdfBuffer = await gerarParecerServidaoPDF({
        nomeImovel: nomeImovel || pipelineMatricula.imovel.denominacao || "",
        municipio: municipio || pipelineMatricula.imovel.municipio || "",
        estado: "MG",
        viabilidade: resultadoCriterios.viabilidade,
        recomendacao: resultadoCriterios.recomendacao,
        baseLegal: "Art. 50, Decreto Estadual nº 47.749/2019",
        criterios: resultadoCriterios.criterios,
        compensacao: resultadoCriterios.compensacao,
        ganhoAmbiental: resultadoCriterios.ganhoAmbiental,
        areaSupressao: { area_ha: areaSupHa, bacia: baciaSupressao?.bacia || null, cobertura: coberturaSupressao, fitofisionomia: fitofisionomiaSuprimida },
        areaProposta: {
          area_ha: areaPropostaHa, bacia: baciaProposta?.bacia || null, cobertura: coberturaProposta, fitofisionomia: fitofisionomaProposta,
          ucs_encontradas: resultadoUC.ucs_encontradas.map((uc) => ({ nome: uc.nome, categoria: uc.categoria, protecao_integral: uc.protecao_integral, percentual_sobreposicao: uc.percentual_sobreposicao ?? null })),
          mapaClassificacao: coberturaProposta.mapaClassificacao,
        },
        areaPrioritaria, corredor, biodiversidade,
        dinamicaVegetal: dinamicaVegetal.sucesso ? dinamicaVegetal : null,
        sentinel2, mvar: mvarResult, pipeline: pipelineMatricula,
        cnd: resultadoCND ? { tipo: resultadoCND.tipo, cib: resultadoCND.cib, data_validade: resultadoCND.data_validade, area_hectares: resultadoCND.area_hectares } : null,
        vtn: vtn.encontrado ? { encontrado: true, municipio: vtn.municipio ?? null, valor_referencia: vtn.valor_referencia ?? null, valor_estimado: vtn.valor_estimado ?? null, exercicio: vtn.exercicio ?? null } : null,
      })

      const pdfPath = `${user.id}/${consultaId}/parecer.pdf`
      await admin.storage.from("documentos").upload(pdfPath, pdfBuffer, { contentType: "application/pdf", upsert: true })
      parecerPdfPath = pdfPath
    } catch (erroPdf) {
      console.error("Erro ao gerar parecer PDF Servidão:", erroPdf)
      console.error("Stack:", (erroPdf as Error).stack)
    }

    // Atualizar consulta
    await admin.from("consultas").update({
      status: "concluida", parecer_json: parecer, parecer_pdf_path: parecerPdfPath,
      area_hectares: areaPropostaHa, updated_at: new Date().toISOString(),
    }).eq("id", consultaId)

    const saldoAtual = (resultadoDebito.saldo_restante ?? 0) + CUSTO_CREDITOS
    return NextResponse.json({ sucesso: true, consulta_id: consultaId, status: "concluida", parecer, creditos_restantes: saldoAtual - CUSTO_CREDITOS })

  } catch (error) {
    console.error("Erro na consulta dest-servidao:", error)
    if (creditosDebitados) {
      await creditos.reembolsar(user.id, CUSTO_CREDITOS, { descricao: `Reembolso — erro ${consultaId || "?"}`, consulta_id: consultaId || undefined })
    }
    return NextResponse.json({ erro: "Erro ao processar consulta. Créditos reembolsados.", detalhes: (error as Error).message }, { status: 500 })
  }
}
