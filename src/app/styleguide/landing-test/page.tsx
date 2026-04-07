"use client"

const storytelling = {
  pre: "Análise de Compensações Ambientais · Minas Gerais",
  titulo: "Com tantas compensações, quais se aplicam ao seu empreendimento?",
  subtitulo: "Identifique obrigações, analise imóveis e prepare documentos — com segurança jurídica e baixo custo.",
  cta: "Checklist gratuito",
  ctaSec: "Conhecer compensações",
}

function HeroDark() {
  return (
    <section style={{
      minHeight: "100vh",
      background: "var(--primary-900)",
      color: "var(--text-on-dark)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      padding: "120px 48px 10vh",
    }}>
      <p style={{
        fontFamily: "var(--font-family)",
        fontSize: "0.72rem",
        fontWeight: 500,
        color: "var(--accent)",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        marginBottom: "28px",
      }}>
        {storytelling.pre}
      </p>
      <h1 style={{
        fontFamily: "var(--font-family-heading)",
        fontSize: "clamp(2.8rem, 6vw, 5rem)",
        fontWeight: 700,
        lineHeight: 1.05,
        letterSpacing: "-0.03em",
        color: "var(--text-on-dark)",
        maxWidth: "700px",
        marginBottom: "32px",
      }}>
        {storytelling.titulo}
      </h1>
      <p style={{
        fontSize: "1.05rem",
        fontWeight: 300,
        color: "var(--text-muted-dark)",
        maxWidth: "480px",
        lineHeight: 1.8,
        marginBottom: "48px",
      }}>
        {storytelling.subtitulo}
      </p>
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <a href="#" style={{
          fontFamily: "var(--font-family)",
          fontWeight: 700,
          fontSize: "0.85rem",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          background: "var(--text-on-dark)",
          color: "var(--primary-900)",
          padding: "16px 40px",
          textDecoration: "none",
        }}>
          {storytelling.cta}
        </a>
        <a href="#" style={{
          fontFamily: "var(--font-family)",
          fontWeight: 500,
          fontSize: "0.85rem",
          color: "var(--text-muted-dark)",
          textDecoration: "none",
        }}>
          {storytelling.ctaSec} ↓
        </a>
      </div>
    </section>
  )
}

function HeroLight() {
  return (
    <section style={{
      minHeight: "100vh",
      background: "#f5f0e8",
      color: "var(--neutral-900)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      padding: "120px 48px 10vh",
    }}>
      <p style={{
        fontFamily: "var(--font-family)",
        fontSize: "0.72rem",
        fontWeight: 500,
        color: "var(--accent)",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        marginBottom: "28px",
      }}>
        {storytelling.pre}
      </p>
      <h1 style={{
        fontFamily: "var(--font-family-heading)",
        fontSize: "clamp(2.8rem, 6vw, 5rem)",
        fontWeight: 700,
        lineHeight: 1.05,
        letterSpacing: "-0.03em",
        color: "var(--primary-600)",
        maxWidth: "700px",
        marginBottom: "32px",
      }}>
        {storytelling.titulo}
      </h1>
      <p style={{
        fontSize: "1.05rem",
        fontWeight: 300,
        color: "var(--neutral-500)",
        maxWidth: "480px",
        lineHeight: 1.8,
        marginBottom: "48px",
      }}>
        {storytelling.subtitulo}
      </p>
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <a href="#" style={{
          fontFamily: "var(--font-family)",
          fontWeight: 700,
          fontSize: "0.85rem",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          background: "var(--primary-600)",
          color: "var(--text-on-dark)",
          padding: "16px 40px",
          textDecoration: "none",
        }}>
          {storytelling.cta}
        </a>
        <a href="#" style={{
          fontFamily: "var(--font-family)",
          fontWeight: 500,
          fontSize: "0.85rem",
          color: "var(--neutral-500)",
          textDecoration: "none",
        }}>
          {storytelling.ctaSec} ↓
        </a>
      </div>
    </section>
  )
}

function HeroMixed() {
  return (
    <section style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, var(--primary-900) 0%, var(--primary-700) 60%, #f5f0e8 100%)",
      color: "var(--text-on-dark)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      padding: "120px 48px 10vh",
    }}>
      <p style={{
        fontFamily: "var(--font-family)",
        fontSize: "0.72rem",
        fontWeight: 500,
        color: "var(--accent)",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        marginBottom: "28px",
      }}>
        {storytelling.pre}
      </p>
      <h1 style={{
        fontFamily: "var(--font-family-heading)",
        fontSize: "clamp(2.8rem, 6vw, 5rem)",
        fontWeight: 700,
        lineHeight: 1.05,
        letterSpacing: "-0.03em",
        color: "var(--text-on-dark)",
        maxWidth: "700px",
        marginBottom: "32px",
      }}>
        {storytelling.titulo}
      </h1>
      <p style={{
        fontSize: "1.05rem",
        fontWeight: 300,
        color: "var(--text-muted-dark)",
        maxWidth: "480px",
        lineHeight: 1.8,
        marginBottom: "48px",
      }}>
        {storytelling.subtitulo}
      </p>
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <a href="#" style={{
          fontFamily: "var(--font-family)",
          fontWeight: 700,
          fontSize: "0.85rem",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          background: "var(--accent)",
          color: "white",
          padding: "16px 40px",
          textDecoration: "none",
        }}>
          {storytelling.cta}
        </a>
        <a href="#" style={{
          fontFamily: "var(--font-family)",
          fontWeight: 500,
          fontSize: "0.85rem",
          color: "var(--text-muted-dark)",
          textDecoration: "none",
        }}>
          {storytelling.ctaSec} ↓
        </a>
      </div>
    </section>
  )
}

export default function LandingTestPage() {
  return (
    <div>
      {/* Indicador */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "var(--neutral-900)", color: "white",
        padding: "8px 24px", fontSize: "0.75rem", textAlign: "center",
        fontFamily: "var(--font-family)",
      }}>
        Teste de hero — role para ver as 3 opções. Mesmo conteúdo, tom visual diferente.
      </div>

      {/* Opção A: Escuro */}
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", top: "48px", right: "48px", zIndex: 10,
          background: "rgba(0,0,0,0.5)", color: "white",
          padding: "8px 16px", fontSize: "0.75rem", borderRadius: "4px",
          fontFamily: "var(--font-family)",
        }}>
          OPÇÃO A — Escuro
        </div>
        <HeroDark />
      </div>

      {/* Opção B: Claro (creme) */}
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", top: "48px", right: "48px", zIndex: 10,
          background: "var(--primary-600)", color: "white",
          padding: "8px 16px", fontSize: "0.75rem", borderRadius: "4px",
          fontFamily: "var(--font-family)",
        }}>
          OPÇÃO B — Claro (creme)
        </div>
        <HeroLight />
      </div>

      {/* Opção C: Gradiente (escuro → claro) */}
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", top: "48px", right: "48px", zIndex: 10,
          background: "rgba(0,0,0,0.5)", color: "white",
          padding: "8px 16px", fontSize: "0.75rem", borderRadius: "4px",
          fontFamily: "var(--font-family)",
        }}>
          OPÇÃO C — Gradiente (escuro → claro)
        </div>
        <HeroMixed />
      </div>
    </div>
  )
}
