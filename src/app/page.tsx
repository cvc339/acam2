import Link from "next/link"
import Image from "next/image"
import { createAdminClient } from "@/lib/supabase/admin"
import { LeadCaptureForm } from "@/components/acam/lead-capture-form"

// Ícones SVG minimalistas P&B para cada compensação
const icons: Record<string, React.ReactNode> = {
  "Minerária": (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 22L12 2l10 20H2z" /><path d="M12 12v4" /><path d="M9 16h6" />
    </svg>
  ),
  "Mata Atlântica": (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V8" /><path d="M5 12s2-4 7-4 7 4 7 4" /><path d="M7 17s1.5-3 5-3 5 3 5 3" /><path d="M9 7s1-2 3-2 3 2 3 2" />
    </svg>
  ),
  "SNUC": (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" />
    </svg>
  ),
  "APP": (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18c2-2 4-6 10-6s8 4 10 6" /><path d="M12 12V6" /><circle cx="12" cy="4" r="2" />
    </svg>
  ),
  "Reserva Legal": (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 15h18" /><path d="M9 15v6" />
    </svg>
  ),
  "Reposição Florestal": (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12" /><path d="M8 18s1-3 4-3 4 3 4 3" /><path d="M7 12l5-8 5 8" />
    </svg>
  ),
  "Espécies Ameaçadas": (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c-4 0-8-3-8-8 0-3 2-6 4-8l4-4 4 4c2 2 4 5 4 8 0 5-4 8-8 8z" /><path d="M12 22V12" /><path d="M8 16c2-1 4-1 4 0" /><path d="M16 16c-2-1-4-1-4 0" />
    </svg>
  ),
  "Espécies Imunes": (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V10" /><path d="M8 22c0-6 4-8 4-12" /><path d="M16 22c0-6-4-8-4-12" /><circle cx="12" cy="6" r="3" />
    </svg>
  ),
}

const compensacoes = [
  {
    nome: "Minerária",
    ferramentas: [
      { nome: "Viabilidade de imóvel", desc: "Saiba se a área serve para a compensação antes de negociar" },
      { nome: "Cálculo de compensação", desc: "Estimativa do valor na modalidade de implantação/manutenção" },
      { nome: "Requerimento", desc: "Preenchimento assistido com exportação em PDF" },
    ],
  },
  {
    nome: "Mata Atlântica",
    ferramentas: [
      { nome: "Viabilidade de imóvel", desc: "Verifica bacia, sub-bacia e bioma antes da aquisição" },
      { nome: "Servidão/RPPN", desc: "Análise para servidão ambiental ou criação de RPPN" },
      { nome: "Requerimento", desc: "Preenchimento assistido com exportação em PDF" },
    ],
  },
  {
    nome: "SNUC",
    ferramentas: [
      { nome: "Calculadora SNUC", desc: "Estimativa do valor da compensação para provisionamento" },
      { nome: "Requerimento", desc: "Preenchimento assistido com exportação em PDF" },
    ],
  },
  {
    nome: "APP",
    ferramentas: [
      { nome: "Viabilidade de imóvel", desc: "Analisa bacia e sub-bacia para destinação em UC" },
    ],
  },
  {
    nome: "Reserva Legal",
    ferramentas: [
      { nome: "Viabilidade de imóvel", desc: "Análise documental e geoespacial para destinação em UC" },
    ],
  },
  {
    nome: "Reposição Florestal",
    ferramentas: [
      { nome: "Cálculo de reposição", desc: "Cálculo com base nos quantitativos de nativa", gratuita: true },
    ],
  },
  {
    nome: "Espécies Ameaçadas",
    ferramentas: [
      { nome: "Informações e legislação", desc: "Normas, modalidades de cumprimento e orientações", gratuita: true },
    ],
  },
  {
    nome: "Espécies Imunes",
    ferramentas: [
      { nome: "Informações e legislação", desc: "Normas, modalidades de cumprimento e orientações", gratuita: true },
    ],
  },
]

