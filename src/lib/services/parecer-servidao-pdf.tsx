/**
 * Parecer PDF — Servidão Ambiental / RPPN
 *
 * Art. 50, Decreto 47.749/2019. Análise geoespacial pura.
 * Critérios de similaridade ecológica + ganho ambiental (§1º).
 * SEM matrícula, CND ou MVAR.
 *
 * Design: AlertResultPDF (fundo neutro + badge).
 */

import { renderToBuffer } from "@react-pdf/renderer"
import "@/lib/pdf/fonts"
import { Document, Capa, Pagina, Secao, styles, cores } from "@/lib/pdf/template"
import { Text, View, Image } from "@react-pdf/renderer"
import type { CriterioServidao, CompensacaoCalculo, GanhoAmbientalResumo } from "./criterios-servidao"
import type { ResultadoCoberturaDetalhada, ResultadoDinamicaVegetal, ResultadoFitofisionomia, ResultadoAreaPrioritaria, ResultadoCorredorEcologico, ResultadoPrioridadeBiodiversidade } from "./analise-geoespacial"
import type { ResultadoSentinel2 } from "./sentinel-ndvi"

interface UC { nome: string; categoria: string; protecao_integral: boolean; percentual_sobreposicao: number | null }
interface Bacia { sigla: string | null; nome: string | null; bacia_federal: string | null }
interface MapaClassificacao { width: number; height: number; bbox: number[]; dados: number[] }

const MAPBIOMAS_CORES_PDF: Record<number, [number, number, number]> = {
  3: [31, 141, 73], 4: [125, 201, 117], 11: [81, 151, 153], 12: [214, 188, 116],
  23: [221, 126, 107], 29: [255, 170, 95], 33: [0, 0, 255], 9: [122, 89, 0],
  15: [255, 217, 102], 20: [219, 77, 79], 21: [255, 239, 195], 24: [212, 39, 30],
  30: [156, 0, 39], 39: [194, 123, 160], 41: [231, 135, 248], 46: [204, 160, 212],
  47: [208, 130, 222], 48: [205, 73, 228], 62: [102, 0, 102], 25: [189, 183, 107],
}

export interface DadosParecerServidao {
  nomeImovel: string
  municipio: string
  estado: string
  viabilidade: "ALTA" | "MÉDIA" | "BAIXA"
  recomendacao: string
  baseLegal: string
  criterios: CriterioServidao[]
  compensacao: CompensacaoCalculo
  ganhoAmbiental: GanhoAmbientalResumo
  areaSupressao: { area_ha: number; bacia: Bacia | null; cobertura: ResultadoCoberturaDetalhada | null; fitofisionomia: ResultadoFitofisionomia | null }
  areaProposta: {
    area_ha: number; bacia: Bacia | null; cobertura: ResultadoCoberturaDetalhada | null; fitofisionomia: ResultadoFitofisionomia | null
    ucs_encontradas: UC[]; mapaClassificacao?: MapaClassificacao
  }
  areaPrioritaria: ResultadoAreaPrioritaria | null
  corredor: ResultadoCorredorEcologico | null
  biodiversidade: ResultadoPrioridadeBiodiversidade | null
  dinamicaVegetal: ResultadoDinamicaVegetal | null
  sentinel2: ResultadoSentinel2 | null
}

// Auxiliares

function Se(cond: unknown, el: React.JSX.Element): React.JSX.Element { return cond ? el : <View /> }

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

async function gerarImagemMapa(mapa: MapaClassificacao): Promise<Buffer> {
  const { width, height, dados } = mapa
  const pixels = Buffer.alloc(width * height * 4)
  for (let i = 0; i < dados.length; i++) {
    const codigo = dados[i]
    const offset = i * 4
    if (codigo === 0) { pixels[offset] = 245; pixels[offset + 1] = 240; pixels[offset + 2] = 230; pixels[offset + 3] = 255 }
    else { const rgb = MAPBIOMAS_CORES_PDF[codigo] || [128, 128, 128]; pixels[offset] = rgb[0]; pixels[offset + 1] = rgb[1]; pixels[offset + 2] = rgb[2]; pixels[offset + 3] = 255 }
  }
  const sharp = (await import("sharp")).default
  return sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer()
}

