import { cn } from "@/lib/utils"

type Compensacao =
  | "mineraria"
  | "mata-atlantica"
  | "snuc"
  | "app"
  | "reserva-legal"
  | "reposicao-florestal"
  | "ameacadas"
  | "imunes"

interface CompensacaoIconProps {
  compensacao: Compensacao
  size?: number
  className?: string
}

const svgPaths: Record<Compensacao, React.ReactNode> = {
  "mineraria": (
    <>
      <path d="M2 22L12 2l10 20H2z" /><path d="M12 12v4" /><path d="M9 16h6" />
    </>
  ),
  "mata-atlantica": (
    <>
      <path d="M12 22V8" /><path d="M5 12s2-4 7-4 7 4 7 4" /><path d="M7 17s1.5-3 5-3 5 3 5 3" /><path d="M9 7s1-2 3-2 3 2 3 2" />
    </>
  ),
  "snuc": (
    <>
      <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" />
    </>
  ),
  "app": (
    <>
      <path d="M2 18c2-2 4-6 10-6s8 4 10 6" /><path d="M12 12V6" /><circle cx="12" cy="4" r="2" />
    </>
  ),
  "reserva-legal": (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 15h18" /><path d="M9 15v6" />
    </>
  ),
  "reposicao-florestal": (
    <>
      <path d="M12 22V12" /><path d="M8 18s1-3 4-3 4 3 4 3" /><path d="M7 12l5-8 5 8" />
    </>
  ),
  "ameacadas": (
    <>
      <path d="M12 22c-4 0-8-3-8-8 0-3 2-6 4-8l4-4 4 4c2 2 4 5 4 8 0 5-4 8-8 8z" /><path d="M12 22V12" /><path d="M8 16c2-1 4-1 4 0" /><path d="M16 16c-2-1-4-1-4 0" />
    </>
  ),
  "imunes": (
    <>
      <path d="M12 22V10" /><path d="M8 22c0-6 4-8 4-12" /><path d="M16 22c0-6-4-8-4-12" /><circle cx="12" cy="6" r="3" />
    </>
  ),
}

const nomes: Record<Compensacao, string> = {
  "mineraria": "Minerária",
  "mata-atlantica": "Mata Atlântica",
  "snuc": "SNUC",
  "app": "APP",
  "reserva-legal": "Reserva Legal",
  "reposicao-florestal": "Reposição Florestal",
  "ameacadas": "Espécies Ameaçadas",
  "imunes": "Espécies Imunes",
}

export function CompensacaoIcon({ compensacao, size = 32, className }: CompensacaoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      aria-label={nomes[compensacao]}
    >
      {svgPaths[compensacao]}
    </svg>
  )
}

export { nomes as compensacaoNomes }
export type { Compensacao }
