"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function IconBoxShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Icon Box</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Caixa com fundo colorido para ícones. Usado em cards de ações rápidas, compensações e service headers.
          Classes: acam-icon-box + tamanho + cor.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Tamanhos</CardTitle></CardHeader>
        <CardContent className="flex items-end gap-4">
          <div className="text-center">
            <div className="acam-icon-box acam-icon-box-sm">A</div>
            <div className="text-xs mt-1 text-muted-foreground">sm</div>
          </div>
          <div className="text-center">
            <div className="acam-icon-box acam-icon-box-md">A</div>
            <div className="text-xs mt-1 text-muted-foreground">md</div>
          </div>
          <div className="text-center">
            <div className="acam-icon-box acam-icon-box-lg">A</div>
            <div className="text-xs mt-1 text-muted-foreground">lg</div>
          </div>
          <div className="text-center">
            <div className="acam-icon-box acam-icon-box-xl">UC</div>
            <div className="text-xs mt-1 text-muted-foreground">xl</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Cores</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="text-center">
            <div className="acam-icon-box acam-icon-box-lg">M</div>
            <div className="text-xs mt-1 text-muted-foreground">primary (padrão)</div>
          </div>
          <div className="text-center">
            <div className="acam-icon-box acam-icon-box-lg acam-icon-box-amber">A</div>
            <div className="text-xs mt-1 text-muted-foreground">amber</div>
          </div>
          <div className="text-center">
            <div className="acam-icon-box acam-icon-box-lg acam-icon-box-blue">I</div>
            <div className="text-xs mt-1 text-muted-foreground">blue</div>
          </div>
          <div className="text-center">
            <div className="acam-icon-box acam-icon-box-lg acam-icon-box-green">S</div>
            <div className="text-xs mt-1 text-muted-foreground">green</div>
          </div>
          <div className="text-center">
            <div className="acam-icon-box acam-icon-box-lg acam-icon-box-red">E</div>
            <div className="text-xs mt-1 text-muted-foreground">red</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">No contexto ACAM</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="acam-card acam-card-hover acam-card-compact text-center cursor-pointer">
              <div className="acam-icon-box acam-icon-box-lg mx-auto mb-3">✓</div>
              <h4 className="font-medium text-sm">Checklist</h4>
              <p className="text-xs text-muted-foreground mt-1">Avaliação gratuita</p>
            </div>
            <div className="acam-card acam-card-hover acam-card-compact text-center cursor-pointer">
              <div className="acam-icon-box acam-icon-box-lg acam-icon-box-amber mx-auto mb-3">$</div>
              <h4 className="font-medium text-sm">Créditos</h4>
              <p className="text-xs text-muted-foreground mt-1">Comprar créditos</p>
            </div>
            <div className="acam-card acam-card-hover acam-card-compact text-center cursor-pointer">
              <div className="acam-icon-box acam-icon-box-lg acam-icon-box-blue mx-auto mb-3">R</div>
              <h4 className="font-medium text-sm">Extrato</h4>
              <p className="text-xs text-muted-foreground mt-1">Histórico de uso</p>
            </div>
            <div className="acam-card acam-card-hover acam-card-compact text-center cursor-pointer">
              <div className="acam-icon-box acam-icon-box-lg mx-auto mb-3">UC</div>
              <h4 className="font-medium text-sm">Destinação</h4>
              <p className="text-xs text-muted-foreground mt-1">Análise de imóvel</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Classes disponíveis</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">{`/* Tamanhos */
<div className="acam-icon-box acam-icon-box-sm">...</div>
<div className="acam-icon-box acam-icon-box-md">...</div>
<div className="acam-icon-box acam-icon-box-lg">...</div>
<div className="acam-icon-box acam-icon-box-xl">...</div>

/* Cores (padrão é primary) */
<div className="acam-icon-box acam-icon-box-lg acam-icon-box-amber">...</div>
<div className="acam-icon-box acam-icon-box-lg acam-icon-box-blue">...</div>
<div className="acam-icon-box acam-icon-box-lg acam-icon-box-green">...</div>
<div className="acam-icon-box acam-icon-box-lg acam-icon-box-red">...</div>`}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
