"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function InputShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Formulários</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Padrão de formulário baseado no requerimento Mata Atlântica do ACAM1.
          Wizard multi-etapa, grids responsivos, input com busca. Tudo centralizado em classes acam-*.
        </p>
      </div>

      {/* Wizard steps */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Wizard de etapas</CardTitle></CardHeader>
        <CardContent>
          <div className="acam-wizard">
            <div className="acam-wizard-step acam-wizard-step-completed">
              <span className="acam-wizard-num">✓</span>Requerente
            </div>
            <div className="acam-wizard-sep" />
            <div className="acam-wizard-step acam-wizard-step-active">
              <span className="acam-wizard-num">2</span>Empreendedor
            </div>
            <div className="acam-wizard-sep" />
            <div className="acam-wizard-step">
              <span className="acam-wizard-num">3</span>Correspondência
            </div>
            <div className="acam-wizard-sep" />
            <div className="acam-wizard-step">
              <span className="acam-wizard-num">4</span>Processo
            </div>
            <div className="acam-wizard-sep" />
            <div className="acam-wizard-step">
              <span className="acam-wizard-num">5</span>Gerar
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campos com grid */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Campos com grid responsivo</CardTitle></CardHeader>
        <CardContent>
          <div style={{ maxWidth: "720px" }}>
            {/* Section title */}
            <div className="acam-section-title">Dados do requerente</div>
            <div className="acam-section-desc">Informe os dados pessoais do requerente da compensação.</div>

            {/* 2 colunas */}
            <div className="acam-fg acam-fg-2">
              <div className="acam-field">
                <label>Nome completo <span className="req">*</span></label>
                <input className="acam-form-input" placeholder="João da Silva" />
              </div>
              <div className="acam-field">
                <label>CPF <span className="req">*</span></label>
                <input className="acam-form-input" placeholder="000.000.000-00" />
              </div>
            </div>

            {/* 3 colunas */}
            <div className="acam-fg acam-fg-3">
              <div className="acam-field">
                <label>RG</label>
                <input className="acam-form-input" placeholder="MG-12.345.678" />
              </div>
              <div className="acam-field">
                <label>Nacionalidade</label>
                <input className="acam-form-input" defaultValue="Brasileira" />
              </div>
              <div className="acam-field">
                <label>Estado civil</label>
                <select className="acam-form-input acam-form-select">
                  <option>Selecione</option>
                  <option>Solteiro(a)</option>
                  <option>Casado(a)</option>
                  <option>Divorciado(a)</option>
                  <option>Viúvo(a)</option>
                </select>
              </div>
            </div>

            {/* 4 colunas (endereço) */}
            <div className="acam-fg acam-fg-4">
              <div className="acam-field">
                <label>Logradouro</label>
                <input className="acam-form-input" placeholder="Rua, Avenida..." />
              </div>
              <div className="acam-field">
                <label>Número</label>
                <input className="acam-form-input" placeholder="123" />
              </div>
              <div className="acam-field">
                <label>Complemento</label>
                <input className="acam-form-input" placeholder="Apto, sala..." />
              </div>
              <div className="acam-field">
                <label>Bairro</label>
                <input className="acam-form-input" placeholder="Centro" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input com botão de busca */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Input com botão de busca (CNPJ, CEP)</CardTitle></CardHeader>
        <CardContent>
          <div style={{ maxWidth: "720px" }}>
            <div className="acam-fg acam-fg-2">
              <div className="acam-field">
                <label>CNPJ <span className="req">*</span></label>
                <div className="acam-input-with-action">
                  <input className="acam-form-input" placeholder="00.000.000/0000-00" />
                  <button className="acam-btn acam-btn-secondary acam-btn-sm">Buscar</button>
                </div>
                <div className="hint">Os dados da empresa serão preenchidos automaticamente.</div>
              </div>
              <div className="acam-field">
                <label>CEP <span className="req">*</span></label>
                <div className="acam-input-with-action">
                  <input className="acam-form-input" placeholder="30000-000" />
                  <button className="acam-btn acam-btn-secondary acam-btn-sm">Buscar</button>
                </div>
                <div className="hint">O endereço será preenchido automaticamente.</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado de erro */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Estado de erro</CardTitle></CardHeader>
        <CardContent>
          <div style={{ maxWidth: "360px" }}>
            <div className="acam-field">
              <label>CPF <span className="req">*</span></label>
              <input className="acam-form-input acam-form-input-error" defaultValue="123.456" readOnly />
              <div className="acam-form-error">CPF inválido.</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Radio group */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Radio group</CardTitle></CardHeader>
        <CardContent>
          <div className="acam-field">
            <label>Endereço de correspondência</label>
            <div className="acam-radio-group">
              <label><input type="radio" name="endereco" defaultChecked /> Mesmo do empreendedor</label>
              <label><input type="radio" name="endereco" /> Outro endereço</label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navegação entre etapas */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Navegação entre etapas</CardTitle></CardHeader>
        <CardContent>
          <div style={{ maxWidth: "720px" }}>
            <div className="acam-wizard-nav">
              <button className="acam-btn acam-btn-secondary">← Voltar</button>
              <button className="acam-btn acam-btn-primary">Próximo →</button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary card */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Resumo (etapa final do wizard)</CardTitle></CardHeader>
        <CardContent>
          <div style={{ maxWidth: "720px" }}>
            <div className="acam-summary-card">
              <div className="acam-summary-title">Requerente</div>
              <div className="acam-summary-item">
                <span className="acam-summary-label">Nome</span>
                <span className="acam-summary-value">João da Silva</span>
              </div>
              <div className="acam-summary-item">
                <span className="acam-summary-label">CPF</span>
                <span className="acam-summary-value">123.456.789-00</span>
              </div>
              <div className="acam-summary-item">
                <span className="acam-summary-label">Município</span>
                <span className="acam-summary-value">Três Marias / MG</span>
              </div>
            </div>

            <button className="acam-btn acam-btn-primary">Gerar PDF do requerimento</button>
          </div>
        </CardContent>
      </Card>

      {/* Código */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Classes disponíveis</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">{`/* Wizard */
.acam-wizard              — container das etapas
.acam-wizard-step         — etapa (inativa por padrão)
.acam-wizard-step-active  — etapa atual
.acam-wizard-step-completed — etapa concluída
.acam-wizard-num          — número circular da etapa
.acam-wizard-sep          — separador entre etapas
.acam-wizard-nav          — container Voltar/Próximo

/* Seções */
.acam-section-title       — título de seção do formulário
.acam-section-desc        — descrição da seção

/* Grid de campos */
.acam-fg                  — container grid (gap 1rem)
.acam-fg-2                — 2 colunas
.acam-fg-3                — 3 colunas
.acam-fg-4                — 4 colunas (2fr 1fr 1fr 1.5fr)
.acam-field               — wrapper do campo (label + input + hint)
.req                      — asterisco vermelho (obrigatório)
.hint                     — texto de ajuda

/* Input com botão */
.acam-input-with-action   — flex container (input + botão lado a lado)

/* Radio */
.acam-radio-group         — grupo de radio buttons

/* Summary */
.acam-summary-card        — card de resumo
.acam-summary-title       — título do bloco (uppercase)
.acam-summary-item        — linha label/value
.acam-summary-label       — label cinza
.acam-summary-value       — valor escuro bold`}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