export default async function Home() {
  // Buscar preços do banco para a seção de pacotes
  const admin = createAdminClient()
  const { data: configPrecos } = await admin
    .from("configuracoes")
    .select("valor")
    .eq("chave", "precos")
    .single()

  const precos = configPrecos?.valor as { credito_avulso: number; pacotes: Array<{ nome: string; creditos: number; desconto: number }> } | null
  const base = precos?.credito_avulso ?? 12

  const pacotesLanding = [
    { tier: "Avulso", qtd: "1", preco: `R$ ${Math.round(base)}`, per: `R$ ${base.toFixed(2).replace(".", ",")}/cr`, feat: false },
    ...(precos?.pacotes || [
      { nome: "Básico", creditos: 10, desconto: 0.17 },
      { nome: "Intermediário", creditos: 25, desconto: 0.25 },
      { nome: "Premium", creditos: 50, desconto: 0.33 },
    ]).map((p) => {
      const valor = Math.round(p.creditos * base * (1 - p.desconto))
      const perUn = (valor / p.creditos).toFixed(2).replace(".", ",")
      return { tier: p.nome, qtd: String(p.creditos), preco: `R$ ${valor}`, per: `R$ ${perUn}/cr`, feat: p.nome === "Intermediário" || p.nome === "Intermediario" }
    }),
  ]
  return (
    <div style={{ fontFamily: "var(--font-family)" }}>

      {/* NAV */}
      <nav className="landing-nav">
        <Link href="/" aria-label="ACAM" style={{ display: "inline-flex", alignItems: "center" }}>
          <Image
            src="/acam-logo-horizontal-dark.svg"
            alt="ACAM — Compensação ambiental"
            width={180}
            height={50}
            priority
          />
        </Link>
        <Link href="/login" style={{
          fontFamily: "var(--font-family)", fontSize: "0.78rem", fontWeight: 600,
          color: "var(--text-on-dark)", textDecoration: "none",
          letterSpacing: "0.06em",
          border: "1px solid rgba(245,240,232,0.2)",
          padding: "10px 28px",
        }}>
          Entrar
        </Link>
      </nav>

      {/* 01 · HERO — Gradiente escuro → creme */}
      <section className="landing-section" style={{
        minHeight: "100vh",
        paddingTop: "120px", paddingBottom: "10vh",
        background: "linear-gradient(180deg, var(--primary-900) 0%, var(--primary-800) 80%, var(--primary-700) 92%, #f5f0e8 100%)",
        color: "var(--text-on-dark)",
        display: "flex", flexDirection: "column",
        justifyContent: "flex-end",
        position: "relative",
      }}>
        <p style={{
          fontSize: "0.72rem", fontWeight: 500,
          color: "var(--accent)",
          letterSpacing: "0.15em", textTransform: "uppercase",
          marginBottom: "28px",
        }}>
          Análise de Compensações Ambientais · Minas Gerais
        </p>
        <h1 style={{
          fontFamily: "var(--font-family-heading)",
          fontSize: "clamp(2.8rem, 6vw, 5rem)",
          fontWeight: 700, lineHeight: 1.05,
          letterSpacing: "-0.03em",
          color: "#ffffff",
          maxWidth: "700px", marginBottom: "32px",
        }}>
          Com tantas compensações, quais se aplicam ao seu empreendimento?
        </h1>
        <p style={{
          fontSize: "1.05rem", fontWeight: 400,
          color: "rgba(255,255,255,0.7)",
          maxWidth: "480px", lineHeight: 1.8,
          marginBottom: "48px",
        }}>
          Identifique obrigações, analise imóveis, calcule valores e prepare requerimentos — com segurança jurídica e baixo custo.
        </p>
        <div className="landing-cta-row">
          <Link href="/registro" style={{
            fontWeight: 700, fontSize: "0.85rem",
            letterSpacing: "0.04em", textTransform: "uppercase",
            background: "var(--accent)", color: "white",
            padding: "16px 40px", textDecoration: "none",
          }}>
            Checklist gratuito
          </Link>
          <a href="#compensacoes" style={{
            fontWeight: 500, fontSize: "0.85rem",
            color: "var(--text-muted-dark)", textDecoration: "none",
          }}>
            Conhecer compensações ↓
          </a>
        </div>
      </section>

      {/* 02 · AS 8 COMPENSAÇÕES + FERRAMENTAS */}
      <section id="compensacoes" className="landing-section" style={{
        background: "#f5f0e8", color: "var(--neutral-900)",
      }}>
        <div className="landing-inner">
          <p style={{
            fontSize: "0.72rem", fontWeight: 500,
            color: "var(--accent)",
            letterSpacing: "0.15em", textTransform: "uppercase",
            marginBottom: "16px",
          }}>
            Cobertura
          </p>
          <h2 style={{
            fontFamily: "var(--font-family-heading)",
            fontSize: "clamp(2.2rem, 4vw, 3.6rem)",
            fontWeight: 700, lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "var(--primary-600)",
            marginBottom: "16px",
          }}>
            8 compensações. Ferramentas para cada uma delas.
          </h2>
          <p style={{
            fontSize: "0.95rem", color: "var(--neutral-500)",
            maxWidth: "520px", lineHeight: 1.75,
            marginBottom: "64px",
          }}>
            Cada compensação pode ser cumprida de diferentes formas. O ACAM oferece ferramentas de análise, cálculo e preenchimento para todas.
          </p>

          <div className="landing-grid-2" style={{
            borderTop: "2px solid var(--primary-600)",
          }}>
            {compensacoes.map((c, i) => (
              <div key={c.nome} style={{
                padding: "36px 32px 36px 0",
                borderBottom: "1px solid rgba(26,58,42,0.08)",
                borderRight: i % 2 === 0 ? "1px solid rgba(26,58,42,0.06)" : "none",
                paddingLeft: i % 2 === 1 ? "32px" : "0",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  marginBottom: "16px",
                }}>
                  <div style={{ color: "var(--neutral-400)", flexShrink: 0 }}>
                    {icons[c.nome]}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-family-heading)",
                    fontSize: "1.25rem", fontWeight: 600,
                    color: "var(--primary-600)",
                  }}>
                    {c.nome}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {c.ferramentas.map((f) => (
                    <div key={f.nome}>
                      <div style={{
                        fontSize: "0.88rem", fontWeight: 600,
                        color: "var(--neutral-800)",
                        marginBottom: "2px",
                      }}>
                        {f.nome}
                        {"gratuita" in f && f.gratuita && (
                          <span style={{
                            fontSize: "0.65rem", fontWeight: 500,
                            color: "var(--primary-500)",
                            marginLeft: "8px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}>
                            gratuita
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: "0.78rem",
                        color: "var(--neutral-500)",
                        lineHeight: 1.5,
                      }}>
                        {f.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 03 · CENÁRIOS REAIS — Por que o ACAM existe */}
      <section className="landing-section" style={{
        background: "var(--primary-900)", color: "var(--text-on-dark)",
      }}>
        <div className="landing-inner">
          <p style={{
            fontSize: "0.72rem", fontWeight: 500,
            color: "var(--accent)",
            letterSpacing: "0.15em", textTransform: "uppercase",
            marginBottom: "16px",
          }}>
            Por que o ACAM existe
          </p>
          <h2 style={{
            fontFamily: "var(--font-family-heading)",
            fontSize: "clamp(2.2rem, 4vw, 3.6rem)",
            fontWeight: 700, lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "#ffffff",
            maxWidth: "700px",
            marginBottom: "24px",
          }}>
            Decisões erradas custam caro. Informação antecipada custa pouco.
          </h2>
          <p style={{
            fontSize: "0.95rem", color: "rgba(255,255,255,0.6)",
            maxWidth: "560px", lineHeight: 1.75,
            marginBottom: "80px",
          }}>
            Compensações ambientais envolvem legislação complexa, cumulatividade de obrigações e decisões que afetam o empreendimento por anos. Profissionais que atuam nesse campo enfrentam situações como estas:
          </p>

          <div style={{ borderTop: "1px solid rgba(245,240,232,0.08)" }}>
            {[
              {
                situacao: "Seu cliente não sabe quais compensações se aplicam ao empreendimento dele.",
                consequencia: "Sem essa informação, o planejamento ambiental fica incompleto e obrigações aparecem durante o licenciamento — quando o custo de adequação é muito maior.",
                solucao: "O checklist gratuito cruza tipo de empreendimento, localização e atividade para identificar as compensações aplicáveis em minutos.",
              },
              {
                situacao: "Uma área foi adquirida para compensação, mas o órgão recusa recebê-la.",
                consequencia: "O imóvel não atende os requisitos legais — categoria de UC incompatível, ônus na matrícula, ou localização fora da bacia exigida. O investimento é perdido.",
                solucao: "A análise de viabilidade verifica documentação, jurisprudência, dados geoespaciais e requisitos legais antes de qualquer negociação.",
              },
              {
                situacao: "O empreendedor precisa provisionar valores para a compensação SNUC, mas não tem estimativa.",
                consequencia: "Sem estimativa, o orçamento fica descoberto. Se o valor for alto, impacta o fluxo de caixa e pode atrasar o cronograma do empreendimento.",
                solucao: "As calculadoras fornecem estimativas preliminares de valores com base nos parâmetros atuais, permitindo provisionamento antecipado.",
              },
              {
                situacao: "São tantas modalidades de cumprimento que o profissional não sabe qual recomendar.",
                consequencia: "Escolher a modalidade errada pode significar anos de monitoramento desnecessário ou custos muito superiores ao necessário.",
                solucao: "Cada compensação no ACAM apresenta as modalidades disponíveis com requisitos, vantagens e restrições — para que a escolha seja técnica, não intuitiva.",
              },
            ].map((item, i) => (
              <div key={i} className="landing-cenarios-row" style={{
                borderBottom: "1px solid rgba(245,240,232,0.06)",
              }}>
                <div style={{
                  padding: "36px 24px 36px 0",
                  borderRight: "1px solid rgba(245,240,232,0.04)",
                }}>
                  <div style={{
                    fontSize: "0.65rem", color: "var(--accent)",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    marginBottom: "12px", fontWeight: 500,
                  }}>
                    Situação
                  </div>
                  <p style={{
                    fontSize: "0.9rem", color: "#ffffff",
                    lineHeight: 1.6, fontWeight: 500,
                  }}>
                    {item.situacao}
                  </p>
                </div>
                <div style={{
                  padding: "36px 24px",
                  borderRight: "1px solid rgba(245,240,232,0.04)",
                }}>
                  <div style={{
                    fontSize: "0.65rem", color: "rgba(255,255,255,0.3)",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    marginBottom: "12px", fontWeight: 500,
                  }}>
                    Risco
                  </div>
                  <p style={{
                    fontSize: "0.85rem", color: "rgba(255,255,255,0.55)",
                    lineHeight: 1.6,
                  }}>
                    {item.consequencia}
                  </p>
                </div>
                <div style={{ padding: "36px 0 36px 24px" }}>
                  <div style={{
                    fontSize: "0.65rem", color: "var(--accent)",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    marginBottom: "12px", fontWeight: 500,
                  }}>
                    O ACAM resolve
                  </div>
                  <p style={{
                    fontSize: "0.85rem", color: "rgba(255,255,255,0.7)",
                    lineHeight: 1.6,
                  }}>
                    {item.solucao}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 04 · COMO FUNCIONA */}
      <section className="landing-section" style={{
        background: "#f5f0e8", color: "var(--neutral-900)",
      }}>
        <div className="landing-inner">
          <p style={{
            fontSize: "0.72rem", fontWeight: 500,
            color: "var(--accent)",
            letterSpacing: "0.15em", textTransform: "uppercase",
            marginBottom: "16px",
          }}>
            Processo
          </p>
          <h2 style={{
            fontFamily: "var(--font-family-heading)",
            fontSize: "clamp(2.2rem, 4vw, 3.6rem)",
            fontWeight: 700, lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "var(--primary-600)",
            marginBottom: "64px",
          }}>
            Três passos para a decisão certa.
          </h2>

          <div className="landing-grid-3" style={{ borderTop: "2px solid var(--primary-600)" }}>
            {[
              {
                num: "01",
                titulo: "Identifique",
                texto: "Responda ao checklist gratuito e descubra quais das 8 compensações se aplicam. Conheça as modalidades de cumprimento e seus requisitos.",
              },
              {
                num: "02",
                titulo: "Analise",
                texto: "Envie documentos do imóvel. O sistema cruza dados documentais, geoespaciais e jurídicos. Receba uma pontuação de viabilidade com recomendações.",
              },
              {
                num: "03",
                titulo: "Decida",
                texto: "Com o parecer técnico em mãos, tome decisões informadas: negocie imóveis, provisione valores, prepare requerimentos para protocolo.",
              },
            ].map((item) => (
              <div key={item.num} style={{
                padding: "48px 32px 48px 0",
                borderRight: "1px solid rgba(26,58,42,0.06)",
              }}>
                <div style={{
                  fontSize: "0.6rem", color: "var(--accent)",
                  letterSpacing: "0.1em", marginBottom: "20px",
                }}>
                  {item.num}
                </div>
                <h3 style={{
                  fontFamily: "var(--font-family-heading)",
                  fontSize: "1.35rem", fontWeight: 600,
                  color: "var(--primary-600)",
                  marginBottom: "12px",
                }}>
                  {item.titulo}
                </h3>
                <p style={{
                  fontSize: "0.88rem", color: "var(--neutral-500)",
                  lineHeight: 1.7,
                }}>
                  {item.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 05 · COMO USAR */}
      <section className="landing-section" style={{
        background: "#f5f0e8", color: "var(--neutral-900)",
      }}>
        <div className="landing-inner">
          <p style={{
            fontSize: "0.72rem", fontWeight: 500,
            color: "var(--accent)",
            letterSpacing: "0.15em", textTransform: "uppercase",
            marginBottom: "16px",
          }}>
            Como usar
          </p>
          <h2 style={{
            fontFamily: "var(--font-family-heading)",
            fontSize: "clamp(2.2rem, 4vw, 3.6rem)",
            fontWeight: 700, lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "var(--primary-600)",
            marginBottom: "16px",
          }}>
            Comece sem pagar nada.
          </h2>
          <p style={{
            fontSize: "0.95rem", color: "var(--neutral-500)",
            maxWidth: "560px", lineHeight: 1.75,
            marginBottom: "64px",
          }}>
            O ACAM tem ferramentas gratuitas e pagas. As gratuitas já resolvem boa parte das dúvidas. As pagas funcionam com créditos — que não expiram e são reembolsados em caso de falha.
          </p>

          {/* Ferramentas gratuitas */}
          <div className="landing-gratuitas" style={{
            marginBottom: "64px",
          }}>
            {[
              { nome: "Checklist de compensações", desc: "Descubra quais das 8 compensações se aplicam ao seu empreendimento." },
              { nome: "Calculadora de intervenção", desc: "Calcule taxa de expediente, taxa florestal e reposição florestal." },
              { nome: "Cálculo de reposição florestal", desc: "Cálculo com base nos quantitativos de lenha, madeira e carvão de nativa." },
            ].map((f) => (
              <div key={f.nome} style={{
                background: "white",
                border: "1px solid var(--primary-200)",
                borderRadius: "var(--radius-xl)",
                padding: "28px",
              }}>
                <div style={{
                  fontSize: "0.65rem", fontWeight: 600,
                  color: "var(--primary-500)",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  marginBottom: "12px",
                }}>
                  Gratuita
                </div>
                <h3 style={{
                  fontFamily: "var(--font-family-heading)",
                  fontSize: "1.1rem", fontWeight: 600,
                  color: "var(--primary-600)",
                  marginBottom: "8px",
                }}>
                  {f.nome}
                </h3>
                <p style={{
                  fontSize: "0.82rem", color: "var(--neutral-500)",
                  lineHeight: 1.6,
                }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Sistema de créditos */}
          <div style={{
            borderTop: "2px solid var(--primary-600)",
            paddingTop: "48px",
          }}>
            <h3 style={{
              fontFamily: "var(--font-family-heading)",
              fontSize: "1.5rem", fontWeight: 600,
              color: "var(--primary-600)",
              marginBottom: "8px",
            }}>
              Ferramentas pagas: sistema de créditos
            </h3>
            <p style={{
              fontSize: "0.88rem", color: "var(--neutral-500)",
              maxWidth: "480px", lineHeight: 1.75,
              marginBottom: "40px",
            }}>
              Cada ferramenta consome uma quantidade de créditos. Quanto maior o pacote, menor o custo por crédito. Créditos não expiram.
            </p>

            <div className="landing-grid-4">
              {pacotesLanding.map((p) => (
                <div key={p.tier} style={{
                  background: p.feat ? "var(--primary-600)" : "white",
                  color: p.feat ? "var(--text-on-dark)" : "var(--neutral-900)",
                  border: p.feat ? "none" : "1px solid var(--neutral-200)",
                  borderRadius: "var(--radius-xl)",
                  padding: "32px 24px",
                  textAlign: "center",
                }}>
                  <div style={{
                    fontSize: "0.6rem", letterSpacing: "0.15em",
                    textTransform: "uppercase", marginBottom: "20px",
                    color: p.feat ? "var(--accent)" : "var(--neutral-400)",
                    fontWeight: 600,
                  }}>
                    {p.tier}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-family-heading)",
                    fontSize: "2.8rem", fontWeight: 700,
                    lineHeight: 1, marginBottom: "4px",
                  }}>
                    {p.qtd}
                  </div>
                  <div style={{
                    fontSize: "0.72rem",
                    color: p.feat ? "rgba(255,255,255,0.6)" : "var(--neutral-400)",
                    marginBottom: "20px",
                  }}>
                    {p.qtd === "1" ? "crédito" : "créditos"}
                  </div>
                  <div style={{
                    fontSize: "1.2rem", fontWeight: 700,
                    marginBottom: "4px",
                  }}>
                    {p.preco}
                  </div>
                  <div style={{
                    fontSize: "0.7rem",
                    color: p.feat ? "var(--accent)" : "var(--accent)",
                  }}>
                    {p.per}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 06 · QUEM ESTÁ POR TRÁS */}
      <section className="landing-section" style={{
        background: "white", color: "var(--neutral-900)",
        borderTop: "1px solid var(--neutral-200)",
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div className="landing-grid-autoridade">
            {/* Foto */}
            <div>
              <img
                src="/images/claudio-vieira-castro.png"
                alt="Cláudio Vieira Castro"
                style={{
                  width: "100%", maxWidth: "200px", height: "240px",
                  objectFit: "cover", objectPosition: "center top",
                  borderRadius: "var(--radius-xl)",
                  filter: "grayscale(20%)",
                }}
              />
            </div>

            {/* Texto */}
            <div>
              <blockquote style={{
                fontFamily: "var(--font-family-heading)",
                fontSize: "1.4rem", fontWeight: 400,
                lineHeight: 1.5, fontStyle: "italic",
                color: "var(--primary-600)",
                marginBottom: "24px",
                borderLeft: "3px solid var(--accent)",
                paddingLeft: "24px",
              }}>
                &ldquo;Compensações ambientais são decisões que não permitem erro. O ACAM nasceu para que o profissional tenha a informação certa antes de comprometer recursos.&rdquo;
              </blockquote>
              <div style={{ paddingLeft: "27px" }}>
                <div style={{
                  fontSize: "1rem", fontWeight: 600,
                  color: "var(--neutral-900)", marginBottom: "4px",
                }}>
                  Cláudio Vieira Castro
                </div>
                <div style={{
                  fontSize: "0.82rem", color: "var(--neutral-500)",
                  lineHeight: 1.6,
                }}>
                  Advogado · Ex-diretor de Unidades de Conservação do IEF/MG<br />
                  Vieira Castro Advogados · 20+ anos em direito ambiental
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 07 · CTA FINAL */}
      <section className="landing-section" style={{
        background: "var(--primary-900)", color: "var(--text-on-dark)",
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        textAlign: "center",
      }}>
        <h2 style={{
          fontFamily: "var(--font-family-heading)",
          fontSize: "clamp(2rem, 4vw, 3rem)",
          fontWeight: 700, lineHeight: 1.1,
          letterSpacing: "-0.03em",
          color: "#ffffff",
          maxWidth: "550px", marginBottom: "32px",
        }}>
          Descubra quais compensações se aplicam ao seu caso.
        </h2>
        <p style={{
          fontSize: "0.9rem", color: "rgba(255,255,255,0.6)",
          maxWidth: "400px", lineHeight: 1.7,
          marginBottom: "36px",
        }}>
          Comece pelo checklist gratuito. Sem cartão de crédito, sem compromisso.
        </p>
        <Link href="/registro" style={{
          fontWeight: 700, fontSize: "0.85rem",
          letterSpacing: "0.04em", textTransform: "uppercase",
          background: "var(--accent)", color: "white",
          padding: "18px 44px", textDecoration: "none",
        }}>
          Criar conta gratuita
        </Link>
      </section>

      {/* NEWSLETTER / LEAD CAPTURE */}
      <section className="landing-section" style={{
        background: "var(--primary-50)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <p style={{
            fontSize: "0.7rem", fontWeight: 600,
            color: "var(--accent)", letterSpacing: "0.15em",
            textTransform: "uppercase", marginBottom: "12px",
          }}>
            Fique por dentro
          </p>
          <h2 style={{
            fontFamily: "var(--font-family-heading)",
            fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
            fontWeight: 700, lineHeight: 1.2,
            color: "var(--primary-600)", marginBottom: "12px",
          }}>
            Receba novidades do ACAM
          </h2>
          <p style={{
            fontSize: "0.9rem", color: "var(--neutral-500)",
            lineHeight: 1.7, marginBottom: "32px",
          }}>
            Atualizações sobre novas ferramentas, mudanças na legislação e dicas para compensações ambientais.
          </p>
          <LeadCaptureForm />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-section" style={{
        background: "var(--primary-900)",
        borderTop: "1px solid rgba(245,240,232,0.06)",
        paddingTop: "48px", paddingBottom: "0",
      }}>
        <div className="landing-grid-footer" style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {/* Coluna 1: Marca */}
          <div>
            <div style={{ marginBottom: "12px" }}>
              <Image
                src="/acam-logo-horizontal-dark.svg"
                alt="ACAM — Compensação ambiental"
                width={180}
                height={50}
              />
            </div>
            <p style={{
              fontSize: "0.78rem", color: "rgba(245,240,232,0.4)",
              lineHeight: 1.6,
            }}>
              Análise de Compensações Ambientais de Minas Gerais.
              Uma plataforma Vieira Castro Advogados.
            </p>
          </div>

          {/* Coluna 2: Plataforma */}
          <div>
            <div style={{
              fontSize: "0.65rem", fontWeight: 600,
              color: "rgba(245,240,232,0.3)",
              letterSpacing: "0.1em", textTransform: "uppercase",
              marginBottom: "16px",
            }}>
              Plataforma
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link href="/registro" style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)", textDecoration: "none" }}>Criar conta</Link>
              <Link href="/login" style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)", textDecoration: "none" }}>Entrar</Link>
              <a href="#compensacoes" style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)", textDecoration: "none" }}>Compensações</a>
            </div>
          </div>

          {/* Coluna 3: Legal */}
          <div>
            <div style={{
              fontSize: "0.65rem", fontWeight: 600,
              color: "rgba(245,240,232,0.3)",
              letterSpacing: "0.1em", textTransform: "uppercase",
              marginBottom: "16px",
            }}>
              Legal
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link href="/termos" style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)", textDecoration: "none" }}>Termos de uso</Link>
              <Link href="/privacidade" style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)", textDecoration: "none" }}>Política de privacidade</Link>
            </div>
          </div>

          {/* Coluna 4: Contato */}
          <div>
            <div style={{
              fontSize: "0.65rem", fontWeight: 600,
              color: "rgba(245,240,232,0.3)",
              letterSpacing: "0.1em", textTransform: "uppercase",
              marginBottom: "16px",
            }}>
              Contato
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="mailto:atendimento@vieiracastro.com.br" style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)", textDecoration: "none" }}>atendimento@vieiracastro.com.br</a>
              <a href="https://vieiracastro.com.br" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)", textDecoration: "none" }}>vieiracastro.com.br</a>
            </div>
          </div>
        </div>

        {/* Linha inferior */}
        <div className="landing-footer-bottom" style={{
          maxWidth: "1100px", margin: "32px auto 0",
          paddingTop: "24px",
          borderTop: "1px solid rgba(245,240,232,0.06)",
          display: "flex", justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{ fontSize: "0.65rem", color: "rgba(245,240,232,0.2)" }}>
            © 2026 ACAM · Vieira Castro Sociedade Individual de Advocacia
          </span>
          <span style={{ fontSize: "0.65rem", color: "rgba(245,240,232,0.15)" }}>
            Montes Claros, MG
          </span>
        </div>
      </footer>
    </div>
  )
}
