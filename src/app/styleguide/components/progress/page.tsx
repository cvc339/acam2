"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressBar } from "@/components/acam"

export default function ProgressShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Progress</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Componente: ProgressBar. Barra neutra — o percentual escrito comunica o valor.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Pontuação MVAR por dimensão</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ProgressBar label="Jurídica (40%)" value="38/40" percent={95} />
          <ProgressBar label="Fiscal (30%)" value="22/30" percent={73} />
          <ProgressBar label="Titularidade (20%)" value="20/20" percent={100} />
          <ProgressBar label="Técnica (10%)" value="0/10" percent={0} />

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="font-semibold">Total MVAR</span>
            <span className="text-2xl font-bold">80/100</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Código</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">{`import { ProgressBar } from "@/components/acam"

<ProgressBar label="Jurídica (40%)" value="38/40" percent={95} />
<ProgressBar label="Fiscal (30%)" value="22/30" percent={73} />`}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
