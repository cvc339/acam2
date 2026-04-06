"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function BadgeShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Badges</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Indicadores de status, categoria e classificação. Usar classes centralizadas: badge-success, badge-warning, badge-error, badge-primary, badge-accent.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Status de consulta</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge variant="secondary">Pendente</Badge>
          <Badge className="badge-primary">Processando</Badge>
          <Badge className="badge-success">Concluída</Badge>
          <Badge className="badge-error">Erro</Badge>
          <Badge className="badge-warning">Reembolsada</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Classificação MVAR</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge className="badge-success">Adequado (90-100)</Badge>
          <Badge className="badge-warning">Pendências (60-89)</Badge>
          <Badge className="badge-error">Não atende (0-55)</Badge>
          <Badge className="badge-error font-bold">VETO</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Tipo de compensação</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge className="badge-primary">Minerária</Badge>
          <Badge className="badge-primary">Mata Atlântica</Badge>
          <Badge className="badge-primary">APP</Badge>
          <Badge className="badge-primary">SNUC</Badge>
          <Badge className="badge-primary">Reserva Legal</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Custo de ferramenta</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge className="badge-success">Gratuita</Badge>
          <Badge className="badge-accent">5 créditos</Badge>
          <Badge className="badge-accent">7 créditos</Badge>
          <Badge className="badge-accent">0,5 crédito</Badge>
          <Badge className="badge-dev">Em desenvolvimento</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Ônus e gravames (matrícula)</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge className="badge-error">Impede transferência</Badge>
          <Badge className="badge-warning">Dificulta</Badge>
          <Badge className="badge-success">Não prejudica</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Classes disponíveis</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">{`<Badge className="badge-success">Adequado</Badge>
<Badge className="badge-warning">Pendências</Badge>
<Badge className="badge-error">VETO</Badge>
<Badge className="badge-primary">Minerária</Badge>
<Badge className="badge-accent">5 créditos</Badge>
<Badge className="badge-dev">Em desenvolvimento</Badge>
<Badge variant="secondary">Pendente (neutro)</Badge>`}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
