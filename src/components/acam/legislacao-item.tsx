import { cn } from "@/lib/utils"

interface LegislacaoItemProps {
  titulo: string
  descricao: string
  ativo?: boolean
  linkUrl?: string
}

export function LegislacaoItem({ titulo, descricao, ativo = false, linkUrl }: LegislacaoItemProps) {
  const content = (
    <div className={cn("acam-legislacao-item", ativo && "acam-legislacao-item-active")}>
      <p className="acam-legislacao-titulo">{titulo}</p>
      <p className="acam-legislacao-desc">{descricao}</p>
    </div>
  )

  if (linkUrl) {
    return (
      <a href={linkUrl} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    )
  }

  return content
}
