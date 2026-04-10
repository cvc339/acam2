/**
 * Geração de Parecer PDF — React-PDF (template ACAM2)
 *
 * Relatório técnico interno do ACAM, não é formulário oficial do Estado.
 * Usa o template React-PDF (Capa, Pagina, Secao) conforme regra 9 do CLAUDE.md.
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
import type { ResultadoMVAR } from "./mvar"
import type { DadosMatricula, ResultadoAnalise, ResultadoValidacao } from "./analise-documental"
import type { ResultadoIDESisema } from "./analise-geoespacial"

// ============================================
// TIPOS
// ============================================

export interface DadosParecer {
  nomeImovel: string
  municipio: string
  estado: string
  areaHa: number
  ferramenta: string
  dadosMatricula: ResultadoAnalise<DadosMatricula> | null
  mvar: ResultadoMVAR | null
  ideSisema: ResultadoIDESisema | null
  validacao: ResultadoValidacao | null
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

// React-PDF não aceita null/false como child
// Wrap condicional: Se(condição, elemento) retorna element ou <View /> vazio
function Se(cond: unknown, el: React.JSX.Element): React.JSX.Element {
  return cond ? el : <View />
}

function Campo({ label, valor }: { label: string; valor: string }) {
  if (!valor || valor === "—") return <View />
  return (
    <View style={{ flexDirection: "row", marginBottom: 3 }}>
      <Text style={{ fontSize: 8, color: cores.neutral500, width: 100 }}>{label}:</Text>
      <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 600, color: cores.neutral800, flex: 1 }}>{valor}</Text>
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

function Alerta({ texto, cor }: { texto: string; cor: string }) {
  return (
    <View style={{ padding: 6, backgroundColor: cor === "error" ? "#fef2f2" : cor === "warning" ? "#fffbeb" : "#f0fdf4", borderRadius: 4, marginBottom: 4 }}>
      <Text style={{ fontSize: 8, color: cor === "error" ? cores.error : cor === "warning" ? cores.warning : cores.success }}>{texto}</Text>
    </View>
  )
}

// ============================================
// GERAR PARECER PDF
// ============================================

export async function gerarParecerPDF(dados: DadosParecer): Promise<Buffer> {
  const dataFormatada = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

  const mat = dados.dadosMatricula?.dados
  const mvar = dados.mvar
  const geo = dados.ideSisema
  const val = dados.validacao

  const pdf = (
    <Document>
      {/* ============ CAPA ============ */}
      <Capa
        ferramenta="Análise Preliminar de Viabilidade"
        descricao={`Destinação em UC — Imóvel: ${dados.nomeImovel || "N/I"}, ${dados.municipio || "N/I"}/${dados.estado || "MG"}. Área: ${dados.areaHa ? dados.areaHa.toFixed(2) + " ha" : "N/I"}.`}
        data={dataFormatada}
      />

      {/* ============ PÁGINA 1: DISCLAIMER + IMÓVEL + UC ============ */}
      <Pagina ferramenta={dados.ferramenta}>
        {/* Disclaimer */}
        <View style={{ padding: 10, backgroundColor: "#fffbeb", borderRadius: 6, marginBottom: 12, borderWidth: 0.5, borderColor: cores.warning }}>
          <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.warning, marginBottom: 3 }}>ANÁLISE PRELIMINAR</Text>
          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5 }}>
            Este relatório é uma pré-avaliação automatizada e não constitui parecer jurídico ou técnico com responsabilidade profissional. O objetivo é antecipar possíveis problemas antes de investir esforço em negociações. Os dados extraídos por inteligência artificial devem ser conferidos com os documentos originais. PDFs escaneados (imagem) podem ter precisão reduzida. Para análise aprofundada, consulte um profissional qualificado.
          </Text>
        </View>

        {/* Classificação */}
        {mvar ? (
          <CardDestaque
            label="Avaliação de Viabilidade"
            valor={mvar.classificacao.label}
            sublabel={mvar.classificacao.acao}
          />
        ) : <View />}

        {/* Dados do Imóvel */}
        <Secao titulo="1. Dados do Imóvel">
          <Campo label="Nome" valor={dados.nomeImovel || "—"} />
          <Campo label="Município/UF" valor={`${dados.municipio || "—"}/${dados.estado || "MG"}`} />
          <Campo label="Área" valor={dados.areaHa ? `${dados.areaHa.toFixed(2)} ha` : "—"} />
          {mat?.matricula && <Campo label="Matrícula" valor={mat.matricula} />}
          {mat?.cartorio && <Campo label="Cartório" valor={mat.cartorio} />}
          {mat?.data_emissao && <Campo label="Data emissão" valor={new Date(mat.data_emissao).toLocaleDateString("pt-BR")} />}
          {mat?.ccir && <Campo label="CCIR" valor={mat.ccir} />}
          {mat?.nirf && <Campo label="NIRF/CIB" valor={mat.nirf} />}
        </Secao>

        {/* Localização em UC */}
        <Secao titulo="2. Localização em Unidade de Conservação">
          <Text style={[styles.textoMuted, { marginBottom: 6 }]}>
            Para compensação minerária, o imóvel deve estar inserido em UC de Proteção Integral pendente de regularização fundiária (Lei Estadual 20.922/2013).
          </Text>

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
                    Sobreposição: {uc.percentual_sobreposicao}% do imóvel no interior da UC
                    {uc.area_sobreposicao_ha != null ? ` (${uc.area_sobreposicao_ha} ha)` : ""}
                  </Text>
                ) : <View />}
              </View>
            ))
          ) : (
            <Alerta texto="Nenhuma Unidade de Conservação identificada na área do imóvel." cor="error" />
          )}

          <Text style={[styles.textoMuted, { marginTop: 4 }]}>Para visualização do mapa interativo com o polígono do imóvel, acesse o resultado online no ACAM.</Text>
        </Secao>
      </Pagina>

      {/* ============ PÁGINA 2: MATRÍCULA + CND ============ */}
      <Pagina ferramenta={dados.ferramenta}>
        {/* Proprietários */}
        <Secao titulo="3. Análise da Matrícula">
          {mat?.proprietarios && mat.proprietarios.length > 0 ? (
            <>
              <Text style={[styles.secaoSubtitulo, { marginBottom: 4 }]}>Proprietários identificados</Text>
              {mat.proprietarios.map((p, i) => (
                <View key={i} style={{ flexDirection: "row", marginBottom: 3, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: cores.neutral200 }}>
                  <Text style={{ fontSize: 8, flex: 2 }}>{p.nome}</Text>
                  <Text style={{ fontSize: 8, flex: 1, textAlign: "center", color: cores.neutral500 }}>
                    {p.estado_civil || "—"}{p.conjuge ? ` (cônjuge: ${p.conjuge})` : ""}
                  </Text>
                  <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, width: 40, textAlign: "right" }}>
                    {p.percentual}%
                  </Text>
                </View>
              ))}
              {mat.proprietarios.length > 2 ? (
                <Alerta texto={`Condomínio com ${mat.proprietarios.length} proprietários — todos devem assinar a escritura de doação.`} cor="warning" />
              ) : <View />}
            </>
          ) : (
            <Alerta texto="Nenhum proprietário identificado na matrícula." cor="warning" />
          )}

          {/* Ônus e Gravames */}
          <Text style={[styles.secaoSubtitulo, { marginTop: 8, marginBottom: 4 }]}>Ônus e Gravames</Text>
          {mat?.onus_gravames && mat.onus_gravames.length > 0 ? (
            mat.onus_gravames.map((onus, i) => (
              <Alerta key={i} texto={`${onus.tipo}${onus.numero_averbacao ? ` (${onus.numero_averbacao})` : ""}: ${onus.impacto_compra_venda || onus.descricao}`} cor="error" />
            ))
          ) : (
            <Alerta texto="Nenhum ônus ou gravame identificado na matrícula — situação favorável." cor="success" />
          )}

          {/* Alertas */}
          {mat?.alertas && mat.alertas.length > 0 ? (
            <View>
              <Text style={[styles.secaoSubtitulo, { marginTop: 8, marginBottom: 4 }]}>Alertas</Text>
              {mat.alertas.map((alerta, i) => (
                <Alerta key={i} texto={typeof alerta === "string" ? alerta : JSON.stringify(alerta)} cor="warning" />
              ))}
            </View>
          ) : <View />}

          <Text style={[styles.textoMuted, { marginTop: 6 }]}>
            A extração de dados da matrícula é feita por inteligência artificial. PDFs escaneados (imagem) podem ter precisão reduzida. Recomenda-se conferir os dados com o documento original.
          </Text>
        </Secao>

        {/* Análise Fiscal */}
        <Secao titulo="4. Análise Fiscal — CND-ITR">
          <Text style={[styles.textoMuted, { marginBottom: 6 }]}>
            A CND-ITR comprova a regularidade fiscal do imóvel perante a Receita Federal, requisito para a transferência.
          </Text>

          {!dados.dadosMatricula ? (
            <Alerta texto="CND-ITR não apresentada. Análise fiscal não realizada." cor="warning" />
          ) : (
            <Text style={styles.texto}>Dados fiscais foram cruzados com os dados da matrícula. Consulte a seção de síntese para divergências identificadas.</Text>
          )}
        </Secao>
      </Pagina>

      {/* ============ PÁGINA 3: MVAR + SÍNTESE + CONCLUSÃO ============ */}
      <Pagina ferramenta={dados.ferramenta}>
        {Se(mvar && mvar.vetos.length > 0,
          <Secao titulo="Impedimentos Identificados">
            <Text style={[styles.textoMuted, { marginBottom: 4 }]}>Situações que, se confirmadas, impedem a destinação do imóvel.</Text>
            {(mvar?.vetos || []).map((v, i) => (
              <Alerta key={i} texto={`${v.origem}: ${v.motivo}`} cor="error" />
            ))}
          </Secao>
        )}

        {Se(mvar,
          <Secao titulo="5. Avaliação de Viabilidade">
            <View style={{ padding: 8, backgroundColor: cores.neutral50, borderRadius: 4, marginBottom: 8 }}>
              <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6 }}>
                A avaliação utiliza metodologia própria (MVAR — Matriz de Viabilidade de Aquisição Rural) que analisa quatro dimensões do imóvel: situação registral (ônus e gravames), regularidade fiscal (CND-ITR), titularidade (tipo de proprietário e capacidade para transmissão) e situação técnica (georreferenciamento). Cada dimensão recebe pontuação proporcional ao seu peso na viabilidade da transferência. Situações impeditivas — como bloqueios judiciais, débitos fiscais exigíveis ou espólio não inventariado — resultam em veto automático, independente da pontuação obtida nas demais dimensões.
              </Text>
            </View>
            <StatusDimensao nome="Situação Registral" pontos={mvar?.dimensoes.juridica.pontos || 0} peso={mvar?.dimensoes.juridica.peso || 40} percentual={mvar?.dimensoes.juridica.percentual || 0} />
            <StatusDimensao nome="Regularidade Fiscal" pontos={mvar?.dimensoes.fiscal.pontos || 0} peso={mvar?.dimensoes.fiscal.peso || 30} percentual={mvar?.dimensoes.fiscal.percentual || 0} />
            <StatusDimensao nome="Titularidade" pontos={mvar?.dimensoes.titularidade.pontos || 0} peso={mvar?.dimensoes.titularidade.peso || 20} percentual={mvar?.dimensoes.titularidade.percentual || 0} />
            <StatusDimensao nome="Situação Técnica" pontos={mvar?.dimensoes.tecnica.pontos || 0} peso={mvar?.dimensoes.tecnica.peso || 10} percentual={mvar?.dimensoes.tecnica.percentual || 0} />
          </Secao>
        )}

        <Secao titulo="6. Síntese">
          {(val?.pontos_positivos || []).length > 0 ? (
            <View>
              <Text style={[styles.secaoSubtitulo, { color: cores.success, marginBottom: 3 }]}>Pontos Favoráveis</Text>
              {(val?.pontos_positivos || []).map((pp, i) => (
                <Text key={i} style={{ fontSize: 8, color: cores.success, marginBottom: 2 }}>✓ {pp}</Text>
              ))}
            </View>
          ) : <View />}
          {(val?.pendencias || []).length > 0 ? (
            <View style={{ marginTop: 6 }}>
              <Text style={[styles.secaoSubtitulo, { color: cores.warning, marginBottom: 3 }]}>Pendências</Text>
              {(val?.pendencias || []).map((p, i) => (
                <Text key={i} style={{ fontSize: 8, color: cores.warning, marginBottom: 2 }}>• {p}</Text>
              ))}
            </View>
          ) : <View />}
        </Secao>

        {Se(mvar?.vtn?.encontrado,
          <Secao titulo="7. Valor de Referência (VTN)">
            <Campo label="Município" valor={mvar?.vtn?.municipio || "—"} />
            <Campo label="R$/ha (preservação)" valor={mvar?.vtn?.valor_referencia ? `R$ ${mvar.vtn.valor_referencia.toLocaleString("pt-BR")}` : "—"} />
            <Campo label="Valor estimado" valor={mvar?.vtn?.valor_estimado ? `R$ ${mvar.vtn.valor_estimado.toLocaleString("pt-BR")}` : "—"} />
            <Text style={[styles.textoMuted, { marginTop: 3 }]}>
              Fonte: SIPT/Receita Federal (exercício {mvar?.vtn?.exercicio || "N/I"}). Valor referencial, não substitui laudo de avaliação.
            </Text>
          </Secao>
        )}

        <Secao titulo="Conclusão">
          <Text style={[styles.texto, { marginBottom: 4 }]}>
            {mvar?.resumo || "Análise concluída. Consulte os detalhes nas seções acima."}
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
