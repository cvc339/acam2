import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import {
  Document,
  Capa,
  Pagina,
  Secao,
  CardDestaque,
  styles,
} from "@/lib/pdf/template"
import { Text, View } from "@react-pdf/renderer"

function fmt(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

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
        "Content-Disposition": `attachment; filename="ACAM-Reposicao-Florestal-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar PDF:", error)
    return NextResponse.json({ erro: "Erro ao gerar PDF" }, { status: 500 })
  }
}
