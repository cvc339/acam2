"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function TableShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Tabela de Serviços</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Lista de ferramentas profissionais do dashboard. Classe: acam-services-table.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Ferramentas profissionais</CardTitle></CardHeader>
        <CardContent>
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
              <tr>
                <td>
                  <div className="font-medium">Destinação em UC — Base</div>
                  <div className="text-xs text-muted-foreground">Análise completa de viabilidade</div>
                </td>
                <td><Badge className="badge-primary">Minerária</Badge></td>
                <td className="font-semibold">5</td>
                <td><Button size="sm">Acessar</Button></td>
              </tr>
              <tr>
                <td>
                  <div className="font-medium">Cálculo Implantação/Manutenção UC</div>
                  <div className="text-xs text-muted-foreground">Cálculo com UFEMG vigente</div>
                </td>
                <td><Badge className="badge-primary">Minerária</Badge></td>
                <td className="font-semibold">2</td>
                <td><Button size="sm">Acessar</Button></td>
              </tr>
              <tr>
                <td>
                  <div className="font-medium">Requerimento Minerária</div>
                  <div className="text-xs text-muted-foreground">Preenchimento assistido + PDF</div>
                </td>
                <td><Badge className="badge-primary">Minerária</Badge></td>
                <td className="font-semibold">0,5</td>
                <td><Button size="sm">Acessar</Button></td>
              </tr>
              <tr>
                <td>
                  <div className="font-medium">Calculadora SNUC</div>
                  <div className="text-xs text-muted-foreground">Sobreposição com UCs + fatores</div>
                </td>
                <td><Badge className="badge-primary">SNUC</Badge></td>
                <td className="font-semibold">7</td>
                <td><Badge className="badge-dev">Em breve</Badge></td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
