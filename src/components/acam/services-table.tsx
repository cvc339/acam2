import { Button } from "@/components/ui/button"
import { StatusBadge } from "./status-badge"

interface Ferramenta {
  nome: string
  descricao: string
  compensacao: string
  creditos: string
  ativo: boolean
  href?: string
}

interface ServicesTableProps {
  ferramentas: Ferramenta[]
}

export function ServicesTable({ ferramentas }: ServicesTableProps) {
  return (
    <table className="acam-services-table">
      <thead>
        <tr>
          <th>Serviço</th>
          <th>Compensação</th>
          <th>Créditos</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {ferramentas.map((f) => (
          <tr key={f.nome}>
            <td>
              <div className="font-medium">{f.nome}</div>
              <div className="text-xs text-muted-foreground">{f.descricao}</div>
            </td>
            <td><StatusBadge variant="primary">{f.compensacao}</StatusBadge></td>
            <td className="font-semibold">{f.creditos}</td>
            <td>
              {f.ativo ? (
                <Button size="sm">Acessar</Button>
              ) : (
                <StatusBadge variant="dev">Em breve</StatusBadge>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
