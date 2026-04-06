"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProgressShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Progress</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Barras de progresso para pontuação MVAR. Barras neutras — o percentual escrito comunica o valor.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Pontuação MVAR por dimensão</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { dim: "Jurídica (40%)", pts: "38/40", pct: 95 },
            { dim: "Fiscal (30%)", pts: "22/30", pct: 73 },
            { dim: "Titularidade (20%)", pts: "20/20", pct: 100 },
            { dim: "Técnica (10%)", pts: "0/10", pct: 0 },
          ].map((d) => (
            <div key={d.dim}>
              <div className="flex justify-between text-sm mb-1">
                <span className="acam-progress-label">{d.dim}</span>
                <span className="acam-progress-value">{d.pts}</span>
              </div>
              <div className="acam-progress">
                <div className="acam-progress-bar acam-progress-bar-primary" style={{ width: `${d.pct}%` }} />
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="font-semibold">Total MVAR</span>
            <span className="text-2xl font-bold">80/100</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Regra de uso</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2 acam-text-body">
          <p>Barra sempre na cor primária (verde floresta). O percentual escrito ao lado comunica o valor.</p>
          <p>Não usar cores diferentes por dimensão — o número já diz se é bom ou ruim.</p>
          <p>O badge de classificação (Adequado/Pendências/Não atende) aparece uma vez no total, não em cada dimensão.</p>
        </CardContent>
      </Card>
    </div>
  )
}
