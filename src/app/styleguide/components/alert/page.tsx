"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertResult } from "@/components/acam"

export default function AlertShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Alertas</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Componente: AlertResult. Fundo neutro — o badge comunica o status.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Resultado de análise (AlertResult + badge)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <AlertResult status="success" statusLabel="Adequado">
            <strong>Imóvel adequado.</strong> Atende todos os requisitos para destinação em UC de proteção integral. Pontuação MVAR: 94/100.
          </AlertResult>

          <AlertResult status="warning" statusLabel="Pendências">
            <strong>Pendências identificadas.</strong> Servidão administrativa averbada na matrícula. Dificulta mas não impede a transferência.
          </AlertResult>

          <AlertResult status="error" statusLabel="VETO">
            <strong>Imóvel inviável.</strong> Hipoteca ativa em favor do Banco do Brasil (R. 15). Este ônus impede a transferência até que seja cancelado.
          </AlertResult>

          <AlertResult>
            <strong>Informação.</strong> A UFEMG 2026 é R$ 5,7899. Este valor é utilizado nos cálculos de compensação minerária.
          </AlertResult>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Aviso legal (dashboard)</CardTitle></CardHeader>
        <CardContent>
          <AlertResult>
            <strong>Importante.</strong> Esta é uma análise técnica preliminar. Não substitui trabalhos de campo e análises de profissionais qualificados, mediante responsabilidade técnica.
          </AlertResult>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Alertas de sistema (erro, sucesso)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="acam-alert acam-alert-error">E-mail ou senha incorretos.</div>
          <div className="acam-alert acam-alert-success">Conta criada com sucesso!</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Código</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">{`import { AlertResult } from "@/components/acam"

{/* Resultado de análise — neutro + badge */}
<AlertResult status="success" statusLabel="Adequado">
  Conteúdo do resultado.
</AlertResult>

{/* Sem badge (informativo) */}
<AlertResult>
  Informação sem classificação.
</AlertResult>

{/* Alerta de sistema — classe CSS direta */}
<div className="acam-alert acam-alert-error">Erro.</div>
<div className="acam-alert acam-alert-success">Sucesso.</div>`}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
