"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

const primaryScale = [
  { name: "50", hex: "#f0ebe3", desc: "Fundo de cards primary" },
  { name: "100", hex: "#e3d9cd", desc: "Fundo de icon-boxes, badges" },
  { name: "200", hex: "#c9b99f", desc: "Bordas de cards primary" },
  { name: "300", hex: "#8a9e7a", desc: "Transição verde" },
  { name: "400", hex: "#4d7a5a", desc: "Sidebar ativo" },
  { name: "500", hex: "#2d5a3f", desc: "Ring, focus" },
  { name: "600", hex: "#1a3a2a", desc: "Cor principal — botões, textos primários" },
  { name: "700", hex: "#142e21", desc: "Hover de botão primary" },
  { name: "800", hex: "#0f2318", desc: "Fundo footer, textos escuros" },
  { name: "900", hex: "#0a1910", desc: "Preto ACAM" },
]

const neutralScale = [
  { name: "50", hex: "#fafafa" },
  { name: "100", hex: "#f5f5f5" },
  { name: "200", hex: "#e5e5e5" },
  { name: "300", hex: "#d4d4d4" },
  { name: "400", hex: "#a3a3a3" },
  { name: "500", hex: "#737373" },
  { name: "600", hex: "#525252" },
  { name: "700", hex: "#404040" },
  { name: "800", hex: "#262626" },
  { name: "900", hex: "#171717" },
]

