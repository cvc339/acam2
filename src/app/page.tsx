import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TreePine, ArrowRight, Shield, FileText, Calculator, ChevronRight } from "lucide-react"

const compensacoes = [
  "Minerária",
  "Mata Atlântica",
  "APP",
  "SNUC",
  "Reserva Legal",
  "Reposição Florestal",
  "Espécies Ameaçadas",
  "Espécies Imunes",
]

const ferramentas = [
  {
    nome: "Destinação em UC",
    descricao: "Análise completa de viabilidade de imóvel para destinação em Unidade de Conservação. Documental, geoespacial e jurídica.",
    tipo: "Análise",
  },
  {
    nome: "Calculadora SNUC",
    descricao: "Cálculo automático da compensação ambiental com sobreposição de áreas e fatores de compensação.",
    tipo: "Cálculo",
  },
  {
    nome: "Requerimentos",
    descricao: "Preenchimento assistido dos formulários oficiais com exportação em PDF, pronto para protocolo.",
    tipo: "Formulário",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-border/40">
        <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <TreePine className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">ACAM</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#compensacoes" className="hover:text-foreground transition-colors">Compensações</a>
            <a href="#ferramentas" className="hover:text-foreground transition-colors">Ferramentas</a>
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm">Entrar</Button>
            </Link>
            <Link href="/registro">
              <Button size="sm" className="text-sm">Criar conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — inspiração Apple: muito espaço, poucas palavras, tipografia grande */}
      <section className="pt-32 pb-24 md:pt-44 md:pb-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-medium text-[#b87333] tracking-wide uppercase mb-6">
            Minas Gerais
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] text-foreground">
            Compensações ambientais,{" "}
            <span className="text-primary">antes da decisão.</span>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Antecipe problemas. Analise imóveis, calcule obrigações e prepare
            requerimentos — com segurança e baixo custo.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/registro">
              <Button size="lg" className="px-8 text-base">
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#como-funciona">
              <Button variant="ghost" size="lg" className="text-base text-muted-foreground">
                Como funciona
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Compensações — lista clean, sem cards */}
      <section id="compensacoes" className="py-24 md:py-32 px-6 border-t">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-medium text-[#b87333] tracking-wide uppercase mb-4">
            Cobertura
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            8 compensações previstas<br />na legislação de MG.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-lg">
            Cada compensação possui modalidades de cumprimento. O ACAM cobre
            as modalidades com ferramentas de análise e cálculo.
          </p>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-0">
            {compensacoes.map((nome, i) => (
              <div
                key={nome}
                className="flex items-center justify-between py-5 px-1 border-b group cursor-default"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground font-mono w-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-base font-medium group-hover:text-primary transition-colors">
                    {nome}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ferramentas — 3 blocos com muito espaço */}
      <section id="ferramentas" className="py-24 md:py-32 px-6 bg-primary/[0.02] border-t">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-medium text-[#b87333] tracking-wide uppercase mb-4">
            Ferramentas
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Análise profissional,<br />resultado imediato.
          </h2>
          <div className="mt-16 space-y-0">
            {ferramentas.map((f, i) => (
              <div
                key={f.nome}
                className="flex flex-col md:flex-row md:items-start gap-4 md:gap-16 py-10 border-b last:border-b-0"
              >
                <div className="md:w-48 shrink-0">
                  <span className="text-xs font-medium text-[#b87333] tracking-wide uppercase">
                    {f.tipo}
                  </span>
                  <h3 className="text-xl font-semibold mt-1">{f.nome}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {f.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona — 3 passos, clean */}
      <section id="como-funciona" className="py-24 md:py-32 px-6 border-t">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-medium text-[#b87333] tracking-wide uppercase mb-4">
            Processo
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Simples de usar.
          </h2>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              {
                passo: "01",
                titulo: "Identifique",
                texto: "Responda ao checklist gratuito e descubra quais compensações se aplicam ao seu empreendimento.",
              },
              {
                passo: "02",
                titulo: "Analise",
                texto: "Envie os documentos do imóvel. O sistema cruza dados documentais, geoespaciais e jurídicos automaticamente.",
              },
              {
                passo: "03",
                titulo: "Decida",
                texto: "Receba um parecer técnico com pontuação de viabilidade, mapa interativo e recomendações.",
              },
            ].map((item) => (
              <div key={item.passo}>
                <span className="text-5xl font-bold text-primary/10">{item.passo}</span>
                <h3 className="text-xl font-semibold mt-4">{item.titulo}</h3>
                <p className="text-muted-foreground mt-3 leading-relaxed">
                  {item.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-24 md:py-32 px-6 border-t">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Comece a usar o ACAM.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Ferramentas gratuitas disponíveis. Sem cartão de crédito.
          </p>
          <div className="mt-10">
            <Link href="/registro">
              <Button size="lg" className="px-8 text-base">
                Criar conta gratuita
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <TreePine className="h-4 w-4 text-primary" />
            <span>ACAM — Análise de Compensações Ambientais</span>
          </div>
          <div>
            Minas Gerais, Brasil
          </div>
        </div>
      </footer>
    </div>
  )
}
