/**
 * Parecer PDF — Destinação em UC — APP
 *
 * PDF específico para compensação APP (art. 75, IV, Decreto 47.749/2019).
 * Estrutura: Viabilidade → Critérios → Comparação de Áreas → Dados da Matrícula
 *
 * Usa template ACAM2 (Capa, Pagina, Secao) conforme regra 9 do CLAUDE.md.
 * Cores via `cores` e `styles` do template — zero hardcoded.
 */

import { renderToBuffer } from "@react-pdf/renderer"
import "@/lib/pdf/fonts"
import {
  Document,
  Capa,
  Pagina,
  Secao,
  styles,
  cores,
} from "@/lib/pdf/template"
import { Text, View } from "@react-pdf/renderer"
import type { ResultadoPipeline } from "./analise-matricula"

// ============================================
// TIPOS
// ============================================

interface Bacia {
  sigla: string | null
  nome: string | null
  bacia_federal: string | null
  comite: string | null
  sede_comite?: string | null
}

interface Criterio {
  nome: string
  obrigatorio: boolean
  atendido: boolean
  detalhe: string
}

interface UC {
  nome: string
  categoria: string
  protecao_integral: boolean
  percentual_sobreposicao: number | null
}

export interface DadosParecerApp {
  nomeImovel: string
  municipio: string
  estado: string
  viabilidade: "ALTA" | "BAIXA"
  recomendacao: string
  baseLegal: string
  criterios: Criterio[]
  areaIntervencao: { area_ha: number | null; bacia: Bacia | null }
  areaProposta: { area_ha: number | null; bacia: Bacia | null; uc: UC | null }
  pipeline: ResultadoPipeline
  cnd: {
    tipo: string | null
    cib: string | null
    data_validade: string | null
    area_hectares: number | null
  } | null
  vtn: {
    encontrado: boolean
    municipio: string | null
    valor_referencia: number | null
    valor_estimado: number | null
    exercicio: number | string | null
  } | null
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function Se(cond: unknown, el: React.JSX.Element): React.JSX.Element {
  return cond ? el : <View />
}

function Campo({ label, valor }: { label: string; valor: string }) {
  if (!valor || valor === "—") return <View />
  return (
    <View style={{ flexDirection: "row", marginBottom: 3 }}>
      <Text style={{ fontSize: 8, color: cores.neutral500, width: 120 }}>{label}:</Text>
      <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 600, color: cores.neutral800, flex: 1 }}>{valor}</Text>
    </View>
  )
}

/** Fundo neutro + badge pequeno (espelha AlertResult do web) */
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

function ViabilidadeBadge({ viabilidade, recomendacao }: { viabilidade: string; recomendacao: string }) {
  const isAlta = viabilidade === "ALTA"
  return (
    <AlertResultPDF label={isAlta ? "Viabilidade Alta" : "Viabilidade Baixa"} cor={isAlta ? cores.success : cores.error}>
      <Text style={{ fontSize: 9, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800, marginBottom: 3 }}>
        Compensação APP — Destinação em UC.
      </Text>
      <Text style={{ fontSize: 8, color: cores.neutral700, lineHeight: 1.5 }}>{recomendacao}</Text>
    </AlertResultPDF>
  )
}

function CriterioPDF({ criterio }: { criterio: Criterio }) {
  const cor = criterio.atendido ? cores.success : criterio.obrigatorio ? cores.error : cores.warning
  const label = criterio.atendido ? "Atendido" : criterio.obrigatorio ? "Não atendido" : "Preferencial"

  return (
    <AlertResultPDF label={label} cor={cor}>
      <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>
        {criterio.nome}{!criterio.obrigatorio ? " (preferencial)" : ""}
      </Text>
      <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5, marginTop: 2 }}>{criterio.detalhe}</Text>
    </AlertResultPDF>
  )
}

