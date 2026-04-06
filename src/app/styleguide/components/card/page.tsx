"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function CardShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Cards</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Blocos de conteúdo. Componente shadcn Card + classes acam-card para variantes.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Card padrão (shadcn)</CardTitle></CardHeader>
        <CardContent>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Destinação em UC — Base</CardTitle>
              <CardDescription>Análise de viabilidade para regularização fundiária em UC</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge className="badge-accent">5 créditos</Badge>
                <Button size="sm">Acessar</Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Card clicável (acam-card-hover)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {["Checklist", "Comprar créditos", "Extrato"].map((name) => (
              <div key={name} className="acam-card acam-card-hover acam-card-compact text-center cursor-pointer">
                <div className="acam-icon-box mx-auto mb-3">{name[0]}</div>
                <h4 className="font-medium text-sm">{name}</h4>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Variantes ACAM</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="acam-card acam-card-primary acam-card-compact">
            <p className="font-medium">acam-card-primary — Fundo primary-50, borda primary-200</p>
          </div>
          <div className="acam-card acam-card-dark acam-card-compact">
            <p>acam-card-dark — Fundo escuro para seções de destaque</p>
          </div>
          <div className="acam-card acam-card-disabled acam-card-compact flex justify-between items-center">
            <p className="font-medium">acam-card-disabled — Em desenvolvimento</p>
            <Badge className="badge-dev">Em breve</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
