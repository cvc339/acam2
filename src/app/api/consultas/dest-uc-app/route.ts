import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { creditos } from "@/lib/creditos"
import { analisarCND } from "@/lib/services/analise-documental"
import { analisarMatriculaPipeline } from "@/lib/services/analise-matricula"
import {
  analisarImovelIDESisema,
  processarKML,
  processarGeoJSON,
  consultarBaciaHidrografica,
} from "@/lib/services/analise-geoespacial"
import type { BBox, Centroide, ResultadoBacia } from "@/lib/services/analise-geoespacial"
import { consultarVTN } from "@/lib/services/mvar"

const CUSTO_CREDITOS = 6
const FERRAMENTA_ID = "dest-uc-app"

/**
 * POST /api/consultas/dest-uc-app
 *
 * Compensação APP — Destinação em UC (art. 75, IV, Decreto 47.749/2019)
 *
 * Requer DOIS arquivos geoespaciais:
 * - kml_intervencao: área onde a intervenção em APP está acontecendo
 * - kml_proposta: área proposta para doação em UC
 *
 * Verifica 3 critérios:
 * 1. Área proposta está em UC de Proteção Integral?
 * 2. Ambas as áreas estão na mesma bacia hidrográfica de rio federal?
 * 3. Preferencialmente, na mesma sub-bacia hidrográfica?
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
    const kmlIntervencaoFile = formData.get("kml_intervencao") as File | null
    const kmlPropostaFile = formData.get("kml_proposta") as File | null

    // Validação
    if (!matriculaFile) {
      return NextResponse.json({ erro: "Matrícula (PDF) é obrigatória." }, { status: 400 })
    }
    if (!kmlIntervencaoFile) {
      return NextResponse.json({ erro: "Arquivo geoespacial da área de intervenção é obrigatório." }, { status: 400 })
    }
    if (!kmlPropostaFile) {
      return NextResponse.json({ erro: "Arquivo geoespacial da área proposta para doação é obrigatório." }, { status: 400 })
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

    // Criar registro da consulta
    const { data: consulta, error: erroConsulta } = await admin.from("consultas").insert({
      usuario_id: user.id,
      ferramenta_id: FERRAMENTA_ID,
      nome_imovel: nomeImovel,
      municipio,
      status: "processando",
      creditos_usados: CUSTO_CREDITOS,
    }).select("id").single()

    if (erroConsulta || !consulta) {
      await creditos.reembolsar(user.id, CUSTO_CREDITOS, {
        descricao: "Reembolso — erro ao criar consulta",
      })
      return NextResponse.json({ erro: "Erro ao criar consulta" }, { status: 500 })
    }

    consultaId = consulta.id

    // Upload dos arquivos
    async function uploadFile(file: File, tipo: string): Promise<Buffer> {
      const buffer = Buffer.from(await file.arrayBuffer())
      const path = `${user!.id}/${consultaId}/${tipo}_${file.name}`

      await admin.storage.from("documentos").upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

      await admin.from("documentos").insert({
        consulta_id: consultaId,
        usuario_id: user!.id,
        tipo,
        arquivo_nome: file.name,
        arquivo_path: path,
        arquivo_tamanho: buffer.length,
      })

      return buffer
    }

    const matriculaBuffer = await uploadFile(matriculaFile, "matricula")
    const cndBuffer = cndFile ? await uploadFile(cndFile, "cnd") : null
    await uploadFile(kmlIntervencaoFile, "kml_intervencao")
    await uploadFile(kmlPropostaFile, "kml_proposta")

    // ============================================
    // PROCESSAR GEOMETRIAS (duas áreas)
    // ============================================

    const kmlIntervencaoContent = Buffer.from(await kmlIntervencaoFile.arrayBuffer()).toString("utf-8")
    const kmlPropostaContent = Buffer.from(await kmlPropostaFile.arrayBuffer()).toString("utf-8")

    function processarArquivoGeo(content: string, nome: string) {
      const lower = nome.toLowerCase()
      if (lower.endsWith(".geojson") || lower.endsWith(".json")) {
        return processarGeoJSON(content)
      }
      return processarKML(content)
    }

    const [resultadoIntervencao, resultadoProposta] = await Promise.all([
      processarArquivoGeo(kmlIntervencaoContent, kmlIntervencaoFile.name),
      processarArquivoGeo(kmlPropostaContent, kmlPropostaFile.name),
    ])

    if (!resultadoIntervencao.sucesso) {
      throw new Error(`Erro ao processar arquivo da área de intervenção: ${resultadoIntervencao.erro}`)
    }
    if (!resultadoProposta.sucesso) {
      throw new Error(`Erro ao processar arquivo da área proposta: ${resultadoProposta.erro}`)
    }

    // ============================================
    // CONSULTAR BACIAS (ambas as áreas em paralelo)
    // ============================================

    const [baciaIntervencao, baciaProposta, resultadoGeo, resultadoCND] = await Promise.all([
      consultarBaciaHidrografica(
        resultadoIntervencao.bbox as BBox,
        resultadoIntervencao.centroide as Centroide,
      ),
      consultarBaciaHidrografica(
        resultadoProposta.bbox as BBox,
        resultadoProposta.centroide as Centroide,
      ),
      // UC check na área proposta
      analisarImovelIDESisema(kmlPropostaContent),
      // CND em paralelo
      cndBuffer ? analisarCND(cndBuffer) : Promise.resolve(null),
    ])

    // ============================================
    // CRITÉRIOS (art. 75, IV, Decreto 47.749/2019)
    // ============================================

    // Critério 1: Área proposta em UC de Proteção Integral
    const ucProtecaoIntegral = resultadoGeo.ucs_encontradas.find(
      (uc) => uc.protecao_integral === true,
    )
    const emUCPI = !!ucProtecaoIntegral

    // Critério 2: Mesma bacia hidrográfica de rio federal
    const baciaFederalIntervencao = baciaIntervencao?.bacia?.bacia_federal || null
    const baciaFederalProposta = baciaProposta?.bacia?.bacia_federal || null
    const mesmaBaciaFederal = !!(
      baciaFederalIntervencao &&
      baciaFederalProposta &&
      baciaFederalIntervencao === baciaFederalProposta
    )

    // Critério 3: Mesma sub-bacia (preferencial)
    const siglaIntervencao = baciaIntervencao?.bacia?.sigla || null
    const siglaProposta = baciaProposta?.bacia?.sigla || null
    const mesmaSubBacia = !!(
      siglaIntervencao &&
      siglaProposta &&
      siglaIntervencao === siglaProposta
    )

    // Viabilidade
    let viabilidade: "ALTA" | "BAIXA"
    let recomendacao: string

    if (!mesmaBaciaFederal) {
      viabilidade = "BAIXA"
      recomendacao = `A área proposta NÃO está na mesma bacia hidrográfica de rio federal da área de intervenção. Bacia da intervenção: ${baciaFederalIntervencao || "não identificada"}. Bacia da proposta: ${baciaFederalProposta || "não identificada"}. O Decreto 47.749/2019, art. 75, IV, exige que ambas estejam na mesma bacia federal.`
    } else if (!emUCPI) {
      viabilidade = "BAIXA"
      recomendacao = "A área proposta não está em Unidade de Conservação de Proteção Integral. O imóvel deve estar inserido em UC de domínio público pendente de regularização fundiária."
    } else if (mesmaSubBacia) {
      viabilidade = "ALTA"
      recomendacao = "O imóvel atende a todos os requisitos, incluindo a preferência por mesma sub-bacia hidrográfica. Viabilidade alta para compensação de APP por destinação em UC."
    } else {
      viabilidade = "ALTA"
      recomendacao = `O imóvel atende aos requisitos obrigatórios (mesma bacia federal e UC de Proteção Integral). A sub-bacia é diferente (intervenção: ${siglaIntervencao || "?"}, proposta: ${siglaProposta || "?"}), mas isso é apenas preferencial.`
    }

    const criterios = [
      {
        nome: "Área em UC de Proteção Integral",
        obrigatorio: true,
        atendido: emUCPI,
        detalhe: emUCPI
          ? `${ucProtecaoIntegral!.nome} (${ucProtecaoIntegral!.percentual_sobreposicao ?? "?"}% de sobreposição)`
          : "Área não está em UC de Proteção Integral",
      },
      {
        nome: "Mesma bacia hidrográfica de rio federal",
        obrigatorio: true,
        atendido: mesmaBaciaFederal,
        detalhe: `Intervenção: ${baciaFederalIntervencao || "não identificada"} — Proposta: ${baciaFederalProposta || "não identificada"}`,
      },
      {
        nome: "Mesma sub-bacia hidrográfica",
        obrigatorio: false,
        atendido: mesmaSubBacia,
        detalhe: `Intervenção: ${siglaIntervencao || "não identificada"} (${baciaIntervencao?.bacia?.nome || "?"}) — Proposta: ${siglaProposta || "não identificada"} (${baciaProposta?.bacia?.nome || "?"})`,
      },
    ]

    // ============================================
    // PIPELINE DE MATRÍCULA (análise documental)
    // ============================================

    const opcoesUC = {
      imovelEmUC: emUCPI,
      nomeUC: ucProtecaoIntegral?.nome ?? null,
      categoriaUC: ucProtecaoIntegral?.categoria ?? null,
      percentualSobreposicao: ucProtecaoIntegral?.percentual_sobreposicao ?? null,
    }

    const pipelineMatricula = await analisarMatriculaPipeline(matriculaBuffer, opcoesUC)

    // Salvar dados extraídos
    await admin.from("documentos")
      .update({ dados_extraidos: pipelineMatricula })
      .eq("consulta_id", consultaId)
      .eq("tipo", "matricula")

    // Área padronizada (da área proposta)
    const areaPropostaHa = resultadoProposta.areaHa ? parseFloat(resultadoProposta.areaHa.toFixed(2)) : null
    const areaIntervencaoHa = resultadoIntervencao.areaHa ? parseFloat(resultadoIntervencao.areaHa.toFixed(2)) : null

    // VTN
    const municipioVTN = municipio || pipelineMatricula.imovel.municipio || ""
    const vtn = consultarVTN(municipioVTN, "MG")
    if (vtn.encontrado && vtn.valor_referencia && areaPropostaHa && areaPropostaHa > 0) {
      vtn.valor_estimado = Math.round(vtn.valor_referencia * areaPropostaHa * 100) / 100
      vtn.area_hectares = areaPropostaHa
    }

    // ============================================
    // MONTAR RESPOSTA
    // ============================================

    const pm = pipelineMatricula
    const parecer = {
      tipo: "APP — Destinação em UC",
      base_legal: "Art. 75, IV, Decreto Estadual nº 47.749/2019",

      // Duas áreas
      area_intervencao: {
        area_ha: areaIntervencaoHa,
        bacia: baciaIntervencao?.bacia || null,
        geojson: resultadoIntervencao.geojson || null,
        bbox: resultadoIntervencao.bbox || null,
        centroide: resultadoIntervencao.centroide || null,
      },
      area_proposta: {
        area_ha: areaPropostaHa,
        bacia: baciaProposta?.bacia || null,
        geojson: resultadoProposta.geojson || null,
        bbox: resultadoProposta.bbox || null,
        centroide: resultadoProposta.centroide || null,
        em_uc_pi: emUCPI,
        uc: ucProtecaoIntegral || null,
        ucs_encontradas: resultadoGeo.ucs_encontradas,
      },

      // Critérios e viabilidade
      criterios,
      viabilidade,
      recomendacao,

      // Dados do imóvel (matrícula)
      imovel: {
        nome: nomeImovel || pm.imovel.denominacao,
        municipio: municipio || pm.imovel.municipio,
        estado: "MG",
        matricula: pm.imovel.matricula,
        cartorio: pm.imovel.cartorio,
        ccir: pm.imovel.ccir,
        nirf: pm.imovel.nirf,
        car: pm.imovel.car,
        georreferenciamento: pm.imovel.georreferenciamento,
      },
      proprietarios: pm.proprietarios_atuais.map((p) => ({
        nome: p.nome,
        percentual: p.percentual || null,
        estado_civil: p.estado_civil || null,
        conjuge: p.conjuge || null,
      })),
      outorga_conjugal: pm.outorga_conjugal,
      onus_gravames: pm.onus_ativos.map((o) => ({
        tipo: o.tipo,
        nivel: o.nivel,
        nivel_descricao: o.nivel_descricao,
        numero_averbacao: o.ato,
        descricao: o.descricao,
        impacto_compra_venda: o.impacto_transmissao,
      })),
      onus_extintos: pm.onus_extintos,
      semaforo: pm.semaforo,
      semaforo_justificativa: pm.semaforo_justificativa,
      analise_transmissibilidade: pm.analise_transmissibilidade,
      recomendacoes_matricula: pm.recomendacoes,
      documentos_faltantes: pm.documentos_faltantes,
      alertas_matricula: pm.alertas,
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

      // VTN
      vtn: vtn.encontrado ? {
        encontrado: true,
        municipio: vtn.municipio,
        valor_referencia: vtn.valor_referencia,
        valor_estimado: vtn.valor_estimado,
        exercicio: vtn.exercicio,
      } : null,

      tokens: pm.tokens_consumidos,
    }

    // Gerar parecer PDF (específico para APP)
    let parecerPdfPath: string | null = null
    try {
      const { gerarParecerAppPDF } = await import("@/lib/services/parecer-app-pdf")
      const pdfBuffer = await gerarParecerAppPDF({
        nomeImovel: nomeImovel || pm.imovel.denominacao || "",
        municipio: municipio || pm.imovel.municipio || "",
        estado: "MG",
        viabilidade,
        recomendacao,
        baseLegal: "Art. 75, IV, Decreto Estadual nº 47.749/2019",
        criterios,
        areaIntervencao: {
          area_ha: areaIntervencaoHa,
          bacia: baciaIntervencao?.bacia || null,
        },
        areaProposta: {
          area_ha: areaPropostaHa,
          bacia: baciaProposta?.bacia || null,
          uc: ucProtecaoIntegral ? {
            nome: ucProtecaoIntegral.nome,
            categoria: ucProtecaoIntegral.categoria,
            protecao_integral: ucProtecaoIntegral.protecao_integral,
            percentual_sobreposicao: ucProtecaoIntegral.percentual_sobreposicao ?? null,
          } : null,
        },
        pipeline: pm,
        cnd: resultadoCND ? {
          tipo: resultadoCND.tipo,
          cib: resultadoCND.cib,
          data_validade: resultadoCND.data_validade,
          area_hectares: resultadoCND.area_hectares,
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
    console.error("Erro na consulta dest-uc-app:", error)

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
