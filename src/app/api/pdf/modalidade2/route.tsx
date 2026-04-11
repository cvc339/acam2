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
} from "@/lib/pdf/template"
import { Text, View } from "@react-pdf/renderer"
import { formatBRL as fmt, formatNum as fmtNum } from "@/lib/format"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { area, nomeVegetacao, ufemgPorHa, totalUFEMGs, totalReais, ufemgValor, ufemgAno } = body

    const data = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    })

    const pdf = (
      <Document>
        <Capa
          ferramenta="Cálculo de Compensação Minerária — Modalidade 2"
          descricao="Implantação ou manutenção de Unidade de Conservação de Proteção Integral. Base legal: Lei 20.922/2013, Portaria IEF 27/2017."
          data={data}
          ufemgAno={ufemgAno}
          ufemgValor={ufemgValor}
        />

        <Pagina ferramenta="Compensação Minerária — Modalidade 2">
          <CardDestaque
            label="Valor Estimado da Compensação"
            valor={fmt(totalReais)}
          />

          <Secao titulo="Dados da Intervenção">
            <View style={styles.tabelaHeader}>
              <Text style={[styles.tabelaHeaderTexto, { flex: 1 }]}>Parâmetro</Text>
              <Text style={[styles.tabelaHeaderTexto, { flex: 1, textAlign: "right" }]}>Valor</Text>
            </View>
            <View style={styles.tabelaLinha}>
              <Text style={[styles.tabelaTexto, { flex: 1 }]}>Área a suprimir</Text>
              <Text style={[styles.tabelaValor, { flex: 1 }]}>{fmtNum(area)} ha</Text>
            </View>
            <View style={styles.tabelaLinha}>
              <Text style={[styles.tabelaTexto, { flex: 1 }]}>Tipo de vegetação</Text>
              <Text style={[styles.tabelaValor, { flex: 1 }]}>{nomeVegetacao}</Text>
            </View>
            <View style={styles.tabelaLinha}>
              <Text style={[styles.tabelaTexto, { flex: 1 }]}>UFEMG por hectare</Text>
              <Text style={[styles.tabelaValor, { flex: 1 }]}>{fmtNum(ufemgPorHa)} UFEMGs/ha</Text>
            </View>
            <View style={styles.tabelaLinha}>
              <Text style={[styles.tabelaTexto, { flex: 1 }]}>Total em UFEMGs</Text>
              <Text style={[styles.tabelaValor, { flex: 1 }]}>{fmtNum(totalUFEMGs)} UFEMGs</Text>
            </View>
            <View style={[styles.tabelaLinha, { borderBottomWidth: 0 }]}>
              <Text style={[styles.tabelaTexto, { flex: 1, fontFamily: "Source Sans 3", fontWeight: 700 }]}>Total em Reais</Text>
              <Text style={[styles.tabelaValor, { flex: 1, fontSize: 12 }]}>{fmt(totalReais)}</Text>
            </View>
          </Secao>

          <Secao titulo="Fluxo Administrativo Estimado">
            {[
              { t: "Escolha da UC", p: "1-2 semanas" },
              { t: "Contato com Órgão Gestor", p: "2-4 semanas" },
              { t: "Elaboração do Projeto", p: "4-8 semanas" },
              { t: "Submissão e Análise", p: "4-8 semanas" },
              { t: "Termo de Compromisso", p: "3-4 semanas" },
              { t: "Execução e Prestação de Contas", p: "12-36 meses" },
            ].map((e, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 6, alignItems: "center" }}>
                <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: "#1a3a2a", width: 16 }}>{i + 1}.</Text>
                <Text style={{ fontSize: 8, flex: 1 }}>{e.t}</Text>
                <Text style={{ fontSize: 7, color: "#737373" }}>{e.p}</Text>
              </View>
            ))}
            <Text style={[styles.textoMuted, { marginTop: 8 }]}>
              Prazo total estimado: 18-60 meses (1,5 a 5 anos)
            </Text>
          </Secao>

          <Secao titulo="Legislação de Referência">
            <Text style={styles.texto}>• Lei Estadual nº 20.922/2013 — Políticas florestal e de biodiversidade em MG</Text>
            <Text style={[styles.texto, { marginTop: 4 }]}>• Portaria IEF nº 27/2017 — Procedimentos para compensação ambiental de mineração</Text>
          </Secao>

          <View style={{ marginTop: 16 }}>
            <Text style={styles.textoMuted}>
              UFEMG {ufemgAno}: R$ {ufemgValor?.toFixed(4).replace(".", ",")} — Valores estimados, sujeitos a atualização pelo órgão ambiental.
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
        "Content-Disposition": `attachment; filename="ACAM-Calculo-Modalidade2-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar PDF:", error)
    return NextResponse.json({ erro: "Erro ao gerar PDF" }, { status: 500 })
  }
}
