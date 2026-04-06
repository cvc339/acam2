"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function BreadcrumbShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Breadcrumb</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Navegação hierárquica. Mostra onde o usuário está no sistema.
          Classe: acam-breadcrumb.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Padrão</CardTitle></CardHeader>
        <CardContent>
          <nav className="acam-breadcrumb">
            <a href="#" className="acam-breadcrumb-link">Dashboard</a>
            <span className="acam-breadcrumb-separator">/</span>
            <a href="#" className="acam-breadcrumb-link">Compensação Minerária</a>
            <span className="acam-breadcrumb-separator">/</span>
            <span className="text-sm">Destinação em UC — Base</span>
          </nav>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Exemplos no contexto ACAM</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <nav className="acam-breadcrumb">
            <a href="#" className="acam-breadcrumb-link">Dashboard</a>
            <span className="acam-breadcrumb-separator">/</span>
            <span className="text-sm">Comprar créditos</span>
          </nav>

          <nav className="acam-breadcrumb">
            <a href="#" className="acam-breadcrumb-link">Dashboard</a>
            <span className="acam-breadcrumb-separator">/</span>
            <a href="#" className="acam-breadcrumb-link">Compensação Mata Atlântica</a>
            <span className="acam-breadcrumb-separator">/</span>
            <span className="text-sm">Requerimento</span>
          </nav>

          <nav className="acam-breadcrumb">
            <a href="#" className="acam-breadcrumb-link">Dashboard</a>
            <span className="acam-breadcrumb-separator">/</span>
            <a href="#" className="acam-breadcrumb-link">Consultas</a>
            <span className="acam-breadcrumb-separator">/</span>
            <span className="text-sm">Fazenda Santa Maria (#2847)</span>
          </nav>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Classes disponíveis</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">{`<nav className="acam-breadcrumb">
  <a href="..." className="acam-breadcrumb-link">Dashboard</a>
  <span className="acam-breadcrumb-separator">/</span>
  <a href="..." className="acam-breadcrumb-link">Compensação</a>
  <span className="acam-breadcrumb-separator">/</span>
  <span className="text-sm">Página atual</span>
</nav>`}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
