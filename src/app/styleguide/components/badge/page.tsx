"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/acam"

export default function BadgeShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Badges</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Componente: StatusBadge. Variantes semânticas centralizadas.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Status de consulta</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge variant="secondary">Pendente</Badge>
          <StatusBadge variant="primary">Processando</StatusBadge>
          <StatusBadge variant="success">Concluída</StatusBadge>
          <StatusBadge variant="error">Erro</StatusBadge>
          <StatusBadge variant="warning">Reembolsada</StatusBadge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Classificação MVAR</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <StatusBadge variant="success">Adequado (90-100)</StatusBadge>
          <StatusBadge variant="warning">Pendências (60-89)</StatusBadge>
          <StatusBadge variant="error">Não atende (0-55)</StatusBadge>
          <StatusBadge variant="error" className="font-bold">VETO</StatusBadge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Tipo de compensação</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <StatusBadge variant="primary">Minerária</StatusBadge>
          <StatusBadge variant="primary">Mata Atlântica</StatusBadge>
          <StatusBadge variant="primary">APP</StatusBadge>
          <StatusBadge variant="primary">SNUC</StatusBadge>
          <StatusBadge variant="primary">Reserva Legal</StatusBadge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Custo de ferramenta</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <StatusBadge variant="success">Gratuita</StatusBadge>
          <StatusBadge variant="accent">5 créditos</StatusBadge>
          <StatusBadge variant="accent">7 créditos</StatusBadge>
          <StatusBadge variant="accent">0,5 crédito</StatusBadge>
          <StatusBadge variant="dev">Em desenvolvimento</StatusBadge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Ônus e gravames (matrícula)</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <StatusBadge variant="error">Impede transferência</StatusBadge>
          <StatusBadge variant="warning">Dificulta</StatusBadge>
          <StatusBadge variant="success">Não prejudica</StatusBadge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Código</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">{`import { StatusBadge } from "@/components/acam"

<StatusBadge variant="success">Adequado</StatusBadge>
<StatusBadge variant="warning">Pendências</StatusBadge>
<StatusBadge variant="error">VETO</StatusBadge>
<StatusBadge variant="primary">Minerária</StatusBadge>
<StatusBadge variant="accent">5 créditos</StatusBadge>
<StatusBadge variant="dev">Em desenvolvimento</StatusBadge>

{/* Para neutro, usar shadcn diretamente */}
<Badge variant="secondary">Pendente</Badge>`}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
