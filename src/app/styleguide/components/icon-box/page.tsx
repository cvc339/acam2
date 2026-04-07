"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconBox } from "@/components/acam"

export default function IconBoxShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Icon Box</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Componente: IconBox. Caixa com fundo colorido para ícones e iniciais.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Tamanhos</CardTitle></CardHeader>
        <CardContent className="flex items-end gap-4">
          <div className="text-center">
            <IconBox size="sm">A</IconBox>
            <div className="text-xs mt-1 text-muted-foreground">sm</div>
          </div>
          <div className="text-center">
            <IconBox size="md">A</IconBox>
            <div className="text-xs mt-1 text-muted-foreground">md</div>
          </div>
          <div className="text-center">
            <IconBox size="lg">A</IconBox>
            <div className="text-xs mt-1 text-muted-foreground">lg</div>
          </div>
          <div className="text-center">
            <IconBox size="xl">UC</IconBox>
            <div className="text-xs mt-1 text-muted-foreground">xl</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Cores</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="text-center">
            <IconBox>M</IconBox>
            <div className="text-xs mt-1 text-muted-foreground">primary</div>
          </div>
          <div className="text-center">
            <IconBox color="amber">A</IconBox>
            <div className="text-xs mt-1 text-muted-foreground">amber</div>
          </div>
          <div className="text-center">
            <IconBox color="blue">I</IconBox>
            <div className="text-xs mt-1 text-muted-foreground">blue</div>
          </div>
          <div className="text-center">
            <IconBox color="green">S</IconBox>
            <div className="text-xs mt-1 text-muted-foreground">green</div>
          </div>
          <div className="text-center">
            <IconBox color="red">E</IconBox>
            <div className="text-xs mt-1 text-muted-foreground">red</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">No contexto ACAM</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: "✓", nome: "Checklist", desc: "Avaliação gratuita" },
              { icon: "$", nome: "Créditos", desc: "Comprar créditos", color: "amber" as const },
              { icon: "R", nome: "Extrato", desc: "Histórico de uso", color: "blue" as const },
              { icon: "UC", nome: "Destinação", desc: "Análise de imóvel" },
            ].map((item) => (
              <div key={item.nome} className="acam-card acam-card-hover acam-card-compact text-center cursor-pointer">
                <IconBox color={item.color} className="mx-auto mb-3">{item.icon}</IconBox>
                <h4 className="font-medium text-sm">{item.nome}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Código</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">{`import { IconBox } from "@/components/acam"

<IconBox size="sm">A</IconBox>
<IconBox size="lg">UC</IconBox>
<IconBox size="xl">UC</IconBox>
<IconBox color="amber">$</IconBox>
<IconBox color="blue">R</IconBox>`}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
