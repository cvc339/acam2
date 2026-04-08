/**
 * Template base de PDF do ACAM
 * Usado por todas as ferramentas que geram relatório
 *
 * Layout: capa + páginas de conteúdo com header/footer
 * Identidade: verde floresta + cobre, tipografia profissional
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"

// Registra fontes Source Sans 3 + Source Serif 4
import "@/lib/pdf/fonts"

// Cores do design system ACAM
const cores = {
  primary600: "#1a3a2a",
  primary700: "#142e21",
  primary50: "#f0ebe3",
  primary100: "#e3d9cd",
  accent: "#c17f59",
  neutral50: "#fafafa",
  neutral200: "#e5e5e5",
  neutral400: "#a3a3a3",
  neutral500: "#737373",
  neutral700: "#404040",
  neutral800: "#262626",
  neutral900: "#171717",
  success: "#16a34a",
  error: "#dc2626",
  warning: "#f59e0b",
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Source Sans 3",
    fontSize: 9,
    color: cores.neutral800,
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  // Capa
  capa: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  capaLogo: {
    fontSize: 28,
    fontFamily: "Source Serif 4", fontWeight: 700,
    color: cores.primary600,
    letterSpacing: 4,
    marginBottom: 8,
  },
  capaSubtitulo: {
    fontSize: 10,
    color: cores.neutral500,
    marginBottom: 60,
  },
  capaTitulo: {
    fontSize: 18,
    fontFamily: "Source Serif 4", fontWeight: 700,
    color: cores.primary600,
    textAlign: "center",
    marginBottom: 12,
  },
  capaDescricao: {
    fontSize: 10,
    color: cores.neutral500,
    textAlign: "center",
    maxWidth: 350,
    lineHeight: 1.6,
    marginBottom: 40,
  },
  capaData: {
    fontSize: 9,
    color: cores.neutral400,
  },
  capaRodape: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
  },
  capaDisclaimer: {
    fontSize: 7,
    color: cores.neutral400,
    textAlign: "center",
    lineHeight: 1.5,
  },
  // Header de página
  header: {
    position: "absolute",
    top: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: cores.neutral200,
  },
  headerLogo: {
    fontSize: 10,
    fontFamily: "Source Sans 3", fontWeight: 700,
    color: cores.primary600,
    letterSpacing: 2,
  },
  headerFerramenta: {
    fontSize: 7,
    color: cores.neutral500,
  },
  // Footer de página
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: cores.neutral200,
  },
  footerTexto: {
    fontSize: 7,
    color: cores.neutral400,
  },
  footerPagina: {
    fontSize: 7,
    color: cores.neutral400,
  },
  // Conteúdo
  secao: {
    marginBottom: 16,
  },
  secaoTitulo: {
    fontSize: 12,
    fontFamily: "Source Serif 4", fontWeight: 600,
    color: cores.primary600,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: cores.primary100,
  },
  secaoSubtitulo: {
    fontSize: 10,
    fontFamily: "Source Sans 3", fontWeight: 700,
    color: cores.neutral700,
    marginBottom: 6,
  },
  texto: {
    fontSize: 9,
    lineHeight: 1.6,
    color: cores.neutral700,
  },
  textoMuted: {
    fontSize: 8,
    color: cores.neutral500,
    lineHeight: 1.5,
  },
  // Tabela
  tabelaHeader: {
    flexDirection: "row",
    backgroundColor: cores.primary50,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: cores.primary100,
  },
  tabelaHeaderTexto: {
    fontSize: 8,
    fontFamily: "Source Sans 3", fontWeight: 700,
    color: cores.primary600,
  },
  tabelaLinha: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: cores.neutral200,
  },
  tabelaTexto: {
    fontSize: 8,
    color: cores.neutral700,
  },
  tabelaValor: {
    fontSize: 8,
    fontFamily: "Source Sans 3", fontWeight: 700,
    color: cores.primary700,
    textAlign: "right",
  },
  // Card de destaque
  cardDestaque: {
    backgroundColor: cores.primary600,
    color: "white",
    borderRadius: 8,
    padding: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  cardDestaqueLabel: {
    fontSize: 8,
    color: cores.primary100,
    marginBottom: 4,
  },
  cardDestaqueValor: {
    fontSize: 22,
    fontFamily: "Source Sans 3", fontWeight: 700,
    color: "white",
  },
  // Ficha DAE
  fichaContainer: {
    borderWidth: 1,
    borderColor: cores.primary100,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    backgroundColor: cores.neutral50,
  },
  fichaTitulo: {
    fontSize: 10,
    fontFamily: "Source Serif 4", fontWeight: 600,
    color: cores.primary600,
    marginBottom: 8,
  },
  fichaCampo: {
    backgroundColor: "white",
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  fichaRotulo: {
    fontSize: 7,
    color: cores.neutral500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fichaConteudo: {
    fontSize: 9,
    fontFamily: "Source Sans 3", fontWeight: 700,
    color: cores.neutral800,
  },
  fichaValorDestaque: {
    fontSize: 14,
    fontFamily: "Source Sans 3", fontWeight: 700,
    color: cores.primary600,
  },
})

// ============================================
// COMPONENTES REUTILIZÁVEIS
// ============================================

interface CapaProps {
  ferramenta: string
  descricao: string
  data: string
  ufemgAno?: number
  ufemgValor?: number
}

export function Capa({ ferramenta, descricao, data, ufemgAno, ufemgValor }: CapaProps) {
  return (
    <Page size="A4" style={[styles.page, { paddingTop: 0, paddingBottom: 0 }]}>
      <View style={styles.capa}>
        <Text style={styles.capaLogo}>ACAM</Text>
        <Text style={styles.capaSubtitulo}>Análise de Compensações Ambientais</Text>
        <Text style={styles.capaTitulo}>{ferramenta}</Text>
        <Text style={styles.capaDescricao}>{descricao}</Text>
        <Text style={styles.capaData}>{data}</Text>
        {ufemgAno && ufemgValor && (
          <Text style={[styles.capaData, { marginTop: 4 }]}>
            UFEMG {ufemgAno}: R$ {ufemgValor.toFixed(4).replace(".", ",")}
          </Text>
        )}
      </View>
      <View style={styles.capaRodape}>
        <Text style={styles.capaDisclaimer}>
          ACAM — Vieira Castro Sociedade Individual de Advocacia{"\n"}
          Os resultados são estimativas preliminares e não substituem análise de profissional qualificado.
        </Text>
      </View>
    </Page>
  )
}

interface PaginaProps {
  ferramenta: string
  children: React.ReactNode
}

export function Pagina({ ferramenta, children }: PaginaProps) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header} fixed>
        <Text style={styles.headerLogo}>ACAM</Text>
        <Text style={styles.headerFerramenta}>{ferramenta}</Text>
      </View>
      {children}
      <View style={styles.footer} fixed>
        <Text style={styles.footerTexto}>
          ACAM — Vieira Castro Advogados — acam.com.br
        </Text>
        <Text style={styles.footerPagina} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  )
}

export function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.secao}>
      <Text style={styles.secaoTitulo}>{titulo}</Text>
      {children}
    </View>
  )
}

export function CardDestaque({ label, valor, sublabel }: { label: string; valor: string; sublabel?: string }) {
  return (
    <View style={styles.cardDestaque}>
      <Text style={styles.cardDestaqueLabel}>{label}</Text>
      <Text style={styles.cardDestaqueValor}>{valor}</Text>
      {sublabel && <Text style={[styles.cardDestaqueLabel, { marginTop: 4 }]}>{sublabel}</Text>}
    </View>
  )
}

export function FichaDAE({ titulo, orgao, servico, valor, infoComplementares }: {
  titulo: string
  orgao: string
  servico: string
  valor: string
  infoComplementares: string
}) {
  return (
    <View style={styles.fichaContainer}>
      <Text style={styles.fichaTitulo}>{titulo}</Text>
      <View style={styles.fichaCampo}>
        <Text style={styles.fichaRotulo}>Órgão Público</Text>
        <Text style={styles.fichaConteudo}>{orgao}</Text>
      </View>
      <View style={styles.fichaCampo}>
        <Text style={styles.fichaRotulo}>Serviço</Text>
        <Text style={styles.fichaConteudo}>{servico}</Text>
      </View>
      <View style={[styles.fichaCampo, { backgroundColor: cores.primary50, borderWidth: 1, borderColor: cores.primary100 }]}>
        <Text style={styles.fichaRotulo}>Valor da Receita</Text>
        <Text style={styles.fichaValorDestaque}>{valor}</Text>
      </View>
      <View style={styles.fichaCampo}>
        <Text style={styles.fichaRotulo}>Informações Complementares</Text>
        <Text style={[styles.texto, { fontSize: 7, fontFamily: "Courier" }]}>{infoComplementares}</Text>
      </View>
    </View>
  )
}

export { Document, styles, cores }
