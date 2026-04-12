/**
 * Parecer PDF — Destinação em UC — Mata Atlântica
 *
 * PDF específico para compensação MA (art. 49, II, Decreto 47.749/2019).
 * Estrutura segue o PDF de referência do ACAM1 validado pelo fundador.
 *
 * Design: AlertResultPDF (fundo neutro + badge) — NUNCA cards coloridos.
 * Cores via `cores` e `styles` do template ACAM2.
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
import { Text, View, Image } from "@react-pdf/renderer"
import type { ResultadoPipeline } from "./analise-matricula"
import type { CriterioMA, CompensacaoCalculo } from "./criterios-ma"
import type { ResultadoCoberturaDetalhada, ResultadoDinamicaVegetal } from "./analise-geoespacial"
import type { ResultadoSentinel2 } from "./sentinel-ndvi"
import type { ResultadoMVAR } from "./mvar"

// ============================================
// TIPOS
// ============================================

interface UC { nome: string; categoria: string; protecao_integral: boolean; percentual_sobreposicao: number | null }
interface Bacia { sigla: string | null; nome: string | null; bacia_federal: string | null; comite?: string | null }

export interface DadosParecerMA {
  nomeImovel: string
  municipio: string
  estado: string
  viabilidade: "ALTA" | "MÉDIA" | "BAIXA"
  recomendacao: string
  baseLegal: string
  criterios: CriterioMA[]
  compensacao: CompensacaoCalculo
  areaSupressao: { area_ha: number; bacia: Bacia | null; cobertura: ResultadoCoberturaDetalhada | null }
  areaProposta: {
    area_ha: number; bacia: Bacia | null; cobertura: ResultadoCoberturaDetalhada | null
    uc: UC | null; ucs_encontradas: UC[]
    mapaClassificacao?: MapaClassificacao
  }
  dinamicaVegetal: ResultadoDinamicaVegetal | null
  sentinel2: ResultadoSentinel2 | null
  mvar: ResultadoMVAR | null
  pipeline: ResultadoPipeline
  cnd: { tipo: string | null; cib: string | null; data_validade: string | null; area_hectares: number | null } | null
  vtn: { encontrado: boolean; municipio: string | null; valor_referencia: number | null; valor_estimado: number | null; exercicio: number | string | null } | null
}

interface MapaClassificacao {
  width: number
  height: number
  bbox: number[]
  dados: number[]
}

const MAPBIOMAS_CORES_PDF: Record<number, [number, number, number]> = {
  3: [31, 141, 73],     // Formação Florestal
  4: [125, 201, 117],   // Formação Savânica
  11: [81, 151, 153],   // Campo Alagado
  12: [214, 188, 116],  // Formação Campestre
  23: [221, 126, 107],  // Praia, Duna e Areal
  29: [255, 170, 95],   // Afloramento Rochoso
  33: [0, 0, 255],      // Rio, Lago e Oceano
  9: [122, 89, 0],      // Silvicultura
  15: [255, 217, 102],  // Pastagem
  20: [219, 77, 79],    // Cana
  21: [255, 239, 195],  // Mosaico de usos
  24: [212, 39, 30],    // Área urbanizada
  30: [156, 0, 39],     // Mineração
  39: [194, 123, 160],  // Soja
  41: [231, 135, 248],  // Outras lavouras temporárias
  46: [204, 160, 212],  // Café
  47: [208, 130, 222],  // Citrus
  48: [205, 73, 228],   // Outras lavouras perenes
  62: [102, 0, 102],    // Algodão
  25: [189, 183, 107],  // Outras áreas não vegetadas
}

/** Gera PNG a partir dos dados do mapa de classificação usando sharp */
async function gerarImagemMapa(mapa: MapaClassificacao): Promise<Buffer> {
  const { width, height, dados } = mapa

  // Gerar buffer RGBA raw
  const pixels = Buffer.alloc(width * height * 4)
  for (let i = 0; i < dados.length; i++) {
    const codigo = dados[i]
    const offset = i * 4
    if (codigo === 0) {
      pixels[offset] = 245; pixels[offset + 1] = 240; pixels[offset + 2] = 230; pixels[offset + 3] = 255
    } else {
      const rgb = MAPBIOMAS_CORES_PDF[codigo] || [128, 128, 128]
      pixels[offset] = rgb[0]; pixels[offset + 1] = rgb[1]; pixels[offset + 2] = rgb[2]; pixels[offset + 3] = 255
    }
  }

  // Converter para PNG via sharp
  const sharp = (await import("sharp")).default
  return sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer()
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
      <Text style={{ fontSize: 8, color: cores.neutral500, width: 130 }}>{label}:</Text>
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

// ============================================
// GERAR PARECER MA PDF
// ============================================

export async function gerarParecerMaPDF(dados: DadosParecerMA): Promise<Buffer> {
  console.log("[PDF-MA] Iniciando geração do PDF...")
  console.log("[PDF-MA] Dados recebidos:", JSON.stringify({
    nomeImovel: dados.nomeImovel,
    viabilidade: dados.viabilidade,
    criterios: dados.criterios?.length,
    temMvar: !!dados.mvar,
    temDinamica: !!dados.dinamicaVegetal,
    temSentinel: !!dados.sentinel2,
    temCoberturaProposta: !!dados.areaProposta?.cobertura?.sucesso,
  }))

  // Gerar imagem do mapa de cobertura antes de montar o JSX
  let imagemMapa: Buffer | null = null
  if (dados.areaProposta.mapaClassificacao) {
    try {
      imagemMapa = await gerarImagemMapa(dados.areaProposta.mapaClassificacao)
      console.log("[PDF-MA] Imagem do mapa gerada:", imagemMapa.length, "bytes")
    } catch (err) {
      console.error("[PDF-MA] Erro ao gerar imagem do mapa:", (err as Error).message)
    }
  }

  const dataFormatada = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  const pm = dados.pipeline
  const isAlta = dados.viabilidade === "ALTA"
  const isBaixa = dados.viabilidade === "BAIXA"

  const pdf = (
    <Document>
      <Capa
        ferramenta="Mata Atlântica — Destinação em Unidade de Conservação"
        descricao={`Análise de viabilidade para compensação de Mata Atlântica. Imóvel: ${dados.nomeImovel || "N/I"}, ${dados.municipio || "N/I"}/${dados.estado}. ${dados.baseLegal}.`}
        data={dataFormatada}
      />

      {/* PÁGINA 1: RESULTADO + DADOS + CRITÉRIOS */}
      <Pagina ferramenta="dest-uc-ma">
        {/* Resultado */}
        <AlertResultPDF label={isAlta ? "Viabilidade Alta" : isBaixa ? "Viabilidade Baixa" : "Viabilidade Média"} cor={isAlta ? cores.success : isBaixa ? cores.error : cores.warning}>
          <Text style={{ fontSize: 8, color: cores.neutral700, lineHeight: 1.5 }}>{dados.recomendacao}</Text>
        </AlertResultPDF>

        {/* Dados do Imóvel */}
        <Secao titulo="Dados do Imóvel">
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <Campo label="Nome" valor={dados.nomeImovel || "—"} />
              <Campo label="Área Proposta" valor={`${dados.areaProposta.area_ha.toFixed(2)} ha`} />
            </View>
            <View style={{ flex: 1 }}>
              <Campo label="Município" valor={dados.municipio || "—"} />
              <Campo label="UC Identificada" valor={dados.areaProposta.uc ? `${dados.areaProposta.uc.nome} (${dados.areaProposta.uc.percentual_sobreposicao ?? "?"}%)` : "Nenhuma"} />
            </View>
          </View>
        </Secao>

        {/* Critérios */}
        <Secao titulo={`Critérios do Decreto 47.749/2019 — ${dados.baseLegal}`}>
          {dados.criterios.map((c, i) => (
            <AlertResultPDF
              key={i}
              label={c.atendido ? "Atendido" : c.obrigatorio ? "Não atendido" : "Preferencial"}
              cor={c.atendido ? cores.success : c.obrigatorio ? cores.error : cores.warning}
            >
              <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>
                {c.nome}{!c.obrigatorio ? " (preferencial)" : ""}
              </Text>
              <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5, marginTop: 2 }}>{c.detalhe}</Text>
            </AlertResultPDF>
          ))}
        </Secao>
      </Pagina>

      {/* PÁGINA 2: UC + CÁLCULO + COBERTURA */}
      <Pagina ferramenta="dest-uc-ma">
        {/* UC */}
        {dados.areaProposta.uc && (
          <Secao titulo="Unidade de Conservação">
            <AlertResultPDF label={dados.areaProposta.uc.protecao_integral ? "UC Proteção Integral" : "UC Uso Sustentável"} cor={dados.areaProposta.uc.protecao_integral ? cores.success : cores.warning}>
              <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>{dados.areaProposta.uc.nome}</Text>
              <Text style={{ fontSize: 7, color: cores.neutral700 }}>Categoria: {dados.areaProposta.uc.categoria}</Text>
              <Text style={{ fontSize: 7, color: cores.neutral700 }}>Sobreposição: {dados.areaProposta.uc.percentual_sobreposicao ?? "?"}% da área proposta</Text>
            </AlertResultPDF>
            {dados.areaProposta.ucs_encontradas.filter((uc) => uc.nome !== dados.areaProposta.uc?.nome).length > 0 && (
              <View style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 7, color: cores.neutral500, marginBottom: 2 }}>Outras UCs sobrepostas:</Text>
                {dados.areaProposta.ucs_encontradas.filter((uc) => uc.nome !== dados.areaProposta.uc?.nome).map((uc, i) => (
                  <Text key={i} style={{ fontSize: 7, color: cores.neutral500 }}>• {uc.nome} ({uc.percentual_sobreposicao ?? "?"}%)</Text>
                ))}
              </View>
            )}
          </Secao>
        )}

        {/* Cálculo 2:1 */}
        <Secao titulo="Cálculo da Compensação (2:1)">
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 7, color: cores.neutral500 }}>Área Suprimida</Text>
              <Text style={{ fontSize: 14, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>{dados.compensacao.areaSuprimida.toFixed(2)} ha</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 7, color: cores.neutral500 }}>Necessário (2×)</Text>
              <Text style={{ fontSize: 14, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.accent }}>{dados.compensacao.areaNecessaria.toFixed(2)} ha</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 7, color: cores.neutral500 }}>Disponível</Text>
              <Text style={{ fontSize: 14, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>{dados.compensacao.areaVegetacaoNaturalProposta.toFixed(1)} ha</Text>
            </View>
          </View>
          {/* Barra de progresso */}
          <View style={{ height: 8, backgroundColor: cores.neutral200, borderRadius: 4, overflow: "hidden", marginBottom: 4 }}>
            <View style={{ height: 8, width: `${Math.min(dados.compensacao.percentualAtendimento, 100)}%`, backgroundColor: dados.compensacao.percentualAtendimento >= 100 ? cores.success : cores.warning, borderRadius: 4 }} />
          </View>
          <Text style={{ fontSize: 8, textAlign: "center", color: cores.neutral700 }}>
            Atendimento: {dados.compensacao.percentualAtendimento.toFixed(1)}%
          </Text>
        </Secao>

        {/* Cobertura Vegetal */}
        {dados.areaProposta.cobertura?.sucesso && (
          <Secao titulo="Cobertura Vegetal (MapBiomas)">
            {/* Mapa de classificação (imagem PNG gerada server-side via sharp) */}
            {imagemMapa && (
              <View style={{ marginBottom: 8 }}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={`data:image/png;base64,${imagemMapa.toString("base64")}`} style={{ width: "70%", borderRadius: 4, marginHorizontal: "auto" }} />
              </View>
            )}
            <View style={{ flexDirection: "row" }}>
              {/* Supressão */}
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800, marginBottom: 4 }}>Área de Supressão</Text>
                <Campo label="Vegetação Nativa" valor={`${dados.areaSupressao.cobertura?.totaisPorTipo?.natural?.percentual ?? 0}% (${dados.areaSupressao.cobertura?.totaisPorTipo?.natural?.areaHa ?? 0} ha)`} />
                <Campo label="Uso Antrópico" valor={`${dados.areaSupressao.cobertura?.totaisPorTipo?.antropico?.percentual ?? 0}% (${dados.areaSupressao.cobertura?.totaisPorTipo?.antropico?.areaHa ?? 0} ha)`} />
                {dados.areaSupressao.cobertura?.classes?.filter((c) => c.percentual >= 2).map((c, i) => (
                  <Text key={i} style={{ fontSize: 7, color: cores.neutral500 }}>• {c.classe}: {c.percentual}% ({c.areaEstimadaHa} ha)</Text>
                ))}
              </View>
              {/* Proposta */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800, marginBottom: 4 }}>Área Proposta</Text>
                <Campo label="Vegetação Nativa" valor={`${dados.areaProposta.cobertura?.totaisPorTipo?.natural?.percentual ?? 0}% (${dados.areaProposta.cobertura?.totaisPorTipo?.natural?.areaHa ?? 0} ha)`} />
                <Campo label="Uso Antrópico" valor={`${dados.areaProposta.cobertura?.totaisPorTipo?.antropico?.percentual ?? 0}% (${dados.areaProposta.cobertura?.totaisPorTipo?.antropico?.areaHa ?? 0} ha)`} />
                {dados.areaProposta.cobertura?.classes?.filter((c) => c.percentual >= 2).map((c, i) => (
                  <Text key={i} style={{ fontSize: 7, color: cores.neutral500 }}>• {c.classe}: {c.percentual}% ({c.areaEstimadaHa} ha)</Text>
                ))}
              </View>
            </View>
          </Secao>
        )}
      </Pagina>

      {/* PÁGINA 3: DINÂMICA + SENTINEL + MVAR */}
      <Pagina ferramenta="dest-uc-ma">
        {/* Dinâmica Vegetal */}
        {Se(dados.dinamicaVegetal,
          <Secao titulo="Dinâmica de Cobertura Vegetal">
            <Campo label="Período" valor={dados.dinamicaVegetal?.periodoAnalisado || "—"} />
            <Campo label="Tendência" valor={dados.dinamicaVegetal?.tendencia || "—"} />
            <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5, marginTop: 4 }}>
              {dados.dinamicaVegetal?.interpretacao || ""}
            </Text>
            <Campo label="Nativa estável" valor={`${dados.dinamicaVegetal?.transicoes?.coberturaEstavel?.percentual ?? 0}% (${dados.dinamicaVegetal?.transicoes?.coberturaEstavel?.ha ?? 0} ha)`} />
            <Campo label="Ganho" valor={`${dados.dinamicaVegetal?.transicoes?.ganhoCobertura?.percentual ?? 0}% (${dados.dinamicaVegetal?.transicoes?.ganhoCobertura?.ha ?? 0} ha)`} />
            <Campo label="Perda" valor={`${dados.dinamicaVegetal?.transicoes?.perdaCobertura?.percentual ?? 0}% (${dados.dinamicaVegetal?.transicoes?.perdaCobertura?.ha ?? 0} ha)`} />
            <Text style={[styles.textoMuted, { marginTop: 4 }]}>
              {dados.dinamicaVegetal?.ressalva || ""}
            </Text>
          </Secao>
        )}

        {/* Sentinel-2 NDVI */}
        {Se(dados.sentinel2?.disponivel,
          <Secao titulo="Verificação por Satélite — Sentinel-2">
            <Campo label="Data" valor={dados.sentinel2?.cena?.data?.substring(0, 10) || "—"} />
            <Campo label="Nebulosidade" valor={dados.sentinel2?.cena?.coberturaNuvens != null ? `${dados.sentinel2.cena.coberturaNuvens.toFixed(1)}%` : "—"} />
            <Campo label="Cobertura útil" valor={dados.sentinel2?.coberturaUtil ? `${dados.sentinel2.coberturaUtil.percentual.toFixed(1)}%` : "—"} />
            <Campo label="NDVI médio" valor={dados.sentinel2?.classificacao?.ndviMedio != null ? dados.sentinel2.classificacao.ndviMedio.toFixed(3) : "—"} />
            <Campo label="Avaliação" valor={dados.sentinel2?.classificacao?.analiseSegmentada?.avaliacao || dados.sentinel2?.classificacao?.status || "—"} />
            {dados.sentinel2?.classificacao?.analiseSegmentada?.interpretacao ? (
              <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5, marginTop: 4 }}>
                {dados.sentinel2.classificacao.analiseSegmentada.interpretacao}
              </Text>
            ) : <View />}
            {dados.sentinel2?.classificacao?.cruzamentoMapBiomas?.confianca ? (
              <Campo label="Confiança" valor={dados.sentinel2.classificacao.cruzamentoMapBiomas.confianca} />
            ) : <View />}
            <Text style={[styles.textoMuted, { marginTop: 4 }]}>
              {dados.sentinel2?.classificacao?.disclaimer || "Análise NDVI baseada em Sentinel-2 (10m). Limiares sujeitos a calibração com dados de campo."}
            </Text>
          </Secao>
        )}

        {/* MVAR */}
        {Se(dados.mvar,
          <Secao titulo="Análise Documental (MVAR)">
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: cores.primary600, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                <Text style={{ fontSize: 14, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.primary600 }}>{dados.mvar?.pontuacao?.total ?? 0}</Text>
                <Text style={{ fontSize: 6, color: cores.neutral500 }}>de {dados.mvar?.pontuacao?.maximo ?? 100}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 9, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>{dados.mvar?.classificacao?.label || "—"}</Text>
                <Text style={{ fontSize: 7, color: cores.neutral500 }}>Pontuação: {dados.mvar?.pontuacao?.total ?? 0} de {dados.mvar?.pontuacao?.maximo ?? 100}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5, marginBottom: 6 }}>{dados.mvar?.resumo || ""}</Text>
            {dados.mvar?.dimensoes && Object.entries(dados.mvar.dimensoes).map(([key, dim]) => {
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

        {/* Conclusão */}
        <Secao titulo={`Conclusão — ${dados.baseLegal}`}>
          <Text style={{ fontSize: 8, color: cores.neutral700, lineHeight: 1.5 }}>
            {dados.recomendacao}
          </Text>
        </Secao>

      </Pagina>

      {/* PÁGINA 4: NOTA SOBRE ESTA ANÁLISE */}
      <Pagina ferramenta="dest-uc-ma">
        <Secao titulo="NOTA SOBRE ESTA ANÁLISE">
          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 6 }}>
            Este relatório constitui análise preliminar automatizada e não substitui vistoria de campo, inventário florístico ou parecer técnico especializado.
          </Text>

          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 4 }}>
            <Text style={{ fontFamily: "Source Sans 3", fontWeight: 700 }}>Critérios do Decreto 47.749/2019: </Text>
            A verificação de bioma, bacia hidrográfica e sub-bacia foi realizada por consulta geoespacial às bases do IDE-Sisema (SEMAD/IEF/IGAM). Inconsistências nas bases oficiais podem afetar o resultado.
          </Text>

          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 4 }}>
            <Text style={{ fontFamily: "Source Sans 3", fontWeight: 700 }}>Análise documental (MVAR): </Text>
            A análise de ônus, gravames, situação fiscal e titularidade é baseada em dados declarados e não substitui diligência jurídica completa ou parecer elaborado por advogado com responsabilidade técnica.
          </Text>

          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 4 }}>
            <Text style={{ fontFamily: "Source Sans 3", fontWeight: 700 }}>Cobertura vegetal: </Text>
            Classificação baseada em MapBiomas Coleção 9 (2023), via IDE-Sisema. A classificação de estágios sucessionais (inicial, médio, avançado) requer inventário florístico conforme Resolução CONAMA 388/2007.
          </Text>

          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 4 }}>
            <Text style={{ fontFamily: "Source Sans 3", fontWeight: 700 }}>Dinâmica temporal: </Text>
            Comparação MapBiomas 2018–2023. Mudanças na cobertura vegetal podem decorrer de múltiplas causas (atividade antrópica, incêndios, queimas prescritas, eventos climáticos). A identificação da causa requer investigação de campo.
          </Text>

          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 4 }}>
            <Text style={{ fontFamily: "Source Sans 3", fontWeight: 700 }}>Verificação por satélite: </Text>
            Análise NDVI baseada em Sentinel-2 L2A (10m), Copernicus Data Space Ecosystem. Os limiares de NDVI por formação vegetal são baseados na literatura de sensoriamento remoto para o bioma Mata Atlântica e estão sujeitos a calibração com dados de campo. As formações de campo rupestre, afloramento rochoso e formação savânica são vegetação nativa legítima do bioma com NDVI naturalmente baixo. A classificação de estágios sucessionais requer inventário florístico conforme Res. CONAMA 388/2007.
          </Text>

          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 4 }}>
            <Text style={{ fontFamily: "Source Sans 3", fontWeight: 700 }}>Sobreposição com UC: </Text>
            Calculada por interseção geométrica entre o polígono da área proposta e os limites da Unidade de Conservação (IDE-Sisema). Imprecisões nos limites oficiais podem afetar o percentual calculado.
          </Text>

          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 6 }}>
            <Text style={{ fontFamily: "Source Sans 3", fontWeight: 700 }}>Fontes de dados: </Text>
            MapBiomas Coleção 9 (2023) via IDE-Sisema/GeoServer — Sentinel-2 L2A, Copernicus Data Space Ecosystem — IDE-Sisema (SEMAD/IEF/IGAM) — ICMBio (INDE) — Dados declarados pelo solicitante.
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

  console.log("[PDF-MA] JSX montado, chamando renderToBuffer...")
  try {
    const buffer = await renderToBuffer(pdf)
    console.log("[PDF-MA] PDF gerado com sucesso:", buffer.length, "bytes")
    return Buffer.from(buffer)
  } catch (err) {
    console.error("[PDF-MA] renderToBuffer FALHOU:", (err as Error).message)
    console.error("[PDF-MA] Stack:", (err as Error).stack)
    throw err
  }
}
