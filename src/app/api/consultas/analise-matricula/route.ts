import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { creditos } from "@/lib/creditos"
import { analisarCND } from "@/lib/services/analise-documental"
import type { ResultadoAnalise, DadosMatricula } from "@/lib/services/analise-documental"
import { analisarMatriculaPipeline } from "@/lib/services/analise-matricula"
import type { ResultadoPipeline } from "@/lib/services/analise-matricula"
import { calcularMVAR, consultarVTN } from "@/lib/services/mvar"
import { analisarImovelIDESisema, processarKML, processarGeoJSON } from "@/lib/services/analise-geoespacial"
import type { ResultadoIDESisema } from "@/lib/services/analise-geoespacial"

const CUSTO_CREDITOS = 5
const FERRAMENTA_ID = "analise-matricula"

function pipelineParaMVAR(pm: ResultadoPipeline): ResultadoAnalise<DadosMatricula> {
  return {
    sucesso: true,
    dados: {
      matricula: pm.imovel.matricula, cartorio: pm.imovel.cartorio,
      data_emissao: pm.imovel.data_abertura, dias_desde_emissao: null,
      proprietarios: pm.proprietarios_atuais.map((p) => ({
        nome: p.nome, percentual: p.percentual ?? 0, cpf_cnpj: p.cpf,
        estado_civil: p.estado_civil, conjuge: p.conjuge, regime_bens: p.regime_bens,
      })),
      onus_gravames: pm.onus_ativos.map((o) => ({
        tipo: o.tipo, numero_averbacao: o.ato, descricao: o.descricao,
        valor: o.valor ? String(o.valor) : null, credor: o.credor, data: o.data,
        impacto_compra_venda: o.impacto_transmissao,
      })),
      area_hectares: pm.imovel.area_ha, ccir: pm.imovel.ccir,
      codigo_imovel_incra: pm.imovel.codigo_incra, nirf: pm.imovel.nirf,
      municipio: pm.imovel.municipio, estado: pm.imovel.uf, alertas: pm.alertas,
    },
  }
}

