import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
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
import { formatBRL as fmt, formatNum as fmtNum } from "@/lib/format"
import type { ResultadoSNUC } from "@/lib/calculo/snuc"

interface RequestBody extends ResultadoSNUC {
  analiseGeoespacial?: boolean
  detalhesGeo?: {
    ucs?: Array<{ nome: string; categoria: string; motivo: string }>
    ecossistemas?: Array<{ tipo: string; nome: string }>
    cavidades?: number
    areaPrioritaria?: { nivel: string; nome?: string }
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json() as RequestBody

    const data = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    })

    const pdf = (
      <Document>
        <Capa
          ferramenta="Calculadora de Compensação SNUC"
          descricao="Estimativa do valor de compensação ambiental para empreendimentos de significativo impacto. Base legal: Lei 9.985/2000, Decreto 4.340/2002, Decreto 6.848/2009."
          data={data}
        />

        <Pagina ferramenta="Calculadora SNUC">
          {/* Resultado principal */}
          <CardDestaque
            label="Compensação Ambiental Estimada"
            valor={fmt(body.compensacaoAmbiental)}
            sublabel={`GI: ${fmtNum(body.giAplicado, 4)} — VR: ${fmt(body.valorReferencia)}`}
          />

          {body.giCapAplicado && (
            <View style={{ backgroundColor: cores.warningBg, borderWidth: 1, borderColor: cores.warningBorder, borderRadius: 4, padding: 8, marginBottom: 12 }}>
              <Text style={{ fontSize: 8, color: cores.warning, fontFamily: "Source Sans 3", fontWeight: 700 }}>
                GI limitado ao máximo legal de 0,5% (valor calculado: {fmtNum(body.giCalculado, 4)})
              </Text>
            </View>
          )}

          {/* Fórmula */}
          <View style={{ backgroundColor: cores.neutral50, borderRadius: 4, padding: 10, marginBottom: 16, textAlign: "center" }}>
            <Text style={{ fontSize: 8, color: cores.neutral500, marginBottom: 4 }}>Fórmula: CA = VR × (GI / 100)</Text>
            <Text style={{ fontSize: 10, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.primary600 }}>
              {fmt(body.valorReferencia)} × ({fmtNum(body.giAplicado, 4)} / 100) = {fmt(body.compensacaoAmbiental)}
            </Text>
          </View>

          {/* Resumo dos fatores */}
          <Secao titulo="Composição do Grau de Impacto (GI)">
            <View style={styles.tabelaHeader}>
              <Text style={[styles.tabelaHeaderTexto, { flex: 3 }]}>Componente</Text>
              <Text style={[styles.tabelaHeaderTexto, { flex: 1, textAlign: "right" }]}>Valor</Text>
            </View>
            <View style={styles.tabelaLinha}>
              <Text style={[styles.tabelaTexto, { flex: 3 }]}>Fator de Relevância (FR)</Text>
              <Text style={[styles.tabelaValor, { flex: 1 }]}>{fmtNum(body.totalFR, 4)}</Text>
            </View>
            <View style={styles.tabelaLinha}>
              <Text style={[styles.tabelaTexto, { flex: 3 }]}>Fator de Temporalidade (FT) — {body.fatorFT.descricao}</Text>
              <Text style={[styles.tabelaValor, { flex: 1 }]}>{fmtNum(body.totalFT, 4)}</Text>
            </View>
            <View style={styles.tabelaLinha}>
              <Text style={[styles.tabelaTexto, { flex: 3 }]}>Fator de Abrangência (FA) — {body.fatorFA.descricao}</Text>
              <Text style={[styles.tabelaValor, { flex: 1 }]}>{fmtNum(body.totalFA, 4)}</Text>
            </View>
            <View style={[styles.tabelaLinha, { borderBottomWidth: 0, backgroundColor: cores.primary50 }]}>
              <Text style={[styles.tabelaTexto, { flex: 3, fontFamily: "Source Sans 3", fontWeight: 700 }]}>
                Grau de Impacto (GI){body.giCapAplicado ? " — limitado a 0,5" : ""}
              </Text>
              <Text style={[styles.tabelaValor, { flex: 1, fontSize: 10 }]}>{fmtNum(body.giAplicado, 4)}</Text>
            </View>
          </Secao>

          {/* Detalhamento FR */}
          <Secao titulo="Detalhamento do Fator de Relevância (FR)">
            {body.fatoresFR.map((f, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 4, alignItems: "flex-start" }}>
                <Text style={{ fontSize: 8, color: cores.primary600, width: 40, fontFamily: "Source Sans 3", fontWeight: 700 }}>
                  {f.id.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 8, flex: 1, color: cores.neutral700 }}>
                  {f.descricao}
                  {f.autoDetectado ? " (detectado na análise)" : ""}
                </Text>
                <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.primary600, width: 40, textAlign: "right" }}>
                  {fmtNum(f.valor, 3)}
                </Text>
              </View>
            ))}
            <View style={{ flexDirection: "row", marginTop: 6, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: cores.neutral200 }}>
              <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, flex: 1 }}>Total FR</Text>
              <Text style={{ fontSize: 9, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.primary600, width: 40, textAlign: "right" }}>
                {fmtNum(body.totalFR, 4)}
              </Text>
            </View>
          </Secao>
        </Pagina>

        <Pagina ferramenta="Calculadora SNUC">
          {/* Detalhes geoespaciais (se houver) */}
          {body.analiseGeoespacial && body.detalhesGeo && (
            <Secao titulo="Resultados da Análise Geoespacial (IDE-Sisema)">
              {body.detalhesGeo.ucs && body.detalhesGeo.ucs.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.secaoSubtitulo}>Unidades de Conservação detectadas</Text>
                  {body.detalhesGeo.ucs.map((uc, i) => (
                    <Text key={i} style={{ fontSize: 8, color: cores.neutral700, marginBottom: 2 }}>
                      • {uc.nome} — {uc.categoria} — {uc.motivo}
                    </Text>
                  ))}
                </View>
              )}
              {body.detalhesGeo.ecossistemas && body.detalhesGeo.ecossistemas.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.secaoSubtitulo}>Ecossistemas protegidos</Text>
                  {body.detalhesGeo.ecossistemas.map((eco, i) => (
                    <Text key={i} style={{ fontSize: 8, color: cores.neutral700, marginBottom: 2 }}>
                      • {eco.nome}
                    </Text>
                  ))}
                </View>
              )}
              {body.detalhesGeo.areaPrioritaria && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.secaoSubtitulo}>Área prioritária para conservação</Text>
                  <Text style={{ fontSize: 8, color: cores.neutral700 }}>
                    Importância biológica: {body.detalhesGeo.areaPrioritaria.nivel}
                    {body.detalhesGeo.areaPrioritaria.nome ? ` — ${body.detalhesGeo.areaPrioritaria.nome}` : ""}
                  </Text>
                </View>
              )}
              {(body.detalhesGeo.cavidades ?? 0) > 0 && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.secaoSubtitulo}>Patrimônio espeleológico</Text>
                  <Text style={{ fontSize: 8, color: cores.neutral700 }}>
                    {body.detalhesGeo.cavidades} registro(s) de cavidade(s) na área
                  </Text>
                </View>
              )}
              <Text style={[styles.textoMuted, { marginTop: 4 }]}>
                Fonte: IDE-Sisema / Geoserver SEMAD-MG — Consulta em {data}
              </Text>
            </Secao>
          )}

          {/* Valor de Referência */}
          <Secao titulo="Valor de Referência (VR)">
            <Text style={[styles.textoMuted, { marginBottom: 8 }]}>
              Somatório dos investimentos inerentes à implantação do empreendimento, excluídos: planos e condicionantes de mitigação do licenciamento, custos de análise do licenciamento, investimentos para qualidade ambiental superior à exigida, encargos e custos de financiamento (incluindo garantias), e apólices e prêmios de seguros.
            </Text>
            <View style={styles.tabelaHeader}>
              <Text style={[styles.tabelaHeaderTexto, { flex: 1 }]}>Parâmetro</Text>
              <Text style={[styles.tabelaHeaderTexto, { flex: 1, textAlign: "right" }]}>Valor</Text>
            </View>
            <View style={styles.tabelaLinha}>
              <Text style={[styles.tabelaTexto, { flex: 1 }]}>Valor de Referência declarado</Text>
              <Text style={[styles.tabelaValor, { flex: 1 }]}>{fmt(body.valorReferencia)}</Text>
            </View>
            <View style={[styles.tabelaLinha, { borderBottomWidth: 0 }]}>
              <Text style={[styles.tabelaTexto, { flex: 1 }]}>Grau de Impacto aplicado</Text>
              <Text style={[styles.tabelaValor, { flex: 1 }]}>{fmtNum(body.giAplicado, 4)}%</Text>
            </View>
          </Secao>

          {/* Disclaimer */}
          <View style={{ marginTop: 16 }}>
            <Text style={styles.textoMuted}>
              Estimativa preliminar para fins de provisionamento. O valor definitivo será apurado pela Câmara de Compensação Ambiental
              com base nos parâmetros vigentes na data de concessão da licença. Os resultados não substituem análise de profissional
              qualificado, mediante responsabilidade técnica (ART/RRT).
            </Text>
          </View>
        </Pagina>
      </Document>
    )

    const buffer = await renderToBuffer(pdf)
    const uint8 = new Uint8Array(buffer)

    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ACAM-Calculadora-SNUC-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar PDF SNUC:", error)
    return NextResponse.json({ erro: "Erro ao gerar PDF" }, { status: 500 })
  }
}
