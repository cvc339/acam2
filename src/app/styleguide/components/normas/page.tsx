"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NormasShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Tabela de Normas</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Tabela de legislação compacta. Classe centralizada: acam-normas-table.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Regras de supressão e compensação — Mata Atlântica</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="acam-normas-table">
              <thead>
                <tr>
                  <th>Situação</th>
                  <th>Estágio</th>
                  <th>Condições</th>
                  <th>Compensação</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="cell-name">Utilidade Pública</td>
                  <td>Primária, Secundária Avançada e Média</td>
                  <td className="cell-detail">Caráter excepcional; inexistência de alternativa técnica e locacional</td>
                  <td className="col-decision">Sim (Art. 17)</td>
                </tr>
                <tr>
                  <td className="cell-name">Interesse Social</td>
                  <td>Secundária Média</td>
                  <td className="cell-detail">Imprescindível para a atividade; inexistência de alternativa técnica e locacional</td>
                  <td className="col-decision">Sim (Art. 17)</td>
                </tr>
                <tr>
                  <td className="cell-name">Mineração</td>
                  <td>Primária, Secundária Avançada e Média</td>
                  <td className="cell-detail">Licenciamento ambiental; adoção de medida compensatória</td>
                  <td className="col-decision">Sim (Art. 32)</td>
                </tr>
                <tr>
                  <td className="cell-name">Loteamentos</td>
                  <td>Secundária Inicial</td>
                  <td className="cell-detail">Projetos de loteamento ou edificação em perímetro urbano</td>
                  <td className="col-decision-no">Não</td>
                </tr>
                <tr>
                  <td className="cell-name">Pequeno Produtor</td>
                  <td>Secundária Inicial</td>
                  <td className="cell-detail">Exploração eventual, sem fins comerciais, para consumo próprio</td>
                  <td className="col-decision-no">Não</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="acam-legal-note">
            Art. 17 da Lei 11.428/2006: A compensação consiste na destinação de área equivalente à extensão da área desmatada, com as mesmas características ecológicas, na mesma bacia hidrográfica.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
