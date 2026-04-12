/**
 * Parecer PDF — Análise de Matrícula
 *
 * PDF dedicado para análise documental pura.
 * Espelha exatamente o conteúdo da página de resultado.
 * SEM seções de destinação em UC, geoespacial ou compensação.
 *
 * Design: AlertResultPDF (fundo neutro + badge).
 */

import { renderToBuffer } from "@react-pdf/renderer"
import "@/lib/pdf/fonts"
import { Document, Capa, Pagina, Secao, styles, cores } from "@/lib/pdf/template"
import { Text, View } from "@react-pdf/renderer"
import type { ResultadoPipeline } from "./analise-matricula"
import type { ResultadoMVAR } from "./mvar"
import type { ResultadoIDESisema } from "./analise-geoespacial"

// Tipos

export interface DadosParecerMatricula {
  nomeImovel: string
  municipio: string
  estado: string
  pipeline: ResultadoPipeline
  mvar: ResultadoMVAR | null
  ideSisema: ResultadoIDESisema | null
  cnd: { tipo: string | null; cib: string | null; data_emissao: string | null; data_validade: string | null; area_hectares: number | null; nome_contribuinte: string | null } | null
  vtn: { encontrado: boolean; municipio: string | null; valor_referencia: number | null; valor_estimado: number | null; exercicio: number | string | null } | null
}

// Auxiliares

function Campo({ label, valor }: { label: string; valor: string }) {
  if (!valor || valor === "—") return <View />
  return (
    <View style={{ flexDirection: "row", marginBottom: 3 }}>
      <Text style={{ fontSize: 8, color: cores.neutral500, width: 120 }}>{label}:</Text>
      <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 600, color: cores.neutral800, flex: 1 }}>{valor}</Text>
    </View>
  )
}

