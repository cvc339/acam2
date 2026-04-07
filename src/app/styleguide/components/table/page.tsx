"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ServicesTable } from "@/components/acam"

const ferramentas = [
  { nome: "Destinação em UC — Base", descricao: "Análise completa de viabilidade", compensacao: "Minerária", creditos: "5", ativo: true },
  { nome: "Cálculo Implantação/Manutenção UC", descricao: "Cálculo com UFEMG vigente", compensacao: "Minerária", creditos: "2", ativo: true },
  { nome: "Requerimento Minerária", descricao: "Preenchimento assistido + PDF", compensacao: "Minerária", creditos: "0,5", ativo: true },
  { nome: "Calculadora SNUC", descricao: "Sobreposição com UCs + fatores", compensacao: "SNUC", creditos: "7", ativo: false },
]

export default function TableShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Tabela de Serviços</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Componente: ServicesTable. Lista de ferramentas profissionais do dashboard.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Ferramentas profissionais</CardTitle></CardHeader>
        <CardContent>
          <ServicesTable ferramentas={ferramentas} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Código</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">{`import { ServicesTable } from "@/components/acam"

const ferramentas = [
  { nome: "Destinação em UC — Base",
    descricao: "Análise completa de viabilidade",
    compensacao: "Minerária",
    creditos: "5",
    ativo: true },
]

<ServicesTable ferramentas={ferramentas} />`}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