function AreaCard({ titulo, areaHa, bacia, cor, label, uc }: {
  titulo: string
  areaHa: number | null
  bacia: Bacia | null
  cor: string
  label: string
  uc?: UC | null
}) {
  return (
    <View style={{ flex: 1 }}>
      <AlertResultPDF label={label} cor={cor}>
        <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800, marginBottom: 3 }}>
          {titulo}
        </Text>
        {areaHa != null && (
          <Text style={{ fontSize: 11, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800, marginBottom: 4 }}>
            {areaHa.toFixed(2)} ha
          </Text>
        )}
        {bacia && (
          <View>
            {bacia.bacia_federal && (
              <Text style={{ fontSize: 7, color: cores.neutral500 }}>
                Bacia federal: <Text style={{ fontWeight: 700, color: cores.neutral700 }}>{bacia.bacia_federal}</Text>
              </Text>
            )}
            {bacia.sigla && (
              <Text style={{ fontSize: 7, color: cores.neutral500 }}>
                Sub-bacia: <Text style={{ fontWeight: 700, color: cores.neutral700 }}>{bacia.sigla}</Text> ({bacia.nome})
              </Text>
            )}
          </View>
        )}
        {uc && (
          <Text style={{ fontSize: 7, color: cores.neutral700, marginTop: 3 }}>
            UC: {uc.nome} ({uc.percentual_sobreposicao ?? "?"}% sobreposição)
          </Text>
        )}
      </AlertResultPDF>
    </View>
  )
}

// ============================================
// GERAR PARECER APP PDF
// ============================================

