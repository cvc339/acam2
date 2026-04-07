import { cn } from "@/lib/utils"

interface LegislacaoItemProps {
  titulo: string
  descricao: string
  linkUrl?: string
}

export function LegislacaoItem({ titulo, descricao, linkUrl }: LegislacaoItemProps) {
  const content = (
    <div className={cn("acam-legislacao-item", linkUrl && "acam-legislacao-item-clickable")}>
      <p className="acam-legislacao-titulo">{titulo}</p>
      <p className="acam-legislacao-desc">{descricao}</p>
    </div>
  )

  if (linkUrl) {
    return (
      <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        {content}
      </a>
    )
  }

  return content
}