function AlertResultPDF({ label, cor, children }: { label: string; cor: string; children: React.ReactNode }) {
  return (
    <View style={{ padding: 10, backgroundColor: cores.neutral50, borderRadius: 6, marginBottom: 6, borderWidth: 0.5, borderColor: cores.neutral200 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
        <View style={{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: cor, borderRadius: 4 }}>
          <Text style={{ fontSize: 7, fontFamily: "Source Sans 3", fontWeight: 700, color: "#fff" }}>{label}</Text>
        </View>
      </View>
      <View>{children}</View>
    </View>
  )
}

// Gerar PDF

export async function gerarParecerMatriculaPDF(dados: DadosParecerMatricula): Promise<Buffer> {
  const dataFormatada = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  const pm = dados.pipeline
  const mvar = dados.mvar

  const pontuacao = mvar?.pontuacao?.total ?? 0
  const labelMvar = mvar?.classificacao?.label || "—"

  const pdf = (
    <Document>
      <Capa
        ferramenta="Análise de Matrícula"
        descricao={`Avaliação de viabilidade registral e documental. Imóvel: ${dados.nomeImovel || "N/I"}, ${dados.municipio || "N/I"}/${dados.estado}. Área: ${pm.imovel.area_ha ? pm.imovel.area_ha.toFixed(2) + " ha" : "N/I"}.`}
        data={dataFormatada}
      />

      {/* PÁGINA 1: MVAR + DADOS DO IMÓVEL */}
      <Pagina ferramenta="analise-matricula">
        {/* MVAR resultado */}
        {mvar && (
          <AlertResultPDF label={labelMvar} cor={pontuacao >= 90 ? cores.success : pontuacao >= 60 ? cores.warning : cores.error}>
            <Text style={{ fontSize: 9, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>
              Análise de Matrícula — {dados.nomeImovel || dados.municipio || "Imóvel"}
            </Text>
            <Text style={{ fontSize: 8, color: cores.neutral700, lineHeight: 1.5, marginTop: 2 }}>
              {mvar.classificacao?.acao || ""} {mvar.resumo || ""}
            </Text>
          </AlertResultPDF>
        )}

        {/* Disclaimer */}
        <AlertResultPDF label="Preliminar" cor={cores.warning}>
          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5 }}>
            Este relatório é uma pré-avaliação automatizada e não constitui parecer jurídico ou técnico. Os dados extraídos por IA devem ser conferidos com os documentos originais.{pm.imovel.confianca_ocr === "baixa" ? " ATENÇÃO: documento com baixa legibilidade — conferir dados numéricos." : ""}
          </Text>
        </AlertResultPDF>

        {/* Vetos */}
        {pm.onus_ativos.filter((o) => o.nivel === 1).length > 0 && (
          <Secao titulo="Impedimentos Identificados">
            {pm.onus_ativos.filter((o) => o.nivel === 1).map((o, i) => (
              <AlertResultPDF key={i} label="VETO" cor={cores.error}>
                <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>{o.tipo}</Text>
                <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5 }}>{o.impacto_transmissao}</Text>
              </AlertResultPDF>
            ))}
          </Secao>
        )}

        {/* MVAR Dimensões */}
        {mvar?.dimensoes && (
          <Secao titulo="Avaliação de Viabilidade (MVAR)">
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: cores.primary600, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                <Text style={{ fontSize: 14, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.primary600 }}>{pontuacao}</Text>
                <Text style={{ fontSize: 6, color: cores.neutral500 }}>de {mvar?.pontuacao?.maximo ?? 100}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 9, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>{labelMvar}</Text>
              </View>
            </View>
            {Object.entries(mvar.dimensoes).map(([key, dim]) => {
              const d = dim as { pontos: number; peso: number; percentual: number }
              const nomes: Record<string, string> = { juridica: "Jurídica", fiscal: "Fiscal", titularidade: "Titularidade", tecnica: "Técnica" }
              return (
                <View key={key} style={{ flexDirection: "row", marginBottom: 3, alignItems: "center" }}>
                  <Text style={{ fontSize: 7, flex: 1, color: cores.neutral700 }}>{nomes[key] || key} ({d.peso} pontos)</Text>
                  <Text style={{ fontSize: 7, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800, width: 40, textAlign: "right" }}>{d.pontos}/{d.peso}</Text>
                </View>
              )
            })}
          </Secao>
        )}

        {/* Dados do Imóvel */}
        <Secao titulo="Dados do Imóvel">
          <Campo label="Nome" valor={dados.nomeImovel || pm.imovel.denominacao || "—"} />
          <Campo label="Município/UF" valor={`${dados.municipio || pm.imovel.municipio || "—"}/${dados.estado}`} />
          <Campo label="Área" valor={pm.imovel.area_ha ? `${pm.imovel.area_ha.toFixed(2)} ha` : "—"} />
          <Campo label="Matrícula" valor={pm.imovel.matricula || "—"} />
          <Campo label="Cartório" valor={pm.imovel.cartorio || "—"} />
          <Campo label="Comarca" valor={pm.imovel.comarca || "—"} />
          <Campo label="CCIR" valor={pm.imovel.ccir || "—"} />
          <Campo label="NIRF" valor={pm.imovel.nirf || "—"} />
          <Campo label="CAR" valor={pm.imovel.car || "—"} />
          <Campo label="INCRA" valor={pm.imovel.codigo_incra || "—"} />
          <Campo label="Georreferenciamento" valor={pm.imovel.georreferenciamento ? "Sim" : "Não identificado"} />
          {pm.imovel.georef_certificacao && <Campo label="Certificação" valor={pm.imovel.georef_certificacao} />}
        </Secao>
      </Pagina>

      {/* PÁGINA 2: PROPRIETÁRIOS + ÔNUS + GEOREF + CND */}
      <Pagina ferramenta="analise-matricula">
        {/* Proprietários */}
        <Secao titulo="Proprietários">
          {pm.proprietarios_atuais.length > 0 ? pm.proprietarios_atuais.map((p, i) => (
            <View key={i} style={{ padding: 6, backgroundColor: cores.neutral50, borderRadius: 4, marginBottom: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                <Text style={{ fontSize: 9, fontFamily: "Source Sans 3", fontWeight: 700, flex: 1 }}>{p.nome}</Text>
                <Text style={{ fontSize: 9, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.accent }}>{p.percentual != null ? `${p.percentual}%` : "?%"}</Text>
              </View>
              {p.cpf && <Text style={{ fontSize: 7, color: cores.neutral500 }}>CPF: {p.cpf}</Text>}
              {p.estado_civil && <Text style={{ fontSize: 7, color: cores.neutral500 }}>{p.estado_civil}{p.conjuge ? ` — cônjuge: ${p.conjuge}` : ""}{p.regime_bens ? ` (${p.regime_bens})` : ""}</Text>}
            </View>
          )) : <Text style={styles.textoMuted}>Nenhum proprietário identificado.</Text>}
        </Secao>

        {/* Outorga */}
        {pm.outorga_conjugal.some((o) => o.exige_outorga || o.observacao) && (
          <Secao titulo="Outorga Conjugal">
            {pm.outorga_conjugal.filter((o) => o.exige_outorga || o.observacao).map((o, i) => (
              <AlertResultPDF key={i} label={o.exige_outorga ? "Pendências" : "Informação"} cor={o.exige_outorga ? cores.warning : cores.info}>
                <Text style={{ fontSize: 8, color: cores.neutral700 }}>{o.nome}: {o.exige_outorga ? `exige outorga do cônjuge ${o.conjuge || "(não identificado)"}` : ""} {o.observacao || ""}</Text>
              </AlertResultPDF>
            ))}
          </Secao>
        )}

        {/* Ônus */}
        <Secao titulo="Ônus e Gravames">
          {pm.onus_ativos.length === 0 ? (
            <AlertResultPDF label="Adequado" cor={cores.success}>
              <Text style={{ fontSize: 8, color: cores.neutral700 }}>Nenhum ônus ou gravame ativo — situação registral favorável.</Text>
            </AlertResultPDF>
          ) : pm.onus_ativos.map((o, i) => (
            <AlertResultPDF key={i} label={o.nivel === 1 ? "VETO" : "Pendências"} cor={o.nivel === 1 ? cores.error : cores.warning}>
              <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>{o.tipo} ({o.ato})</Text>
              <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5 }}>{o.impacto_transmissao}</Text>
            </AlertResultPDF>
          ))}
          {pm.onus_extintos.length > 0 && (
            <View style={{ marginTop: 4 }}>
              <Text style={{ fontSize: 7, color: cores.neutral500, marginBottom: 2 }}>Ônus Extintos:</Text>
              {pm.onus_extintos.map((o, i) => (
                <Text key={i} style={{ fontSize: 7, color: cores.neutral500 }}>✓ {o.tipo} ({o.ato}) — cancelado por {o.cancelado_por}</Text>
              ))}
            </View>
          )}
        </Secao>

        {/* Georef */}
        <Secao titulo="Georreferenciamento">
          <AlertResultPDF label={pm.georeferenciamento.situacao === "regular" ? "Adequado" : "Pendências"} cor={pm.georeferenciamento.situacao === "regular" ? cores.success : cores.warning}>
            <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>{pm.georeferenciamento.situacao === "regular" ? "Regular" : "Pendente"}</Text>
            <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5 }}>{pm.georeferenciamento.impacto || "Georreferenciamento existente e em conformidade."}</Text>
            <Text style={{ fontSize: 7, color: cores.neutral500, marginTop: 2 }}>Prazo: {pm.georeferenciamento.prazo_legal}</Text>
          </AlertResultPDF>
        </Secao>

        {/* CND */}
        <Secao titulo="Análise Fiscal — CND-ITR">
          {dados.cnd ? (
            <View>
              <Campo label="Tipo" valor={dados.cnd.tipo || "—"} />
              <Campo label="CIB" valor={dados.cnd.cib || "—"} />
              <Campo label="Contribuinte" valor={dados.cnd.nome_contribuinte || "—"} />
              <Campo label="Área" valor={dados.cnd.area_hectares ? `${dados.cnd.area_hectares} ha` : "—"} />
              <Campo label="Validade" valor={dados.cnd.data_validade ? new Date(dados.cnd.data_validade).toLocaleDateString("pt-BR") : "—"} />
            </View>
          ) : (
            <AlertResultPDF label="Informação" cor={cores.info}>
              <Text style={{ fontSize: 8, color: cores.neutral700 }}>CND-ITR não apresentada.</Text>
            </AlertResultPDF>
          )}
        </Secao>
      </Pagina>

      {/* PÁGINA 3: UC + TRANSMISSIBILIDADE + VTN + NOTA */}
      <Pagina ferramenta="analise-matricula">
        {/* UCs (se KML enviado) */}
        {dados.ideSisema && dados.ideSisema.ucs_encontradas.length > 0 && (
          <Secao titulo="Localização em Unidade de Conservação">
            {dados.ideSisema.ucs_encontradas.map((uc, i) => (
              <AlertResultPDF key={i} label={uc.protecao_integral ? "Proteção Integral" : "Uso Sustentável"} cor={uc.protecao_integral ? cores.warning : cores.success}>
                <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>{uc.nome}</Text>
                <Text style={{ fontSize: 7, color: cores.neutral700 }}>{uc.categoria}</Text>
                {uc.percentual_sobreposicao != null && (
                  <Text style={{ fontSize: 7, color: cores.neutral700 }}>{uc.percentual_sobreposicao}% do imóvel{uc.area_sobreposicao_ha != null ? ` (${uc.area_sobreposicao_ha} ha)` : ""}</Text>
                )}
              </AlertResultPDF>
            ))}
          </Secao>
        )}

        {dados.ideSisema && dados.ideSisema.ucs_encontradas.length === 0 && (
          <Secao titulo="Localização em Unidade de Conservação">
            <AlertResultPDF label="Adequado" cor={cores.success}>
              <Text style={{ fontSize: 8, color: cores.neutral700 }}>Nenhuma UC identificada na área do imóvel.</Text>
            </AlertResultPDF>
          </Secao>
        )}

        {/* Transmissibilidade */}
        {pm.analise_transmissibilidade && (
          <Secao titulo="Análise de Transmissibilidade">
            <Text style={{ fontSize: 8, color: cores.neutral700, lineHeight: 1.5, marginBottom: 6 }}>{pm.analise_transmissibilidade.resumo}</Text>
            {pm.analise_transmissibilidade.impedimentos.length > 0 && pm.analise_transmissibilidade.impedimentos.map((imp, i) => (
              <AlertResultPDF key={i} label="VETO" cor={cores.error}>
                <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>{imp.descricao}</Text>
                <Text style={{ fontSize: 7, color: cores.neutral700 }}>Fundamentação: {imp.fundamentacao}</Text>
              </AlertResultPDF>
            ))}
            {pm.analise_transmissibilidade.diligencias_recomendadas.length > 0 && (
              <View style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800, marginBottom: 2 }}>Diligências Recomendadas</Text>
                {pm.analise_transmissibilidade.diligencias_recomendadas.map((d, i) => (
                  <Text key={i} style={{ fontSize: 7, color: cores.neutral700, marginBottom: 2 }}>• {d}</Text>
                ))}
              </View>
            )}
          </Secao>
        )}

        {/* VTN */}
        {dados.vtn?.encontrado && (
          <Secao titulo="Valor de Referência (VTN)">
            <Campo label="Município" valor={dados.vtn.municipio || "—"} />
            <Campo label="R$/ha" valor={dados.vtn.valor_referencia ? `R$ ${dados.vtn.valor_referencia.toLocaleString("pt-BR")}` : "—"} />
            <Campo label="Valor estimado" valor={dados.vtn.valor_estimado ? `R$ ${dados.vtn.valor_estimado.toLocaleString("pt-BR")}` : "—"} />
            <Text style={[styles.textoMuted, { marginTop: 3 }]}>Fonte: SIPT/Receita Federal. Valor referencial, não substitui laudo de avaliação.</Text>
          </Secao>
        )}

        {/* Nota */}
        <Secao titulo="NOTA SOBRE ESTA ANÁLISE">
          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 6 }}>
            Este relatório constitui análise preliminar automatizada e não constitui parecer jurídico ou técnico.
          </Text>
          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 4 }}>
            <Text style={{ fontFamily: "Source Sans 3", fontWeight: 700 }}>Extração de dados: </Text>
            A extração de dados da matrícula e da CND é realizada por leitura automatizada dos documentos. Documentos em formato digital editável (PDF texto) apresentam maior confiabilidade. Documentos digitalizados por scanner (PDF imagem) dependem de reconhecimento óptico (OCR), o que pode gerar erros de leitura. Recomenda-se conferir os valores extraídos com os documentos originais.
          </Text>
          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 4 }}>
            <Text style={{ fontFamily: "Source Sans 3", fontWeight: 700 }}>Análise documental (MVAR): </Text>
            A análise de ônus, gravames, situação fiscal e titularidade é baseada em dados declarados e não substitui diligência jurídica completa ou parecer elaborado por advogado com responsabilidade técnica.
          </Text>
          {dados.ideSisema && (
            <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 4 }}>
              <Text style={{ fontFamily: "Source Sans 3", fontWeight: 700 }}>Sobreposição com UC: </Text>
              Calculada por interseção geométrica entre o polígono do imóvel e os limites das Unidades de Conservação (IDE-Sisema). Imprecisões nos limites oficiais podem afetar o percentual calculado.
            </Text>
          )}
          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 6 }}>
            <Text style={{ fontFamily: "Source Sans 3", fontWeight: 700 }}>Fontes: </Text>
            Dados declarados pelo solicitante — IDE-Sisema (SEMAD/IEF/IGAM) — SIPT/Receita Federal (VTN).
          </Text>
          <View style={{ borderTopWidth: 0.5, borderTopColor: cores.neutral200, paddingTop: 8 }}>
            <Text style={{ fontSize: 7, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>ACAM — Análise de Compensação Ambiental</Text>
            <Text style={{ fontSize: 7, color: cores.neutral500 }}>Vieira Castro Advogados — acam.com.br</Text>
            <Text style={{ fontSize: 7, color: cores.neutral500, marginTop: 2 }}>Documento gerado em {dataFormatada}.</Text>
          </View>
        </Secao>
      </Pagina>
    </Document>
  )

  const buffer = await renderToBuffer(pdf)
  return Buffer.from(buffer)
}
