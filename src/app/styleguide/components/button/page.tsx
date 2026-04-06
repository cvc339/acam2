"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ButtonShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Botões</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Componente shadcn/ui Button com variantes mapeadas para os tokens ACAM.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Variantes</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button>Primary (ação principal)</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Botão Cobre (compra de créditos)</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <button className="acam-btn acam-btn-accent">Comprar créditos</button>
          <p className="text-xs w-full text-muted-foreground">
            Usar apenas para ações de compra/pagamento. Não usar para ações funcionais.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Tamanhos</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button size="sm">Pequeno (sm)</Button>
          <Button size="default">Padrão</Button>
          <Button size="lg">Grande (lg)</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">No contexto ACAM</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button>Iniciar análise</Button>
          <Button variant="secondary">Ver detalhes</Button>
          <Button variant="ghost">Voltar</Button>
          <Button size="sm">Acessar</Button>
          <Button disabled>Processando...</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Código</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">{`import { Button } from "@/components/ui/button"

<Button>Iniciar análise</Button>
<Button variant="secondary">Ver detalhes</Button>
<Button variant="outline">Cancelar</Button>
<Button variant="ghost">Voltar</Button>
<Button variant="destructive">Excluir</Button>
<Button size="sm">Acessar</Button>
<Button disabled>Processando...</Button>

{/* Botão cobre — apenas para compra */}
<button className="acam-btn acam-btn-accent">
  Comprar créditos
</button>`}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
