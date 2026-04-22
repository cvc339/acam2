import Link from "next/link"
import { IconBox } from "./icon-box"

type ContextoCTA =
  | "viabilidade"
  | "destinacao-uc"
  | "servidao"
  | "matricula"
  | "snuc"
  | "mata-atlantica"
  | "app"
  | "mineraria"
  | "requerimento"
  | "calculadora"
  | "default"

interface CTAConsultoriaProps {
  contexto?: ContextoCTA
}

const GANCHOS: Record<ContextoCTA, string> = {
  viabilidade: "Quer aprofundar a conversa sobre este caso?",
  "destinacao-uc": "Dúvidas sobre destinação em Unidade de Conservação?",
  servidao: "Dúvidas sobre servidão ambiental ou RPPN?",
  matricula: "Questões registrais complexas no seu caso?",
  snuc: "Quer discutir SNUC e implantação de UC?",
  "mata-atlantica": "Dúvidas sobre compensação em Mata Atlântica?",
  app: "Dúvidas sobre compensação em APP?",
  mineraria: "Dúvidas sobre compensação minerária?",
  requerimento: "Dúvidas sobre o requerimento ou próximos passos?",
  calculadora: "Quer discutir o cálculo no contexto do seu caso?",
  default: "Precisa de uma conversa com um especialista?",
}

/**
 * CTA de consultoria — para colocar no fim de páginas de resultado (gratuitas e pagas).
 *
 * Posicionamento: serviço complementar, nunca conclusivo. Copy usa verbos
 * de conversa ("converse", "tire dúvidas", "discuta"). Proibido: "validação
 * jurídica", "confirmação", "parecer", etc.
 */
export function CTAConsultoria({ contexto = "default" }: CTAConsultoriaProps) {
  const gancho = GANCHOS[contexto]

  return (
    <div className="acam-card">
      <div className="acam-cta-consultoria">
        <IconBox size="lg" color="amber">C</IconBox>
        <div className="acam-cta-consultoria-texto">
          <h3>{gancho}</h3>
          <p>
            Converse 30 minutos, online, com um especialista em compensações ambientais. Tire dúvidas, discuta o caso, explore caminhos — de forma complementar à análise que você acabou de fazer.
          </p>
          <p className="text-sm text-muted-foreground">
            Reunião de 30 min · 15 créditos · único reagendamento permitido
          </p>
        </div>
        <div className="acam-cta-consultoria-acao">
          <Link href="/ferramentas/consultoria" className="acam-btn acam-btn-accent">
            Agendar reunião técnica
          </Link>
        </div>
      </div>
    </div>
  )
}