/**
 * POST /api/consultas/analise-matricula
 *
 * Análise de Matrícula — documental pura
 * Pipeline v3 (3 LLM) + MVAR (4 dimensões) + VTN
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
    const kmlFile = formData.get("kml") as File | null  // opcional — sobreposição com UCs

    if (!matriculaFile) return NextResponse.json({ erro: "Matrícula (PDF) é obrigatória." }, { status: 400 })

    // Debitar
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
    if (kmlFile) await uploadFile(kmlFile, "kml")

    // Análise geoespacial (opcional — se KML enviado)
    let resultadoGeo: ResultadoIDESisema | null = null
    if (kmlFile) {
      const kmlContent = Buffer.from(await kmlFile.arrayBuffer()).toString("utf-8")
      const kmlNome = kmlFile.name.toLowerCase()
      const resultadoKML = kmlNome.endsWith(".geojson") || kmlNome.endsWith(".json")
        ? processarGeoJSON(kmlContent)
        : await processarKML(kmlContent)

      if (resultadoKML.sucesso) {
        resultadoGeo = await analisarImovelIDESisema(kmlContent)
      }
    }

    // Pipeline matrícula + CND em paralelo
    const opcoesUC = resultadoGeo ? {
      imovelEmUC: resultadoGeo.ucs_encontradas.some((uc) => uc.protecao_integral),
      nomeUC: resultadoGeo.ucs_encontradas.find((uc) => uc.protecao_integral)?.nome ?? null,
      categoriaUC: resultadoGeo.ucs_encontradas.find((uc) => uc.protecao_integral)?.categoria ?? null,
      percentualSobreposicao: resultadoGeo.ucs_encontradas.find((uc) => uc.protecao_integral)?.percentual_sobreposicao ?? null,
    } : {}

    const [pipelineMatricula, resultadoCND] = await Promise.all([
      analisarMatriculaPipeline(matriculaBuffer, opcoesUC),
      cndBuffer ? analisarCND(cndBuffer) : Promise.resolve(null),
    ])

    await admin.from("documentos").update({ dados_extraidos: pipelineMatricula }).eq("consulta_id", consultaId).eq("tipo", "matricula")

    // MVAR
    const dadosMVAR = pipelineParaMVAR(pipelineMatricula)
    const mvarResult = await calcularMVAR(dadosMVAR, resultadoCND, null, {
      tipoOperacao: "analise_matricula", municipio: municipio || pipelineMatricula.imovel.municipio || "",
      areaPadronizada: pipelineMatricula.imovel.area_ha ?? undefined,
    })

    // VTN
    const municipioVTN = municipio || pipelineMatricula.imovel.municipio || ""
    const vtn = consultarVTN(municipioVTN, "MG")
    if (vtn.encontrado && vtn.valor_referencia && pipelineMatricula.imovel.area_ha && pipelineMatricula.imovel.area_ha > 0) {
      vtn.valor_estimado = Math.round(vtn.valor_referencia * pipelineMatricula.imovel.area_ha * 100) / 100
    }

    // Resposta
    const pm = pipelineMatricula
    const parecer = {
      tipo: "Análise de Matrícula",
      imovel: {
        nome: nomeImovel || pm.imovel.denominacao, municipio: municipio || pm.imovel.municipio, estado: "MG",
        area_hectares: pm.imovel.area_ha, matricula: pm.imovel.matricula, cartorio: pm.imovel.cartorio,
        comarca: pm.imovel.comarca, ccir: pm.imovel.ccir, nirf: pm.imovel.nirf,
        codigo_incra: pm.imovel.codigo_incra, car: pm.imovel.car,
        georreferenciamento: pm.imovel.georreferenciamento,
        georef_certificacao: pm.imovel.georef_certificacao,
      },
      proprietarios: pm.proprietarios_atuais.map((p) => ({
        nome: p.nome, percentual: p.percentual || null, cpf: p.cpf,
        estado_civil: p.estado_civil, conjuge: p.conjuge, regime_bens: p.regime_bens,
        ato_aquisitivo: p.ato_aquisitivo,
      })),
      outorga_conjugal: pm.outorga_conjugal,
      georeferenciamento: pm.georeferenciamento,
      onus_gravames: pm.onus_ativos.map((o) => ({
        tipo: o.tipo, nivel: o.nivel, nivel_descricao: o.nivel_descricao,
        numero_averbacao: o.ato, descricao: o.descricao, impacto: o.impacto_transmissao,
      })),
      onus_extintos: pm.onus_extintos,
      restricoes_ambientais: pm.restricoes_ambientais,
      analise_transmissibilidade: pm.analise_transmissibilidade,
      semaforo: pm.semaforo, semaforo_justificativa: pm.semaforo_justificativa,
      recomendacoes: pm.recomendacoes, documentos_faltantes: pm.documentos_faltantes,
      alertas: pm.alertas, confianca_ocr: pm.imovel.confianca_ocr,
      cnd: resultadoCND ? { tipo: resultadoCND.tipo, cib: resultadoCND.cib, data_emissao: resultadoCND.data_emissao, data_validade: resultadoCND.data_validade, area_hectares: resultadoCND.area_hectares, nome_contribuinte: resultadoCND.nome_contribuinte } : null,
      mvar: mvarResult,
      vtn: vtn.encontrado ? { encontrado: true, municipio: vtn.municipio, valor_referencia: vtn.valor_referencia, valor_estimado: vtn.valor_estimado, exercicio: vtn.exercicio } : null,
      // Geoespacial (opcional — se KML enviado)
      ide_sisema: resultadoGeo ? {
        sucesso: resultadoGeo.sucesso,
        ucs: resultadoGeo.ucs_encontradas,
        total_ucs: resultadoGeo.total_ucs,
        bbox: resultadoGeo.bbox,
        centroide: resultadoGeo.centroide,
      } : null,
      tokens: pm.tokens_consumidos,
    }

    // PDF
    let parecerPdfPath: string | null = null
    try {
      const { gerarParecerPDF } = await import("@/lib/services/parecer-pdf")
      const pdfBuffer = await gerarParecerPDF({
        nomeImovel: nomeImovel || pm.imovel.denominacao || "", municipio: municipio || pm.imovel.municipio || "",
        estado: "MG", areaHa: pm.imovel.area_ha || 0, areaFonte: "Matrícula",
        ferramenta: FERRAMENTA_ID, pipeline: pm, mvar: mvarResult, ideSisema: resultadoGeo,
        cnd: resultadoCND ? { tipo: resultadoCND.tipo, cib: resultadoCND.cib, data_emissao: resultadoCND.data_emissao, data_validade: resultadoCND.data_validade, area_hectares: resultadoCND.area_hectares, nome_contribuinte: resultadoCND.nome_contribuinte } : null,
        vtn: vtn.encontrado ? { encontrado: true, municipio: vtn.municipio ?? null, valor_referencia: vtn.valor_referencia ?? null, valor_estimado: vtn.valor_estimado ?? null, exercicio: vtn.exercicio ?? null } : null,
      })
      const pdfPath = `${user.id}/${consultaId}/parecer.pdf`
      await admin.storage.from("documentos").upload(pdfPath, pdfBuffer, { contentType: "application/pdf", upsert: true })
      parecerPdfPath = pdfPath
    } catch (erroPdf) {
      console.error("Erro ao gerar parecer PDF Matrícula:", erroPdf)
    }

    await admin.from("consultas").update({
      status: "concluida", parecer_json: parecer, parecer_pdf_path: parecerPdfPath,
      area_hectares: pm.imovel.area_ha, updated_at: new Date().toISOString(),
    }).eq("id", consultaId)

    const saldoAtual = (resultadoDebito.saldo_restante ?? 0) + CUSTO_CREDITOS
    return NextResponse.json({ sucesso: true, consulta_id: consultaId, status: "concluida", parecer, creditos_restantes: saldoAtual - CUSTO_CREDITOS })

  } catch (error) {
    console.error("Erro na consulta analise-matricula:", error)
    if (creditosDebitados) {
      await creditos.reembolsar(user.id, CUSTO_CREDITOS, { descricao: `Reembolso — erro ${consultaId || "?"}`, consulta_id: consultaId || undefined })
    }
    return NextResponse.json({ erro: "Erro ao processar consulta. Créditos reembolsados.", detalhes: (error as Error).message }, { status: 500 })
  }
}