// Gerar PDF

export async function gerarParecerServidaoPDF(dados: DadosParecerServidao): Promise<Buffer> {
  let imagemMapa: Buffer | null = null
  if (dados.areaProposta.mapaClassificacao) {
    try { imagemMapa = await gerarImagemMapa(dados.areaProposta.mapaClassificacao) } catch { /* sem mapa */ }
  }

  const dataFormatada = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  const isAlta = dados.viabilidade === "ALTA"
  const isBaixa = dados.viabilidade === "BAIXA"

  const pdf = (
    <Document>
      <Capa
        ferramenta="Servidão Ambiental / RPPN — Mata Atlântica"
        descricao={`Análise de similaridade ecológica e ganho ambiental. Imóvel: ${dados.nomeImovel || "N/I"}, ${dados.municipio || "N/I"}/${dados.estado}. ${dados.baseLegal}.`}
        data={dataFormatada}
      />

      {/* PÁGINA 1: RESULTADO + CRITÉRIOS */}
      <Pagina ferramenta="dest-servidao">
        <AlertResultPDF label={isAlta ? "Viabilidade Alta" : isBaixa ? "Viabilidade Baixa" : "Viabilidade Média"} cor={isAlta ? cores.success : isBaixa ? cores.error : cores.warning}>
          <Text style={{ fontSize: 8, color: cores.neutral700, lineHeight: 1.5 }}>{dados.recomendacao}</Text>
        </AlertResultPDF>

        <Secao titulo="Dados da Análise">
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <Campo label="Nome" valor={dados.nomeImovel || "—"} />
              <Campo label="Área Proposta" valor={`${dados.areaProposta.area_ha.toFixed(2)} ha`} />
            </View>
            <View style={{ flex: 1 }}>
              <Campo label="Município" valor={dados.municipio || "—"} />
              <Campo label="Modalidade" valor="Servidão Ambiental / RPPN" />
            </View>
          </View>
        </Secao>

        <Secao titulo={`Critérios Obrigatórios — ${dados.baseLegal}`}>
          {dados.criterios.filter((c) => c.obrigatorio).map((c, i) => (
            <AlertResultPDF key={i} label={c.atendido ? "Atendido" : "Não atendido"} cor={c.atendido ? cores.success : cores.error}>
              <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>{c.nome}</Text>
              <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5, marginTop: 2 }}>{c.detalhe}</Text>
            </AlertResultPDF>
          ))}
        </Secao>
      </Pagina>

      {/* PÁGINA 2: GANHO AMBIENTAL + CÁLCULO + COBERTURA */}
      <Pagina ferramenta="dest-servidao">
        <Secao titulo="Ganho Ambiental (§1º do Art. 50)">
          <Text style={{ fontSize: 7, color: cores.neutral500, lineHeight: 1.5, marginBottom: 6 }}>
            Quando for inviável o atendimento de todas as características de similaridade ecológica, pode ser considerado o ganho ambiental no estabelecimento da área como protegida.
          </Text>
          {dados.criterios.filter((c) => c.ganhoAmbiental).map((c, i) => (
            <AlertResultPDF key={i} label={c.atendido ? "Identificado" : "Não identificado"} cor={c.atendido ? cores.success : cores.neutral500}>
              <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800 }}>{c.nome}</Text>
              <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5, marginTop: 2 }}>{c.detalhe}</Text>
            </AlertResultPDF>
          ))}
          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5, marginTop: 4 }}>{dados.ganhoAmbiental.fundamentacao}</Text>
        </Secao>

        <Secao titulo="Cálculo da Compensação (2:1)">
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 7, color: cores.neutral500 }}>Área Suprimida</Text>
              <Text style={{ fontSize: 14, fontFamily: "Source Sans 3", fontWeight: 700 }}>{dados.compensacao.areaSuprimida.toFixed(2)} ha</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 7, color: cores.neutral500 }}>Necessário (2×)</Text>
              <Text style={{ fontSize: 14, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.accent }}>{dados.compensacao.areaNecessaria.toFixed(2)} ha</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 7, color: cores.neutral500 }}>Disponível</Text>
              <Text style={{ fontSize: 14, fontFamily: "Source Sans 3", fontWeight: 700 }}>{dados.compensacao.areaVegetacaoNaturalProposta.toFixed(1)} ha</Text>
            </View>
          </View>
          <View style={{ height: 8, backgroundColor: cores.neutral200, borderRadius: 4, overflow: "hidden", marginBottom: 4 }}>
            <View style={{ height: 8, width: `${Math.min(dados.compensacao.percentualAtendimento, 100)}%`, backgroundColor: dados.compensacao.percentualAtendimento >= 100 ? cores.success : cores.warning, borderRadius: 4 }} />
          </View>
          <Text style={{ fontSize: 8, textAlign: "center", color: cores.neutral700 }}>Atendimento: {dados.compensacao.percentualAtendimento.toFixed(1)}%</Text>
        </Secao>

        {dados.areaProposta.cobertura?.sucesso && (
          <Secao titulo="Cobertura Vegetal (MapBiomas)">
            {imagemMapa && (
              <View style={{ marginBottom: 8 }}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={`data:image/png;base64,${imagemMapa.toString("base64")}`} style={{ width: "70%", borderRadius: 4, marginHorizontal: "auto" }} />
              </View>
            )}
            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, marginBottom: 4 }}>Área de Supressão</Text>
                <Campo label="Vegetação Nativa" valor={`${dados.areaSupressao.cobertura?.totaisPorTipo?.natural?.percentual ?? 0}% (${dados.areaSupressao.cobertura?.totaisPorTipo?.natural?.areaHa ?? 0} ha)`} />
                {dados.areaSupressao.cobertura?.classes?.filter((c) => c.percentual >= 2).map((c, i) => (
                  <Text key={i} style={{ fontSize: 7, color: cores.neutral500 }}>• {c.classe}: {c.percentual}% ({c.areaEstimadaHa} ha)</Text>
                ))}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, marginBottom: 4 }}>Área Proposta</Text>
                <Campo label="Vegetação Nativa" valor={`${dados.areaProposta.cobertura?.totaisPorTipo?.natural?.percentual ?? 0}% (${dados.areaProposta.cobertura?.totaisPorTipo?.natural?.areaHa ?? 0} ha)`} />
                {dados.areaProposta.cobertura?.classes?.filter((c) => c.percentual >= 2).map((c, i) => (
                  <Text key={i} style={{ fontSize: 7, color: cores.neutral500 }}>• {c.classe}: {c.percentual}% ({c.areaEstimadaHa} ha)</Text>
                ))}
              </View>
            </View>
          </Secao>
        )}
      </Pagina>

      {/* PÁGINA 3: DINÂMICA + SENTINEL */}
      <Pagina ferramenta="dest-servidao">
        {Se(dados.dinamicaVegetal,
          <Secao titulo="Dinâmica de Cobertura Vegetal">
            <Campo label="Período" valor={dados.dinamicaVegetal?.periodoAnalisado || "—"} />
            <Campo label="Tendência" valor={dados.dinamicaVegetal?.tendencia || "—"} />
            <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.5, marginTop: 4 }}>{dados.dinamicaVegetal?.interpretacao || ""}</Text>
            <Campo label="Nativa estável" valor={`${dados.dinamicaVegetal?.transicoes?.coberturaEstavel?.percentual ?? 0}% (${dados.dinamicaVegetal?.transicoes?.coberturaEstavel?.ha ?? 0} ha)`} />
            <Campo label="Ganho" valor={`${dados.dinamicaVegetal?.transicoes?.ganhoCobertura?.percentual ?? 0}%`} />
            <Campo label="Perda" valor={`${dados.dinamicaVegetal?.transicoes?.perdaCobertura?.percentual ?? 0}%`} />
            <Text style={[styles.textoMuted, { marginTop: 4 }]}>{dados.dinamicaVegetal?.ressalva || ""}</Text>
          </Secao>
        )}

        {Se(dados.sentinel2?.disponivel,
          <Secao titulo="Verificação por Satélite — Sentinel-2">
            <Campo label="Data" valor={dados.sentinel2?.cena?.data?.substring(0, 10) || "—"} />
            <Campo label="NDVI médio" valor={dados.sentinel2?.classificacao?.ndviMedio != null ? dados.sentinel2.classificacao.ndviMedio.toFixed(3) : "—"} />
            <Campo label="Avaliação" valor={dados.sentinel2?.classificacao?.analiseSegmentada?.avaliacao || dados.sentinel2?.classificacao?.status || "—"} />
            <Campo label="Confiança" valor={dados.sentinel2?.classificacao?.cruzamentoMapBiomas?.confianca || "—"} />
          </Secao>
        )}

        <Secao titulo={`Conclusão — ${dados.baseLegal}`}>
          <Text style={{ fontSize: 8, color: cores.neutral700, lineHeight: 1.5 }}>{dados.recomendacao}</Text>
        </Secao>
      </Pagina>

      {/* PÁGINA 4: NOTA SOBRE ESTA ANÁLISE */}
      <Pagina ferramenta="dest-servidao">
        <Secao titulo="NOTA SOBRE ESTA ANÁLISE">
          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 6 }}>
            Este relatório constitui análise preliminar automatizada e não substitui vistoria de campo, inventário florístico ou parecer técnico especializado.
          </Text>
          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 4 }}>
            <Text style={{ fontFamily: "Source Sans 3", fontWeight: 700 }}>Similaridade ecológica (Art. 50): </Text>
            A avaliação de similaridade ecológica é baseada em dados secundários (MapBiomas, IDE-Sisema) e não substitui inventário florístico conforme Resolução CONAMA 388/2007. A classificação de estágios sucessionais e a avaliação de riqueza de espécies e endemismo requerem levantamento de campo por profissional habilitado.
          </Text>
          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 4 }}>
            <Text style={{ fontFamily: "Source Sans 3", fontWeight: 700 }}>Ganho ambiental (§1º do Art. 50): </Text>
            A análise de ganho ambiental é baseada em camadas geoespaciais oficiais (IDE-Sisema) de áreas prioritárias para conservação e corredores ecológicos. A confirmação do potencial de conectividade e formação de corredores requer análise de paisagem em escala local.
          </Text>
          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 4 }}>
            <Text style={{ fontFamily: "Source Sans 3", fontWeight: 700 }}>Fitofisionomia: </Text>
            A comparação fitofisionômica utiliza MapBiomas Coleção 9 (Nível 3) complementada por camadas de relevância fitofisionômica do IDE-Sisema (SEMAD/IEF). Para detalhamento entre subtipos, consultar Mapa de Vegetação IBGE ou mapeamento Promata II.
          </Text>
          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 4 }}>
            <Text style={{ fontFamily: "Source Sans 3", fontWeight: 700 }}>Cobertura vegetal: </Text>
            Classificação baseada em MapBiomas Coleção 9 (2023), via IDE-Sisema. A classificação de estágios sucessionais requer inventário florístico conforme Resolução CONAMA 388/2007.
          </Text>
          <Text style={{ fontSize: 7, color: cores.neutral700, lineHeight: 1.6, marginBottom: 6 }}>
            <Text style={{ fontFamily: "Source Sans 3", fontWeight: 700 }}>Fontes de dados: </Text>
            MapBiomas Coleção 9 (2023) via IDE-Sisema/GeoServer — Sentinel-2 L2A, Copernicus Data Space Ecosystem — IDE-Sisema (SEMAD/IEF/IGAM) — ICMBio (INDE).
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
