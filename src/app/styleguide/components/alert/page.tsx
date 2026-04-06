"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AlertShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Alertas</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Fundo neutro — o badge comunica o status, não o alerta. Classe: acam-alert-result.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Resultado de análise (alerta neutro + badge)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="acam-alert-result">
            <Badge className="badge-success badge-inline">Adequado</Badge>
            <div><strong>Imóvel adequado.</strong> Atende todos os requisitos para destinação em UC de proteção integral. Pontuação MVAR: 94/100.</div>
          </div>

          <div className="acam-alert-result">
            <Badge className="badge-warning badge-inline">Pendências</Badge>
            <div><strong>Pendências identificadas.</strong> Servidão administrativa averbada na matrícula. Dificulta mas não impede a transferência.</div>
          </div>

          <div className="acam-alert-result">
            <Badge className="badge-error badge-inline font-bold">VETO</Badge>
            <div><strong>Imóvel inviável.</strong> Hipoteca ativa em favor do Banco do Brasil (R. 15). Este ônus impede a transferência até que seja cancelado.</div>
          </div>

          <div className="acam-alert-result">
            <div><strong>Informação.</strong> A UFEMG 2026 é R$ 5,7899. Este valor é utilizado nos cálculos de compensação minerária.</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Aviso legal (dashboard)</CardTitle></CardHeader>
        <CardContent>
          <div className="acam-alert-result">
            <div><strong>Importante.</strong> Esta é uma análise técnica preliminar. Não substitui trabalhos de campo e análises de profissionais qualificados, mediante responsabilidade técnica.</div>
          </div>
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
        <CardHeader><CardTitle className="text-sm">Regra de uso</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2 acam-text-body">
          <p>O badge comunica o status (cor). O alerta comunica o conteúdo (neutro).</p>
          <p>Alertas coloridos (acam-alert-error, acam-alert-success) apenas para erros de sistema.</p>
          <p>Resultados de análise usam acam-alert-result (neutro) + badge de status.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Classes disponíveis</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">{`{/* Resultado de análise — neutro + badge */}
<div className="acam-alert-result">
  <Badge className="badge-success badge-inline">Adequado</Badge>
  <div>Conteúdo do resultado.</div>
</div>

{/* Alerta de sistema — colorido */}
<div className="acam-alert acam-alert-error">Mensagem de erro.</div>
<div className="acam-alert acam-alert-success">Mensagem de sucesso.</div>
<div className="acam-alert acam-alert-warning">Aviso.</div>
<div className="acam-alert acam-alert-info">Informação.</div>`}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
