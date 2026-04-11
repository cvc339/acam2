/**
 * Geração de Parecer PDF — React-PDF (template ACAM2)
 *
 * Relatório técnico interno do ACAM usando dados do pipeline v3.
 * Usa o template React-PDF (Capa, Pagina, Secao) conforme regra 9 do CLAUDE.md.
 *
 * DESIGN: todas as cores e estilos vêm do template.tsx (design system ACAM2).
 * Nenhuma cor hardcoded — tudo via `cores` e `styles`.
 */

import { renderToBuffer } from "@react-pdf/renderer"
import "@/lib/pdf/fonts"
import {
  Document,
  Capa,
  Pagina,
  Secao,
  CardDestaque,
  styles,
  cores,
} from "@/lib/pdf/template"
import { Text, View } from "@react-pdf/renderer"
import type { ResultadoPipeline } from "./analise-matricula"
import type { ResultadoMVAR } from "./mvar"
import type { ResultadoIDESisema } from "./analise-geoespacial"

// ============================================
// TIPOS
// ============================================

export interface DadosParecer {
  nomeImovel: string
  municipio: string
  estado: string
  areaHa: number
  areaFonte: string
  ferramenta: string
  pipeline: ResultadoPipeline
  mvar: ResultadoMVAR | null
  ideSisema: ResultadoIDESisema | null
  cnd: {
    tipo: string | null
    cib: string | null
    data_emissao: string | null
    data_validade: string | null
    area_hectares: number | null
    nome_contribuinte: string | null
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
// COMPONENTES AUXILIARES (design system ACAM2)
// ============================================

function Se(cond: unknown, el: React.JSX.Element): React.JSX.Element {
  return cond ? el : <View />
}

function Campo({ label, valor }: { label: string; valor: string }) {
  if (!valor || valor === "—") return <View />
  return (
    <View style={{ flexDirection: "row", marginBottom: 3 }}>
      <Text style={{ fontSize: 8, color: cores.neutral500, width: 110 }}>{label}:</Text>
      <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 600, color: cores.neutral800, flex: 1 }}>{valor}</Text>
    </View>
  )
}

function Alerta({ texto, cor }: { texto: string; cor: "error" | "warning" | "success" | "info" }) {
  const bgMap = { error: cores.errorBg, warning: cores.warningBg, success: cores.successBg, info: cores.infoBg }
  const fgMap = { error: cores.error, warning: cores.warning, success: cores.success, info: cores.info }
  return (
    <View style={{ padding: 6, backgroundColor: bgMap[cor], borderRadius: 4, marginBottom: 4 }}>
      <Text style={{ fontSize: 8, color: fgMap[cor], lineHeight: 1.5 }}>{texto}</Text>
    </View>
  )
}

function StatusDimensao({ nome, pontos, peso, percentual }: { nome: string; pontos: number; peso: number; percentual: number }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 6, alignItems: "center" }}>
      <Text style={{ fontSize: 8, flex: 1 }}>{nome}</Text>
      <View style={{ width: 80, height: 8, backgroundColor: cores.neutral200, borderRadius: 4, marginHorizontal: 8 }}>
        <View style={{
          width: `${Math.min(percentual, 100)}%`,
          height: 8,
          backgroundColor: percentual >= 80 ? cores.success : percentual >= 50 ? cores.warning : cores.error,
          borderRadius: 4,
        }} />
      </View>
      <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, width: 40, textAlign: "right" }}>
        {pontos}/{peso}
      </Text>
    </View>
  )
}

function SemaforoBadge({ semaforo, justificativa }: { semaforo: string; justificativa: string }) {
  const bgMap: Record<string, string> = { verde: cores.successBg, amarelo: cores.warningBg, vermelho: cores.errorBg }
  const fgMap: Record<string, string> = { verde: cores.success, amarelo: cores.warning, vermelho: cores.error }
  const borderMap: Record<string, string> = { verde: cores.successBorder, amarelo: cores.warningBorder, vermelho: cores.errorBorder }

  return (
    <View style={{ padding: 12, backgroundColor: bgMap[semaforo] || cores.neutral50, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: borderMap[semaforo] || cores.neutral200 }}>
      <Text style={{ fontSize: 14, fontFamily: "Source Sans 3", fontWeight: 700, color: fgMap[semaforo] || cores.neutral700, textAlign: "center", marginBottom: 4 }}>
        {semaforo.toUpperCase()}
      </Text>
      <Text style={{ fontSize: 8, color: cores.neutral700, textAlign: "center", lineHeight: 1.5 }}>{justificativa}</Text>
    </View>
  )
}

