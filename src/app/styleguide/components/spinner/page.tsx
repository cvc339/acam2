"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SpinnerShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Spinner</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Indicador de carregamento. Usado em botões durante processamento e em telas de espera.
          Classe: acam-spinner + tamanho.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Tamanhos</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="text-center">
            <div className="acam-spinner acam-spinner-sm" />
            <div className="text-xs mt-2 text-muted-foreground">sm (1rem)</div>
          </div>
          <div className="text-center">
            <div className="acam-spinner" />
            <div className="text-xs mt-2 text-muted-foreground">padrão (1.25rem)</div>
          </div>
          <div className="text-center">
            <div className="acam-spinner acam-spinner-lg" />
            <div className="text-xs mt-2 text-muted-foreground">lg (2rem)</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">No contexto ACAM</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <button className="acam-btn acam-btn-primary" disabled>
              <span className="acam-spinner acam-spinner-sm" /> Entrando...
            </button>
            <span className="text-sm text-muted-foreground">Botão em estado de loading</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="acam-btn acam-btn-primary" disabled>
              <span className="acam-spinner acam-spinner-sm" /> Processando análise...
            </button>
            <span className="text-sm text-muted-foreground">Processamento de consulta</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="acam-spinner acam-spinner-lg" />
            <span className="text-sm text-muted-foreground">Consultando IDE-Sisema...</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Classes disponíveis</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">{`{/* Tamanhos */}
<div className="acam-spinner" />           {/* padrão 1.25rem */}
<div className="acam-spinner acam-spinner-sm" />  {/* 1rem — dentro de botões */}
<div className="acam-spinner acam-spinner-lg" />  {/* 2rem — tela de espera */}

{/* Dentro de botão */}
<button className="acam-btn acam-btn-primary" disabled>
  <span className="acam-spinner acam-spinner-sm" /> Processando...
</button>`}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
