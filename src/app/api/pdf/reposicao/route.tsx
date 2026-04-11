import { NextResponse } from "next/server"
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
import { formatBRL as fmt } from "@/lib/format"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { itens, totalValor, totalArvores, ufemgAno, ufemgValor } = body

    const data = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    })

    const pdf = (
      <Document>
        <Capa
          ferramenta="Cálculo de Reposição Florestal"
          descricao="Cálculo da reposição florestal com base nos quantitativos de matéria-prima florestal nativa. Base legal: Lei 20.922/2013, Art. 78."
          data={data}
          ufemgAno={ufemgAno}
          ufemgValor={ufemgValor}
        />

        <Pagina ferramenta="Cálculo de Reposição Florestal">
          {/* Resultado do cálculo */}
          <CardDestaque
            label="Valor Total da Reposição"
            valor={fmt(totalValor)}
            sublabel={`${totalArvores} árvores a repor`}
          />

          <Secao titulo="Detalhamento por Produto">
            <View style={styles.tabelaHeader}>
              <Text style={[styles.tabelaHeaderTexto, { flex: 3 }]}>Produto</Text>
              <Text style={[styles.tabelaHeaderTexto, { flex: 2, textAlign: "center" }]}>Cálculo</Text>
              <Text style={[styles.tabelaHeaderTexto, { flex: 1.5, textAlign: "right" }]}>Valor</Text>
            </View>
            {(itens || []).map((i: { nome: string; volume: number; unidade: string; arvores: number; totalArvores: number; valor: number }, idx: number) => (
              <View key={idx} style={styles.tabelaLinha}>
                <Text style={[styles.tabelaTexto, { flex: 3 }]}>{i.nome}</Text>
                <Text style={[styles.tabelaTexto, { flex: 2, textAlign: "center" }]}>{i.volume} {i.unidade} × {i.arvores} = {i.totalArvores} árv.</Text>
                <Text style={[styles.tabelaValor, { flex: 1.5 }]}>{fmt(i.valor)}</Text>
              </View>
            ))}
          </Secao>

          {/* Conteúdo informativo */}
          <Secao titulo="O que é a Reposição Florestal">
            <Text style={styles.texto}>
              A reposição florestal é uma obrigação legal decorrente da supressão de vegetação nativa. Visa compensar o volume de matéria-prima florestal extraída. Diferente das taxas de expediente e florestal, que são pagas previamente à autorização, a reposição florestal é cumprida ao longo ou ao final do processo de intervenção ambiental.
            </Text>
          </Secao>

          {/* Prazo — destaque */}
          <View style={{
            backgroundColor: cores.primary50,
            borderRadius: 6,
            padding: 12,
            marginBottom: 14,
            borderLeftWidth: 3,
            borderLeftColor: cores.primary600,
          }}>
            <Text style={{ fontSize: 9, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.primary600, marginBottom: 4 }}>
              Prazo
            </Text>
            <Text style={[styles.texto, { color: cores.neutral700 }]}>
              O recolhimento ou a comprovação do cumprimento deve ser realizado no mesmo ano da supressão (Lei 20.922/2013, Art. 78).
            </Text>
          </View>

          <Secao titulo="Formas de Cumprimento">
            <View style={{ marginBottom: 6 }}>
              <Text style={{ fontSize: 9, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800, marginBottom: 2 }}>
                1. Formação de florestas
              </Text>
              <Text style={styles.texto}>
                Plantio de espécies florestais em área própria ou fomentada, para fins de recomposição ou uso sustentável.
              </Text>
            </View>
            <View style={{ marginBottom: 6 }}>
              <Text style={{ fontSize: 9, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800, marginBottom: 2 }}>
                2. Participação em associações de reflorestadores
              </Text>
              <Text style={styles.texto}>
                Adesão a projetos coletivos de plantio, com contribuição proporcional ao volume suprimido.
              </Text>
            </View>
            <View style={{ marginBottom: 6 }}>
              <Text style={{ fontSize: 9, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.neutral800, marginBottom: 2 }}>
                3. Recolhimento de valor ao erário
              </Text>
              <Text style={styles.texto}>
                Pagamento do valor calculado acima à conta de arrecadação da reposição florestal. Esta é a forma mais comum de cumprimento.
              </Text>
            </View>
          </Secao>

          <Secao titulo="Próximos Passos">
            <Text style={styles.texto}>
              • Incluir o valor da reposição no planejamento financeiro do empreendimento{"\n"}
              • Definir a forma de cumprimento antes da execução da supressão
            </Text>
          </Secao>

          {/* Rodapé com legislação e disclaimer */}
          <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: cores.neutral200 }}>
            <Text style={[styles.textoMuted, { marginBottom: 4 }]}>
              Legislação: Lei Estadual nº 20.922/2013, Art. 78 · Decreto Estadual nº 47.749/2019
            </Text>
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
        "Content-Disposition": `attachment; filename="ACAM-Reposicao-Florestal-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar PDF:", error)
    return NextResponse.json({ erro: "Erro ao gerar PDF" }, { status: 500 })
  }
}
