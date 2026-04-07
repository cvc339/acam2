import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import {
  Document,
  Capa,
  Pagina,
  Secao,
  CardDestaque,
  FichaDAE,
  styles,
} from "@/lib/pdf/template"
import { Text, View } from "@react-pdf/renderer"

function fmt(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function un(unidade: string, qtd: number): string {
  if (unidade === "hectare" && qtd > 1) return "hectares"
  return unidade
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      totalExpediente, totalFlorestal, totalReposicao, total,
      itensExpediente, itensFlorestal, itensReposicao,
      ufemgAno, ufemgValor,
      nome, documento, municipio, processo,
      dentroLicenciamento,
    } = body

    const data = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    })

    const orgao = dentroLicenciamento
      ? "FEAM - Fundação Estadual do Meio Ambiente"
      : "IEF - Instituto Estadual de Florestas"

    const orgaoFlorestal = dentroLicenciamento
      ? "SECRETARIA ESTADO DE MEIO AMBIENTE E DESENVOLVIMENTO SUSTENTÁVEL"
      : "INSTITUTO ESTADUAL DE FLORESTAS - IEF"

    const descExpediente = (itensExpediente || []).map((i: { nome: string; codigo: string; qtd: number; unidade: string }) =>
      `${i.nome} (${i.codigo}): ${i.qtd} ${un(i.unidade, i.qtd)}`
    ).join("; ")

    const descFlorestal = (itensFlorestal || []).map((i: { nome: string; codigo: string; vol: number; unidade: string }) =>
      `${i.nome} (${i.codigo}): ${i.vol} ${un(i.unidade, i.vol)}`
    ).join("; ")

    function montarInfo(desc: string) {
      return `Nome: ${nome || "[NOME DO EMPREENDIMENTO]"}\nCPF/CNPJ: ${documento || "[CPF/CNPJ]"}\nMunicípio: ${municipio ? municipio + "/MG" : "[MUNICÍPIO]"}\nProcesso: ${processo || "[Nº DO PROCESSO]"}\n\nDescrição da solicitação:\n${desc}`
    }

    const pdf = (
      <Document>
        {/* Capa */}
        <Capa
          ferramenta="Calculadora de Intervenção Ambiental"
          descricao="Cálculo de taxa de expediente, taxa florestal e reposição florestal para processos de intervenção ambiental em Minas Gerais."
          data={data}
          ufemgAno={ufemgAno}
          ufemgValor={ufemgValor}
        />

        {/* Resultado */}
        <Pagina ferramenta="Calculadora de Intervenção Ambiental">
          <CardDestaque
            label="Valor Total"
            valor={fmt(total)}
            sublabel={totalReposicao > 0 ? "Inclui reposição florestal" : undefined}
          />

          {/* Taxa de Expediente */}
          {itensExpediente && itensExpediente.length > 0 && (
            <Secao titulo="Taxa de Expediente">
              <View style={styles.tabelaHeader}>
                <Text style={[styles.tabelaHeaderTexto, { flex: 3 }]}>Atividade</Text>
                <Text style={[styles.tabelaHeaderTexto, { flex: 1, textAlign: "center" }]}>Código</Text>
                <Text style={[styles.tabelaHeaderTexto, { flex: 1, textAlign: "center" }]}>Qtd.</Text>
                <Text style={[styles.tabelaHeaderTexto, { flex: 1.5, textAlign: "right" }]}>Valor</Text>
              </View>
              {itensExpediente.map((i: { nome: string; codigo: string; qtd: number; unidade: string; valor: number }) => (
                <View key={i.codigo} style={styles.tabelaLinha}>
                  <Text style={[styles.tabelaTexto, { flex: 3 }]}>{i.nome}</Text>
                  <Text style={[styles.tabelaTexto, { flex: 1, textAlign: "center" }]}>{i.codigo}</Text>
                  <Text style={[styles.tabelaTexto, { flex: 1, textAlign: "center" }]}>{i.qtd} {un(i.unidade, i.qtd)}</Text>
                  <Text style={[styles.tabelaValor, { flex: 1.5 }]}>{fmt(i.valor)}</Text>
                </View>
              ))}
              <View style={[styles.tabelaLinha, { borderBottomWidth: 0, paddingTop: 8 }]}>
                <Text style={[styles.tabelaTexto, { flex: 5, fontFamily: "Helvetica-Bold" }]}>Subtotal Taxa de Expediente</Text>
                <Text style={[styles.tabelaValor, { flex: 1.5, fontSize: 10 }]}>{fmt(totalExpediente)}</Text>
              </View>
            </Secao>
          )}

          {/* Taxa Florestal */}
          {itensFlorestal && itensFlorestal.length > 0 && (
            <Secao titulo="Taxa Florestal">
              <View style={styles.tabelaHeader}>
                <Text style={[styles.tabelaHeaderTexto, { flex: 3 }]}>Produto</Text>
                <Text style={[styles.tabelaHeaderTexto, { flex: 1, textAlign: "center" }]}>Código</Text>
                <Text style={[styles.tabelaHeaderTexto, { flex: 1, textAlign: "center" }]}>Volume</Text>
                <Text style={[styles.tabelaHeaderTexto, { flex: 1.5, textAlign: "right" }]}>Valor</Text>
              </View>
              {itensFlorestal.map((i: { nome: string; codigo: string; vol: number; unidade: string; valor: number }) => (
                <View key={i.codigo} style={styles.tabelaLinha}>
                  <Text style={[styles.tabelaTexto, { flex: 3 }]}>{i.nome}</Text>
                  <Text style={[styles.tabelaTexto, { flex: 1, textAlign: "center" }]}>{i.codigo}</Text>
                  <Text style={[styles.tabelaTexto, { flex: 1, textAlign: "center" }]}>{i.vol} {i.unidade}</Text>
                  <Text style={[styles.tabelaValor, { flex: 1.5 }]}>{fmt(i.valor)}</Text>
                </View>
              ))}
              <View style={[styles.tabelaLinha, { borderBottomWidth: 0, paddingTop: 8 }]}>
                <Text style={[styles.tabelaTexto, { flex: 5, fontFamily: "Helvetica-Bold" }]}>Subtotal Taxa Florestal</Text>
                <Text style={[styles.tabelaValor, { flex: 1.5, fontSize: 10 }]}>{fmt(totalFlorestal)}</Text>
              </View>
            </Secao>
          )}

          {/* Reposição Florestal */}
          {itensReposicao && itensReposicao.length > 0 && (
            <Secao titulo="Reposição Florestal">
              <View style={styles.tabelaHeader}>
                <Text style={[styles.tabelaHeaderTexto, { flex: 3 }]}>Produto</Text>
                <Text style={[styles.tabelaHeaderTexto, { flex: 2, textAlign: "center" }]}>Cálculo</Text>
                <Text style={[styles.tabelaHeaderTexto, { flex: 1.5, textAlign: "right" }]}>Valor</Text>
              </View>
              {itensReposicao.map((i: { nome: string; codigo: string; vol: number; unidade: string; arvores: number; totalArvores: number; valor: number }) => (
                <View key={i.codigo} style={styles.tabelaLinha}>
                  <Text style={[styles.tabelaTexto, { flex: 3 }]}>{i.nome}</Text>
                  <Text style={[styles.tabelaTexto, { flex: 2, textAlign: "center" }]}>{i.vol} {i.unidade} × {i.arvores} = {i.totalArvores} árv.</Text>
                  <Text style={[styles.tabelaValor, { flex: 1.5 }]}>{fmt(i.valor)}</Text>
                </View>
              ))}
              <View style={[styles.tabelaLinha, { borderBottomWidth: 0, paddingTop: 8 }]}>
                <Text style={[styles.tabelaTexto, { flex: 5, fontFamily: "Helvetica-Bold" }]}>Subtotal Reposição Florestal</Text>
                <Text style={[styles.tabelaValor, { flex: 1.5, fontSize: 10 }]}>{fmt(totalReposicao)}</Text>
              </View>
            </Secao>
          )}
        </Pagina>

        {/* Fichas DAE */}
        <Pagina ferramenta="Calculadora de Intervenção Ambiental">
          <Secao titulo="Orientações para Emissão do DAE">
            <Text style={styles.texto}>
              Acesse o DAE Online da SEF/MG:{"\n"}
              https://daeonline1.fazenda.mg.gov.br/daeonline/executeReceitaOrgaosEstaduais.action
            </Text>
            <Text style={[styles.textoMuted, { marginTop: 8 }]}>
              1. Acesse o DAE Online  →  2. Selecione o Órgão Público  →  3. Selecione o Serviço  →  4. Preencha o Valor  →  5. Cole as Informações Complementares  →  6. Emita o DAE
            </Text>
          </Secao>

          {totalExpediente > 0 && (
            <FichaDAE
              titulo="Taxa de Expediente"
              orgao={orgao}
              servico="ANÁLISE DE INTERVENÇÃO AMBIENTAL"
              valor={fmt(totalExpediente)}
              infoComplementares={montarInfo(descExpediente)}
            />
          )}

          {totalFlorestal > 0 && (
            <FichaDAE
              titulo="Taxa Florestal"
              orgao={orgaoFlorestal}
              servico="TAXA FLORESTAL"
              valor={fmt(totalFlorestal)}
              infoComplementares={montarInfo(descFlorestal)}
            />
          )}

          <View style={{ marginTop: 16 }}>
            <Text style={styles.textoMuted}>
              UFEMG {ufemgAno}: R$ {ufemgValor?.toFixed(4).replace(".", ",")} — Valores estimados, sujeitos a atualização.
              Os resultados não substituem análise de profissional qualificado, mediante responsabilidade técnica.
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
        "Content-Disposition": `attachment; filename="ACAM-Calculadora-Intervencao-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar PDF:", error)
    return NextResponse.json({ erro: "Erro ao gerar PDF" }, { status: 500 })
  }
}