export default function StyleguidePage() {
  return (
    <div className="space-y-12">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-semibold">ACAM — Design System</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Identidade visual técnica e autoritativa para profissionais de compensações ambientais.
        </p>
      </div>

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Domínio:</span> Ambiental / Regulatório</div>
            <div><span className="font-medium">Tom:</span> Técnico, autoritativo</div>
            <div><span className="font-medium">Primária:</span> Verde Floresta (#1a3a2a)</div>
            <div><span className="font-medium">Acento:</span> Cobre (#c17f59)</div>
            <div><span className="font-medium">Fonte:</span> System stack (-apple-system, Segoe UI, Roboto)</div>
            <div><span className="font-medium">Radius padrão:</span> 0.75rem (lg)</div>
            <div><span className="font-medium">Público:</span> Profissionais técnicos, decisões rápidas</div>
            <div><span className="font-medium">Fundo público:</span> #f5f0e8 (creme quente)</div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Paleta Verde Floresta */}
      <section>
        <h2 className="text-xl font-semibold">Verde Floresta (Primary)</h2>
        <p className="text-sm mt-1 text-muted-foreground">
          Paleta Vieira Castro. O --primary-600 é a cor principal de ação.
        </p>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mt-6">
          {primaryScale.map((c) => (
            <div key={c.name} className="text-center">
              <div
                className="h-14 rounded-lg border"
                style={{ backgroundColor: c.hex }}
                title={c.desc}
              />
              <div className="text-xs font-medium mt-1">{c.name}</div>
              <div className="text-xs acam-text-light">{c.hex}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Cobre */}
      <section>
        <h2 className="text-xl font-semibold">Cobre (Acento)</h2>
        <div className="flex items-center gap-4 mt-4">
          <div className="h-14 w-28 rounded-lg" style={{ backgroundColor: "var(--accent)" }} />
          <div className="h-14 w-28 rounded-lg" style={{ backgroundColor: "var(--accent-hover)" }} />
          <div>
            <div className="font-medium text-sm">#c17f59 → hover: #a96d4a</div>
            <div className="text-xs text-muted-foreground">
              Usado em CTAs de compra de créditos, destaques de custo.
              Não usar em status ou alertas.
            </div>
          </div>
        </div>
      </section>

      {/* Neutras */}
      <section>
        <h2 className="text-xl font-semibold">Escala Neutra</h2>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mt-6">
          {neutralScale.map((c) => (
            <div key={c.name} className="text-center">
              <div className="h-14 rounded-lg border" style={{ backgroundColor: c.hex }} />
              <div className="text-xs font-medium mt-1">{c.name}</div>
              <div className="text-xs acam-text-light">{c.hex}</div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Cores semânticas */}
      <section>
        <h2 className="text-xl font-semibold">Cores Semânticas</h2>
        <p className="text-sm mt-1 text-muted-foreground">
          Sempre usar estas cores para status. Nunca cores arbitrárias.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-6">
          {[
            { name: "Success", hex: "#16a34a", uso: "Adequado, concluída, aprovado, viável" },
            { name: "Error", hex: "#dc2626", uso: "Inviável, VETO, erro, risco alto, impede" },
            { name: "Warning", hex: "#f59e0b", uso: "Pendências, atenção, dificulta, cautela" },
            { name: "Info", hex: "#2563eb", uso: "Informativo, orientações, dados neutros" },
          ].map((c) => (
            <Card key={c.name}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: c.hex }} />
                  <div>
                    <div className="text-sm font-medium">{c.name} — {c.hex}</div>
                    <div className="text-xs text-muted-foreground">{c.uso}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Tipografia */}
      <section>
        <h2 className="text-xl font-semibold">Tipografia</h2>
        <Card className="mt-6">
          <CardContent className="pt-6 space-y-6">
            <div>
              <div className="text-xs acam-text-light">h1 — 2.25rem (text-4xl) / weight 600</div>
              <h1 className="text-4xl font-semibold mt-1">Análise de Compensações Ambientais</h1>
            </div>
            <Separator />
            <div>
              <div className="text-xs acam-text-light">h2 — 1.5rem (text-2xl) / weight 600</div>
              <h2 className="text-2xl font-semibold mt-1">Compensação Minerária MG</h2>
            </div>
            <Separator />
            <div>
              <div className="text-xs acam-text-light">h3 — 1.25rem (text-xl) / weight 600</div>
              <h3 className="text-xl font-semibold mt-1">Modalidade 2.1 — Destinação em UC</h3>
            </div>
            <Separator />
            <div>
              <div className="text-xs acam-text-light">body — 1rem (text-base)</div>
              <p className="mt-1">
                A compensação minerária é uma obrigação legal decorrente da supressão
                de vegetação nativa por empreendimentos minerários em Minas Gerais.
              </p>
            </div>
            <Separator />
            <div>
              <div className="text-xs acam-text-light">descrição — 0.875rem (text-sm) / neutral-500</div>
              <p className="text-sm mt-1 text-muted-foreground">
                Lei 20.922/2013 — Portaria IEF 27/2017 — Decreto 12.689/2025
              </p>
            </div>
            <Separator />
            <div>
              <div className="text-xs acam-text-light">número em destaque — text-4xl / weight 700</div>
              <div className="mt-1">
                <span className="text-4xl font-bold">85</span>
                <span className="text-sm ml-2 text-muted-foreground">pontos MVAR</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Espaçamento */}
      <section>
        <h2 className="text-xl font-semibold">Espaçamento</h2>
        <p className="text-sm mt-1 text-muted-foreground">
          Escala de --spacing-1 (0.25rem) a --spacing-16 (4rem).
        </p>
        <div className="flex items-end gap-3 mt-6">
          {[
            { name: "1", rem: "0.25" },
            { name: "2", rem: "0.5" },
            { name: "3", rem: "0.75" },
            { name: "4", rem: "1" },
            { name: "6", rem: "1.5" },
            { name: "8", rem: "2" },
            { name: "12", rem: "3" },
            { name: "16", rem: "4" },
          ].map((s) => (
            <div key={s.name} className="text-center">
              <div
                className="w-8 rounded-sm"
                style={{ height: `${parseFloat(s.rem) * 16}px`, backgroundColor: "var(--primary-400)" }}
              />
              <div className="text-xs mt-1 text-muted-foreground">{s.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Radius */}
      <section>
        <h2 className="text-xl font-semibold">Border Radius</h2>
        <div className="flex gap-4 items-end mt-6">
          {[
            { name: "sm", val: "0.25rem" },
            { name: "md", val: "0.5rem" },
            { name: "lg", val: "0.75rem" },
            { name: "xl", val: "1rem" },
            { name: "full", val: "9999px" },
          ].map((r) => (
            <div key={r.name} className="text-center">
              <div
                className="w-14 h-14"
                style={{ backgroundColor: "var(--primary-600)", borderRadius: r.val }}
              />
              <div className="text-xs mt-1 text-muted-foreground">{r.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Sombras */}
      <section>
        <h2 className="text-xl font-semibold">Sombras</h2>
        <div className="flex gap-6 mt-6">
          {[
            { name: "sm", val: "var(--shadow-sm)" },
            { name: "md", val: "var(--shadow-md)" },
            { name: "lg", val: "var(--shadow-lg)" },
          ].map((s) => (
            <div key={s.name} className="text-center">
              <div className="w-24 h-14 bg-white rounded-xl" style={{ boxShadow: s.val }} />
              <div className="text-xs mt-2 text-muted-foreground">{s.name}</div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Preview rápido dos componentes */}
      <section>
        <h2 className="text-xl font-semibold">Preview de Componentes</h2>
        <p className="text-sm mt-1 mb-6 text-muted-foreground">
          Resumo visual. Cada componente tem sua página de showcase com exemplos completos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Botões */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Botões</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <button className="acam-btn acam-btn-accent">Cobre</button>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Badges de Status</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge className="badge-success">Adequado</Badge>
              <Badge className="badge-warning">Pendências</Badge>
              <Badge className="badge-error">Inviável</Badge>
              <Badge className="badge-primary">Minerária</Badge>
              <Badge variant="secondary">Pendente</Badge>
            </CardContent>
          </Card>

          {/* Alertas */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Alertas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="acam-alert acam-alert-success">Imóvel adequado para destinação.</div>
              <div className="acam-alert acam-alert-warning">Documentos pendentes.</div>
              <div className="acam-alert acam-alert-error">VETO — Hipoteca ativa.</div>
              <div className="acam-alert acam-alert-info">UFEMG 2026: R$ 5,7899.</div>
            </CardContent>
          </Card>

          {/* Formulário */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Formulário</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Nome do imóvel</Label>
                <Input placeholder="Fazenda Santa Maria" className="mt-1" />
              </div>
              <div>
                <Label>Município</Label>
                <Input placeholder="Três Marias" className="mt-1" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
