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

function LinhaTabela({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.tabelaLinha}>
      <Text style={[styles.tabelaTexto, { flex: 1 }]}>{label}</Text>
      <Text style={[styles.tabelaValor, { flex: 1 }]}>{valor}</Text>
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

// ============================================
// GERAR PARECER PDF
// ============================================

export async function gerarParecerPDF(dados: DadosParecer): Promise<Buffer> {
  const dataFormatada = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

  const matricula = dados.dadosMatricula?.dados
  const mvar = dados.mvar
  const geo = dados.ideSisema
  const validacao = dados.validacao

  const corClassificacao = mvar?.classificacao?.cor || cores.neutral500

  const pdf = (
    <Document>
      {/* Capa */}
      <Capa
        ferramenta={dados.ferramenta}
        descricao={`Parecer técnico de viabilidade para compensação ambiental. Imóvel: ${dados.nomeImovel}, ${dados.municipio}/${dados.estado}.`}
        data={dataFormatada}
      />

      {/* Página 1: Dados do Imóvel + MVAR */}
      <Pagina ferramenta={dados.ferramenta}>
        {mvar && (
          <CardDestaque
            label="Classificação de Risco"
            valor={`${mvar.pontuacao.total} / 100`}
            sublabel={`${mvar.classificacao.label} — ${mvar.classificacao.acao}`}
          />
        )}

        <Secao titulo="Dados do Imóvel">
          <View style={styles.tabelaHeader}>
            <Text style={[styles.tabelaHeaderTexto, { flex: 1 }]}>Campo</Text>
            <Text style={[styles.tabelaHeaderTexto, { flex: 1, textAlign: "right" }]}>Valor</Text>
          </View>
          <LinhaTabela label="Nome" valor={dados.nomeImovel || "—"} />
          <LinhaTabela label="Município/UF" valor={`${dados.municipio || "—"}/${dados.estado || "MG"}`} />
          <LinhaTabela label="Área" valor={dados.areaHa ? `${dados.areaHa.toFixed(2)} ha` : "—"} />
          {matricula?.matricula && <LinhaTabela label="Matrícula" valor={matricula.matricula} />}
          {matricula?.cartorio && <LinhaTabela label="Cartório" valor={matricula.cartorio} />}
        </Secao>

        {/* Proprietários */}
        {matricula?.proprietarios && matricula.proprietarios.length > 0 && (
          <Secao titulo="Proprietários">
            {matricula.proprietarios.map((p, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 4 }}>
                <Text style={{ fontSize: 8, flex: 2 }}>{p.nome}</Text>
                <Text style={{ fontSize: 8, flex: 1, textAlign: "center" }}>
                  {p.cpf_cnpj ? "***" + p.cpf_cnpj.slice(-4) : "—"}
                </Text>
                <Text style={{ fontSize: 8, flex: 1, textAlign: "right", fontFamily: "Source Sans 3", fontWeight: 700 }}>
                  {p.percentual}%
                </Text>
              </View>
            ))}
          </Secao>
        )}

        {/* Dimensões MVAR */}
        {mvar && (
          <Secao titulo="Dimensões de Análise (MVAR)">
            <StatusDimensao nome="Jurídica" pontos={mvar.dimensoes.juridica.pontos} peso={mvar.dimensoes.juridica.peso} percentual={mvar.dimensoes.juridica.percentual} />
            <StatusDimensao nome="Fiscal" pontos={mvar.dimensoes.fiscal.pontos} peso={mvar.dimensoes.fiscal.peso} percentual={mvar.dimensoes.fiscal.percentual} />
            <StatusDimensao nome="Titularidade" pontos={mvar.dimensoes.titularidade.pontos} peso={mvar.dimensoes.titularidade.peso} percentual={mvar.dimensoes.titularidade.percentual} />
            <StatusDimensao nome="Técnica" pontos={mvar.dimensoes.tecnica.pontos} peso={mvar.dimensoes.tecnica.peso} percentual={mvar.dimensoes.tecnica.percentual} />
          </Secao>
        )}
      </Pagina>

      {/* Página 2: Vetos + UCs + Validação */}
      <Pagina ferramenta={dados.ferramenta}>
        {/* Vetos */}
        {mvar && mvar.vetos.length > 0 && (
          <Secao titulo="Impedimentos (VETO)">
            {mvar.vetos.map((v, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 4, padding: 6, backgroundColor: "#fef2f2", borderRadius: 4 }}>
                <Text style={{ fontSize: 8, fontFamily: "Source Sans 3", fontWeight: 700, color: cores.error, width: 60 }}>{v.origem}</Text>
                <Text style={{ fontSize: 8, color: cores.neutral700, flex: 1 }}>{v.motivo}</Text>
              </View>
            ))}
          </Secao>
        )}

        {/* UCs */}
        {geo && geo.ucs_encontradas.length > 0 && (
          <Secao titulo="Unidades de Conservação Identificadas">
            {geo.ucs_encontradas.map((uc, i) => (
              <View key={i} style={styles.tabelaLinha}>
                <Text style={[styles.tabelaTexto, { flex: 2 }]}>{uc.nome}</Text>
                <Text style={[styles.tabelaTexto, { flex: 1 }]}>{uc.categoria}</Text>
                <Text style={[styles.tabelaValor, { flex: 1 }]}>
                  {uc.percentual_sobreposicao != null ? `${uc.percentual_sobreposicao}%` : "—"}
                </Text>
              </View>
            ))}
          </Secao>
        )}

        {geo && geo.ucs_encontradas.length === 0 && (
          <Secao titulo="Unidades de Conservação">
            <Text style={[styles.texto, { color: cores.error }]}>
              Nenhuma Unidade de Conservação identificada na área do imóvel.
            </Text>
          </Secao>
        )}

        {/* Validação documental */}
        {validacao && (
          <>
            {validacao.pendencias.length > 0 && (
              <Secao titulo="Pendências">
                {validacao.pendencias.map((p, i) => (
                  <Text key={i} style={[styles.texto, { marginBottom: 3 }]}>• {p}</Text>
                ))}
              </Secao>
            )}
            {validacao.pontos_positivos.length > 0 && (
              <Secao titulo="Pontos Positivos">
                {validacao.pontos_positivos.map((p, i) => (
                  <Text key={i} style={[styles.texto, { marginBottom: 3, color: cores.success }]}>• {p}</Text>
                ))}
              </Secao>
            )}
          </>
        )}

        {/* VTN */}
        {mvar?.vtn?.encontrado && (
          <Secao titulo="Valor de Referência (VTN)">
            <LinhaTabela label="Município" valor={mvar.vtn.municipio || "—"} />
            <LinhaTabela label="Categoria" valor={mvar.vtn.categoria_referencia || "—"} />
            <LinhaTabela label="R$/ha" valor={mvar.vtn.valor_referencia ? `R$ ${mvar.vtn.valor_referencia.toLocaleString("pt-BR")}` : "—"} />
            {mvar.vtn.valor_estimado && (
              <LinhaTabela label="Valor Estimado" valor={`R$ ${mvar.vtn.valor_estimado.toLocaleString("pt-BR")}`} />
            )}
            <Text style={[styles.textoMuted, { marginTop: 4 }]}>
              Fonte: {mvar.vtn.fonte} — Exercício {mvar.vtn.exercicio}. {mvar.vtn.nota}
            </Text>
          </Secao>
        )}

        {/* Conclusão */}
        <Secao titulo="Conclusão">
          <Text style={styles.texto}>
            {mvar?.resumo || "Análise concluída. Consulte os detalhes nas seções acima."}
          </Text>
        </Secao>

        <View style={{ marginTop: 16 }}>
          <Text style={styles.textoMuted}>
            Os resultados são estimativas preliminares e não substituem análise de profissional qualificado,
            mediante responsabilidade técnica. Documento gerado em {dataFormatada}.
          </Text>
        </View>
      </Pagina>
    </Document>
  )

  const buffer = await renderToBuffer(pdf)
  return Buffer.from(buffer)
}