// ============================================
// GERAR PARECER PDF
// ============================================

export async function gerarParecerPDF(dados: DadosParecer): Promise<Buffer> {
  const dataFormatada = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

  const pm = dados.pipeline
  const mvar = dados.mvar
  const geo = dados.ideSisema

  const pdf = (
    <Document>
      {/* ============ CAPA ============ */}
      <Capa
        ferramenta="Análise Preliminar de Viabilidade"
        descricao={`Destinação em UC — Imóvel: ${dados.nomeImovel || "N/I"}, ${dados.municipio || "N/I"}/${dados.estado || "MG"}. Área: ${dados.areaHa ? dados.areaHa.toFixed(2) + " ha" : "N/I"} (${dados.areaFonte}).`}
        data={dataFormatada}
      />

      {/* ============ PÁGINA 1: SEMÁFORO + IMÓVEL + UC ============ */}
      <Pagina ferramenta={dados.ferramenta}>
        {/* Disclaimer */}
        <View style={{ padding: 10, backgroundColor: cores.warningBg, borderRadius: 6, marginBottom: 12, borderWidth: 0.5, borderColor: cores.warning }}>
          <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.warning, marginBottom: 3 }}>ANÁLISE PRELIMINAR</Text>
          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5 }}>
            Este relatório é uma pré-avaliação automatizada e não constitui parecer jurídico ou técnico. Os dados extraídos por inteligência artificial devem ser conferidos com os documentos originais.{pm.imovel.confianca_ocr === "baixa" ? " ATENÇÃO: documento com baixa legibilidade — conferir todos os dados numéricos." : ""}
          </Text>
        </View>

        {/* Semáforo */}
        <SemaforoBadge semaforo={pm.semaforo} justificativa={pm.semaforo_justificativa} />

        {/* MVAR se disponível */}
        {mvar ? (
          <CardDestaque
            label="Avaliação de Viabilidade (MVAR)"
            valor={mvar.classificacao.label}
            sublabel={mvar.classificacao.acao}
          />
        ) : <View />}

        {/* Dados do Imóvel */}
        <Secao titulo="1. Dados do Imóvel">
          <Campo label="Nome" valor={dados.nomeImovel || "—"} />
          <Campo label="Município/UF" valor={`${dados.municipio || pm.imovel.municipio || "—"}/${dados.estado || pm.imovel.uf || "MG"}`} />
          <Campo label="Área" valor={`${dados.areaHa.toFixed(2)} ha (${dados.areaFonte})`} />
          <Campo label="Matrícula" valor={pm.imovel.matricula || "—"} />
          <Campo label="Cartório" valor={pm.imovel.cartorio || "—"} />
          <Campo label="Comarca" valor={pm.imovel.comarca || "—"} />
          <Campo label="CCIR" valor={pm.imovel.ccir || "—"} />
          <Campo label="NIRF" valor={pm.imovel.nirf || "—"} />
          <Campo label="CAR" valor={pm.imovel.car || "—"} />
          <Campo label="INCRA" valor={pm.imovel.codigo_incra || "—"} />
          <Campo label="Georreferenciamento" valor={pm.imovel.georreferenciamento ? "Sim" : "Não"} />
          {pm.imovel.georef_certificacao ? <Campo label="Certificação" valor={pm.imovel.georef_certificacao} /> : <View />}
        </Secao>

        {/* Localização em UC */}
        <Secao titulo="2. Localização em Unidade de Conservação">
          {geo && geo.ucs_encontradas.length > 0 ? (
            geo.ucs_encontradas.map((uc, i) => (
              <View key={i} style={{ padding: 8, backgroundColor: cores.neutral50, borderRadius: 4, marginBottom: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                  <Text style={{ fontSize: 9, fontFamily: "Source Sans 3", fontWeight: 700 }}>{uc.nome}</Text>
                  <Text style={{ fontSize: 7, color: uc.protecao_integral ? cores.success : cores.warning }}>
                    {uc.protecao_integral ? "Proteção Integral" : "Uso Sustentável"}
                  </Text>
                </View>
                <Text style={{ fontSize: 8, color: cores.neutral500 }}>{uc.categoria}</Text>
                {uc.percentual_sobreposicao != null ? (
                  <Text style={{ fontSize: 8, marginTop: 2 }}>
                    Sobreposição: {uc.percentual_sobreposicao}% do imóvel
                    {uc.area_sobreposicao_ha != null ? ` (${uc.area_sobreposicao_ha} ha)` : ""}
                  </Text>
                ) : <View />}
              </View>
            ))
          ) : (
            <Alerta texto="Nenhuma Unidade de Conservação identificada na área do imóvel." cor="error" />
          )}

          {/* Regime UC */}
          {pm.regime_uc ? (
            <View style={{ marginTop: 8, padding: 8, backgroundColor: cores.infoBg, borderRadius: 4, borderWidth: 0.5, borderColor: cores.infoBorder }}>
              <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.info, marginBottom: 4 }}>Regime de UC de Proteção Integral</Text>
              <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5 }}>{pm.regime_uc.impacto_transmissao}</Text>
              <Text style={{ fontSize: 7, color: cores.neutral500, marginTop: 4, lineHeight: 1.5 }}>{pm.regime_uc.fundamentacao}</Text>
            </View>
          ) : <View />}
        </Secao>
      </Pagina>

      {/* ============ PÁGINA 2: PROPRIETÁRIOS + OUTORGA + ÔNUS + GEOREF ============ */}
      <Pagina ferramenta={dados.ferramenta}>
        <Secao titulo="3. Proprietários Atuais">
          {pm.proprietarios_atuais.length > 0 ? (
            pm.proprietarios_atuais.map((p, i) => (
              <View key={i} style={{ padding: 8, backgroundColor: cores.neutral50, borderRadius: 4, marginBottom: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                  <Text style={{ fontSize: 9, fontFamily: "Source Sans 3", fontWeight: 700, flex: 1 }}>{p.nome}</Text>
                  <Text style={{ fontSize: 9, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.accent }}>
                    {p.percentual != null ? `${p.percentual}%` : "?%"}
                  </Text>
                </View>
                {p.cpf ? <Text style={{ fontSize: 7, color: cores.neutral500 }}>CPF: {p.cpf}</Text> : <View />}
                {p.estado_civil ? (
                  <Text style={{ fontSize: 7, color: cores.neutral500 }}>
                    {p.estado_civil}{p.conjuge ? ` — cônjuge: ${p.conjuge}` : ""}{p.regime_bens ? ` (${p.regime_bens})` : ""}
                  </Text>
                ) : <View />}
                <Text style={{ fontSize: 7, color: cores.neutral400 }}>Ato: {p.ato_aquisitivo}{p.data_aquisicao ? ` (${new Date(p.data_aquisicao).toLocaleDateString("pt-BR")})` : ""}</Text>
              </View>
            ))
          ) : (
            <Alerta texto="Nenhum proprietário identificado na matrícula." cor="warning" />
          )}
        </Secao>

        {/* Outorga Conjugal */}
        {pm.outorga_conjugal.some((o) => o.exige_outorga || o.observacao) ? (
          <Secao titulo="4. Outorga Conjugal">
            <Text style={[styles.textoMuted, { marginBottom: 6 }]}>
              Art. 1.647, I do Código Civil — nenhum cônjuge pode alienar imóvel sem autorização do outro.
            </Text>
            {pm.outorga_conjugal.map((o, i) => (
              <View key={i} style={{ marginBottom: 4 }}>
                {o.exige_outorga ? (
                  <Alerta texto={`${o.nome}: exige outorga do cônjuge ${o.conjuge || "(nome não identificado)"}. ${o.observacao || ""}`} cor="warning" />
                ) : o.observacao ? (
                  <Alerta texto={`${o.nome}: ${o.observacao}`} cor="info" />
                ) : <View />}
              </View>
            ))}
          </Secao>
        ) : <View />}

        {/* Ônus e Gravames */}
        <Secao titulo="5. Ônus e Gravames">
          {pm.onus_ativos.length > 0 ? (
            pm.onus_ativos.map((o, i) => (
              <View key={i} style={{ padding: 6, backgroundColor: o.nivel === 1 ? cores.errorBg : cores.warningBg, borderRadius: 4, marginBottom: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                  <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: o.nivel === 1 ? cores.error : cores.warning }}>
                    {o.tipo.toUpperCase()} — Nível {o.nivel}
                  </Text>
                  <Text style={{ fontSize: 7, color: cores.neutral500 }}>{o.ato}</Text>
                </View>
                <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5 }}>{o.impacto_transmissao}</Text>
              </View>
            ))
          ) : (
            <Alerta texto="Nenhum ônus ou gravame ativo — situação registral favorável." cor="success" />
          )}

          {pm.onus_extintos.length > 0 ? (
            <View style={{ marginTop: 6 }}>
              <Text style={[styles.secaoSubtitulo, { color: cores.neutral500, marginBottom: 3 }]}>Ônus Extintos</Text>
              {pm.onus_extintos.map((o, i) => (
                <Text key={i} style={{ fontSize: 7, color: cores.neutral500, marginBottom: 2 }}>
                  ✓ {o.tipo} ({o.ato}) — cancelado por {o.cancelado_por}
                </Text>
              ))}
            </View>
          ) : <View />}
        </Secao>

        {/* Georreferenciamento */}
        <Secao titulo="6. Georreferenciamento">
          <View style={{ padding: 8, backgroundColor: pm.georeferenciamento.situacao === "regular" ? cores.successBg : cores.errorBg, borderRadius: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 9, fontFamily: "Source Sans 3", fontWeight: 700, color: pm.georeferenciamento.situacao === "regular" ? cores.success : cores.error }}>
                {pm.georeferenciamento.situacao === "regular" ? "Regular" : "Pendente"}
              </Text>
              <Text style={{ fontSize: 7, color: cores.neutral500 }}>Prazo: {pm.georeferenciamento.prazo_legal}</Text>
            </View>
            {pm.georeferenciamento.impacto ? (
              <Text style={{ fontSize: 7, color: cores.error, lineHeight: 1.5 }}>{pm.georeferenciamento.impacto}</Text>
            ) : (
              <Text style={{ fontSize: 7, color: cores.success }}>Georreferenciamento existente e em conformidade.</Text>
            )}
          </View>
        </Secao>
      </Pagina>

      {/* ============ PÁGINA 3: RESTRIÇÕES + CND + ANÁLISE ============ */}
      <Pagina ferramenta={dados.ferramenta}>
        {/* Restrições Ambientais */}
        {(pm.restricoes_ambientais.length > 0 || pm.contexto_historico_ambiental.length > 0) ? (
          <Secao titulo="7. Restrições Ambientais">
            {pm.restricoes_ambientais.length > 0 ? (
              pm.restricoes_ambientais.map((r, i) => (
                <View key={i} style={{ padding: 6, backgroundColor: cores.warningBg, borderRadius: 4, marginBottom: 4 }}>
                  <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.warning }}>{r.tipo}</Text>
                  <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5 }}>{r.descricao}</Text>
                  {r.area_ha ? <Text style={{ fontSize: 7, color: cores.neutral500 }}>Área: {r.area_ha} ha</Text> : <View />}
                </View>
              ))
            ) : (
              <Text style={styles.textoMuted}>Nenhuma restrição ambiental vigente identificada.</Text>
            )}

            {pm.contexto_historico_ambiental.length > 0 ? (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.secaoSubtitulo, { color: cores.neutral500, marginBottom: 4 }]}>Contexto Histórico (absorvido pela UC)</Text>
                {pm.contexto_historico_ambiental.map((r, i) => (
                  <View key={i} style={{ padding: 6, backgroundColor: cores.neutral50, borderRadius: 4, marginBottom: 4 }}>
                    <Text style={{ fontSize: 7, color: cores.neutral500 }}>{r.tipo} ({r.ato_origem})</Text>
                    <Text style={{ fontSize: 7, color: cores.neutral500, fontStyle: "italic", lineHeight: 1.5 }}>{r.motivo_reclassificacao}</Text>
                  </View>
                ))}
              </View>
            ) : <View />}
          </Secao>
        ) : <View />}

        {/* CND */}
        <Secao titulo={`8. Análise Fiscal — CND-ITR`}>
          {dados.cnd ? (
            <>
              <Campo label="Tipo" valor={dados.cnd.tipo || "—"} />
              <Campo label="CIB" valor={dados.cnd.cib || "—"} />
              <Campo label="Contribuinte" valor={dados.cnd.nome_contribuinte || "—"} />
              <Campo label="Área" valor={dados.cnd.area_hectares ? `${dados.cnd.area_hectares} ha` : "—"} />
              <Campo label="Emissão" valor={dados.cnd.data_emissao ? new Date(dados.cnd.data_emissao).toLocaleDateString("pt-BR") : "—"} />
              <Campo label="Validade" valor={dados.cnd.data_validade ? new Date(dados.cnd.data_validade).toLocaleDateString("pt-BR") : "—"} />
            </>
          ) : (
            <Alerta texto="CND-ITR não apresentada. Análise fiscal não realizada." cor="warning" />
          )}
        </Secao>

        {/* Análise de Transmissibilidade */}
        {pm.analise_transmissibilidade ? (
          <Secao titulo="9. Análise de Transmissibilidade">
            <Text style={[styles.texto, { marginBottom: 8 }]}>{pm.analise_transmissibilidade.resumo}</Text>

            {pm.analise_transmissibilidade.impedimentos.length > 0 ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.secaoSubtitulo, { color: cores.error, marginBottom: 4 }]}>Impedimentos</Text>
                {pm.analise_transmissibilidade.impedimentos.map((imp, i) => (
                  <View key={i} style={{ padding: 6, backgroundColor: cores.errorBg, borderRadius: 4, marginBottom: 4 }}>
                    <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.error }}>{imp.descricao}</Text>
                    <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5 }}>Fundamentação: {imp.fundamentacao}</Text>
                    <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5 }}>Recomendação: {imp.recomendacao}</Text>
                  </View>
                ))}
              </View>
            ) : <View />}

            {pm.analise_transmissibilidade.diligencias_recomendadas.length > 0 ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.secaoSubtitulo, { marginBottom: 4 }]}>Diligências Recomendadas</Text>
                {pm.analise_transmissibilidade.diligencias_recomendadas.map((d, i) => (
                  <Text key={i} style={{ fontSize: 8, color: cores.neutral700, marginBottom: 3, lineHeight: 1.5 }}>• {d}</Text>
                ))}
              </View>
            ) : <View />}

            {pm.analise_transmissibilidade.ressalvas.length > 0 ? (
              <View>
                <Text style={[styles.secaoSubtitulo, { color: cores.neutral500, marginBottom: 4 }]}>Ressalvas</Text>
                {pm.analise_transmissibilidade.ressalvas.map((r, i) => (
                  <Text key={i} style={{ fontSize: 7, color: cores.neutral500, marginBottom: 2, lineHeight: 1.5 }}>{r}</Text>
                ))}
              </View>
            ) : <View />}
          </Secao>
        ) : <View />}
      </Pagina>

      {/* ============ PÁGINA 4: MVAR + VTN + RECOMENDAÇÕES + CONCLUSÃO ============ */}
      <Pagina ferramenta={dados.ferramenta}>
        {Se(mvar && mvar.vetos.length > 0,
          <Secao titulo="Impedimentos (MVAR)">
            {(mvar?.vetos || []).map((v, i) => (
              <Alerta key={i} texto={`${v.origem}: ${v.motivo}`} cor="error" />
            ))}
          </Secao>
        )}

        {Se(mvar,
          <Secao titulo="10. Avaliação de Viabilidade (MVAR)">
            <View style={{ padding: 8, backgroundColor: cores.neutral50, borderRadius: 4, marginBottom: 8 }}>
              <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6 }}>
                A avaliação utiliza a MVAR (Matriz de Viabilidade de Aquisição Rural), que analisa quatro dimensões: situação registral, regularidade fiscal, titularidade e situação técnica. Situações impeditivas resultam em veto automático.
              </Text>
            </View>
            <StatusDimensao nome="Situação Registral" pontos={mvar?.dimensoes.juridica.pontos || 0} peso={mvar?.dimensoes.juridica.peso || 40} percentual={mvar?.dimensoes.juridica.percentual || 0} />
            <StatusDimensao nome="Regularidade Fiscal" pontos={mvar?.dimensoes.fiscal.pontos || 0} peso={mvar?.dimensoes.fiscal.peso || 30} percentual={mvar?.dimensoes.fiscal.percentual || 0} />
            <StatusDimensao nome="Titularidade" pontos={mvar?.dimensoes.titularidade.pontos || 0} peso={mvar?.dimensoes.titularidade.peso || 20} percentual={mvar?.dimensoes.titularidade.percentual || 0} />
            <StatusDimensao nome="Situação Técnica" pontos={mvar?.dimensoes.tecnica.pontos || 0} peso={mvar?.dimensoes.tecnica.peso || 10} percentual={mvar?.dimensoes.tecnica.percentual || 0} />
          </Secao>
        )}

        {Se(dados.vtn?.encontrado,
          <Secao titulo="11. Valor de Referência (VTN)">
            <Campo label="Município" valor={dados.vtn?.municipio || "—"} />
            <Campo label="R$/ha (preservação)" valor={dados.vtn?.valor_referencia ? `R$ ${dados.vtn.valor_referencia.toLocaleString("pt-BR")}` : "—"} />
            <Campo label="Valor estimado" valor={dados.vtn?.valor_estimado ? `R$ ${dados.vtn.valor_estimado.toLocaleString("pt-BR")}` : "—"} />
            <Text style={[styles.textoMuted, { marginTop: 3 }]}>
              Fonte: SIPT/Receita Federal (exercício {dados.vtn?.exercicio || "N/I"}). Valor referencial, não substitui laudo de avaliação.
            </Text>
          </Secao>
        )}

        {pm.recomendacoes.length > 0 ? (
          <Secao titulo="Recomendações">
            {pm.recomendacoes.map((r, i) => (
              <Text key={i} style={{ fontSize: 8, color: cores.neutral700, marginBottom: 3, lineHeight: 1.5 }}>• {r}</Text>
            ))}
          </Secao>
        ) : <View />}

        {pm.documentos_faltantes.length > 0 ? (
          <Secao titulo="Documentos Faltantes">
            {pm.documentos_faltantes.map((d, i) => (
              <Alerta key={i} texto={d} cor="warning" />
            ))}
          </Secao>
        ) : <View />}

        <Secao titulo="Conclusão">
          <Text style={[styles.texto, { marginBottom: 4 }]}>
            {mvar?.resumo || pm.analise_transmissibilidade?.resumo || "Análise concluída. Consulte os detalhes nas seções acima."}
          </Text>
        </Secao>

        <View style={{ marginTop: 12, padding: 8, borderTopWidth: 0.5, borderTopColor: cores.neutral200 }}>
          <Text style={{ fontSize: 7, color: cores.neutral400, lineHeight: 1.5 }}>
            ACAM — Análise de Compensações Ambientais. Esta é uma análise preliminar automatizada. Não constitui parecer jurídico ou técnico e não gera responsabilidade profissional. Os dados extraídos por inteligência artificial devem ser conferidos com os documentos originais. A viabilidade definitiva da compensação depende de análise por profissional qualificado e aprovação do órgão gestor da Unidade de Conservação. Documento gerado em {dataFormatada}.
          </Text>
        </View>
      </Pagina>
    </Document>
  )

  const buffer = await renderToBuffer(pdf)
  return Buffer.from(buffer)
}
