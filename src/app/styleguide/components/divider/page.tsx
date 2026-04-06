"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DividerShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Divider</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Separador com texto opcional. Usado entre seções de formulário (ex: &quot;ou&quot; entre login e cadastro).
          Classe: acam-divider.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Com texto</CardTitle></CardHeader>
        <CardContent>
          <div className="acam-btn acam-btn-primary w-full text-center">Entrar</div>
          <div className="acam-divider">
            <span className="text-xs text-muted-foreground px-2">ou</span>
          </div>
          <div className="acam-btn acam-btn-secondary w-full text-center">Criar nova conta</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Sem texto (separador simples)</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm">Seção anterior</p>
          <div className="acam-divider" />
          <p className="text-sm">Seção seguinte</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Classes disponíveis</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">{`{/* Com texto */}
<div className="acam-divider">
  <span className="text-xs text-muted-foreground px-2">ou</span>
</div>

{/* Sem texto */}
<div className="acam-divider" />`}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