export async function gerarParecerAppPDF(dados: DadosParecerApp): Promise<Buffer> {
  const dataFormatada = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  const pm = dados.pipeline

  const pdf = (
    <Document>
      <Capa
        ferramenta="Compensação APP — Destinação em UC"
        descricao={`Análise de viabilidade para doação de área em UC. Imóvel: ${dados.nomeImovel || "N/I"}, ${dados.municipio || "N/I"}/${dados.estado}. ${dados.baseLegal}.`}
        data={dataFormatada}
      />

      {/* PÁGINA 1: VIABILIDADE + CRITÉRIOS + ÁREAS */}
      <Pagina ferramenta="dest-uc-app">
        {/* Disclaimer */}
        <View style={{ padding: 10, backgroundColor: cores.warningBg, borderRadius: 6, marginBottom: 12, borderWidth: 0.5, borderColor: cores.warning }}>
          <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.warning, marginBottom: 3 }}>ANÁLISE PRELIMINAR</Text>
          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5 }}>
            Este relatório é uma pré-avaliação automatizada e não constitui parecer jurídico ou técnico. Os dados extraídos por inteligência artificial devem ser conferidos com os documentos originais.
          </Text>
        </View>

        {/* Viabilidade */}
        <ViabilidadeBadge viabilidade={dados.viabilidade} recomendacao={dados.recomendacao} />

        {/* Critérios */}
        <Secao titulo="1. Critérios Legais">
          <Text style={[styles.textoMuted, { marginBottom: 6 }]}>{dados.baseLegal}</Text>
          {dados.criterios.map((c, i) => (
            <CriterioPDF key={i} criterio={c} />
          ))}
        </Secao>

        {/* Comparação de áreas */}
        <Secao titulo="2. Comparação de Áreas">
          <View style={{ flexDirection: "row" }}>
            <AreaCard
              titulo="Área de Intervenção"
              label="Intervenção"
              areaHa={dados.areaIntervencao.area_ha}
              bacia={dados.areaIntervencao.bacia}
              cor={cores.error}
            />
            <AreaCard
              titulo="Área Proposta para Doação"
              label="Proposta"
              areaHa={dados.areaProposta.area_ha}
              bacia={dados.areaProposta.bacia}
              cor={cores.success}
              uc={dados.areaProposta.uc}
            />
          </View>
        </Secao>
      </Pagina>

      {/* PÁGINA 2: DADOS DA MATRÍCULA */}
      <Pagina ferramenta="dest-uc-app">
        <Secao titulo="3. Dados do Imóvel Proposto">
          <Campo label="Nome" valor={dados.nomeImovel || "—"} />
          <Campo label="Município/UF" valor={`${dados.municipio || pm.imovel.municipio || "—"}/${dados.estado}`} />
          <Campo label="Matrícula" valor={pm.imovel.matricula || "—"} />
          <Campo label="Cartório" valor={pm.imovel.cartorio || "—"} />
          <Campo label="CCIR" valor={pm.imovel.ccir || "—"} />
          <Campo label="NIRF" valor={pm.imovel.nirf || "—"} />
          <Campo label="CAR" valor={pm.imovel.car || "—"} />
          <Campo label="Georreferenciamento" valor={pm.imovel.georreferenciamento ? "Sim" : "Não identificado"} />
        </Secao>

        {/* Proprietários */}
        {pm.proprietarios_atuais.length > 0 && (
          <Secao titulo="4. Proprietários">
            {pm.proprietarios_atuais.map((p, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 3 }}>
                <Text style={{ fontSize: 8, flex: 1, color: cores.neutral800 }}>{p.nome}</Text>
                <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 600, color: cores.neutral700, width: 50, textAlign: "right" }}>
                  {p.percentual ?? "?"}%
                </Text>
              </View>
            ))}
          </Secao>
        )}

        {/* Ônus */}
        <Secao titulo="5. Ônus e Gravames">
          {pm.onus_ativos.length === 0 ? (
            <AlertResultPDF label="Adequado" cor={cores.success}>
              <Text style={{ fontSize: 8, color: cores.neutral700 }}>Nenhum ônus ou gravame ativo — situação registral favorável.</Text>
            </AlertResultPDF>
          ) : (
            pm.onus_ativos.map((o, i) => (
              <AlertResultPDF key={i} label={o.nivel === 1 ? "VETO" : "Pendências"} cor={o.nivel === 1 ? cores.error : cores.warning}>
                <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>{o.tipo}</Text>
                <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5 }}>{o.impacto_transmissao}</Text>
              </AlertResultPDF>
            ))
          )}
        </Secao>

        {/* Transmissibilidade */}
        {Se(pm.analise_transmissibilidade,
          <Secao titulo="6. Análise de Transmissibilidade">
            <Text style={{ fontSize: 8, color: cores.neutral700, lineHeight: 1.5, marginBottom: 6 }}>
              {pm.analise_transmissibilidade?.resumo}
            </Text>
            {(pm.analise_transmissibilidade?.impedimentos || []).length > 0 && (
              <View>
                {pm.analise_transmissibilidade!.impedimentos.map((imp, i) => (
                  <AlertResultPDF key={i} label="VETO" cor={cores.error}>
                    <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>{imp.descricao}</Text>
                    <Text style={{ fontSize: 7, color: cores.neutral700 }}>Fundamentação: {imp.fundamentacao}</Text>
                  </AlertResultPDF>
                ))}
              </View>
            )}
          </Secao>
        )}

        {/* VTN */}
        {Se(dados.vtn?.encontrado,
          <Secao titulo="7. Valor de Referência (VTN)">
            <Campo label="Município" valor={dados.vtn?.municipio || "—"} />
            <Campo label="R$/ha" valor={dados.vtn?.valor_referencia ? `R$ ${dados.vtn.valor_referencia.toLocaleString("pt-BR")}` : "—"} />
            <Campo label="Valor estimado" valor={dados.vtn?.valor_estimado ? `R$ ${dados.vtn.valor_estimado.toLocaleString("pt-BR")}` : "—"} />
            <Text style={[styles.textoMuted, { marginTop: 3 }]}>
              Fonte: SIPT/Receita Federal. Valor referencial, não substitui laudo de avaliação.
            </Text>
          </Secao>
        )}

        {/* Conclusão */}
        <View style={{ marginTop: 12, padding: 8, borderTopWidth: 0.5, borderTopColor: cores.neutral200 }}>
          <Text style={{ fontSize: 7, color: cores.neutral400, lineHeight: 1.5 }}>
            ACAM — Análise de Compensações Ambientais. Esta é uma análise preliminar automatizada. Não constitui parecer jurídico ou técnico e não gera responsabilidade profissional. A viabilidade definitiva da compensação depende de análise por profissional qualificado e aprovação do órgão gestor da Unidade de Conservação. Base legal: {dados.baseLegal}. Documento gerado em {dataFormatada}.
          </Text>
        </View>
      </Pagina>
    </Document>
  )

  const buffer = await renderToBuffer(pdf)
  return Buffer.from(buffer)
}
