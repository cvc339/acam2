"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LegislacaoShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Legislação e Modalidades</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Componentes padronizados para todas as páginas de compensação.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Legislação Aplicável</CardTitle></CardHeader>
        <CardContent>
          <div className="acam-card acam-upload-card">
            <h2 className="font-semibold text-xl acam-doc-section-title">Legislação Aplicável</h2>

            <div className="acam-legislacao-item">
              <p className="acam-legislacao-titulo">Lei Federal nº 11.428/2006</p>
              <p className="acam-legislacao-desc">Dispõe sobre a utilização e proteção da vegetação nativa do Bioma Mata Atlântica</p>
            </div>

            <div className="acam-legislacao-item acam-legislacao-item-active">
              <p className="acam-legislacao-titulo">Decreto Federal nº 6.660/2008</p>
              <p className="acam-legislacao-desc">Regulamenta a Lei nº 11.428/2006</p>
            </div>

            <div className="acam-legislacao-item">
              <p className="acam-legislacao-titulo">Decreto Estadual nº 47.749/2019</p>
              <p className="acam-legislacao-desc">Dispõe sobre os processos de autorização para intervenção ambiental</p>
            </div>

            <div className="acam-legislacao-item">
              <p className="acam-legislacao-titulo">Portaria IEF nº 30/2015</p>
              <p className="acam-legislacao-desc">Estabelece diretrizes e procedimentos para cumprimento da compensação</p>
            </div>
          </div>

          <div className="text-sm mt-4 space-y-1 acam-text-body">
            <p><strong>Estrutura:</strong> Borda lateral 3px verde (primary-500). Todos os itens com fundo branco por padrão.</p>
            <p><strong>Estado ativo:</strong> Fundo creme (primary-50) indica norma selecionada. Classe: acam-legislacao-item-active.</p>
            <p><strong>Uso:</strong> Presente em todas as páginas de compensação. A lista muda conforme a compensação.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Modalidades de Cumprimento</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-6">
            <h2 className="font-semibold text-xl mb-2">Modalidades de Cumprimento</h2>
            <p className="text-sm text-muted-foreground">
              As opções 1 e 2 são prioritárias. A opção 3 só deve ser utilizada quando comprovada a inviabilidade das duas primeiras.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="acam-modalidade-card">
              <span className="acam-modalidade-badge">Opção 1</span>
              <div className="acam-modalidade-titulo">Doação de Área</div>
              <div className="acam-modalidade-subtitulo">Regularização Fundiária em UC</div>
              <div className="acam-modalidade-desc">
                Destinação de área no interior de <strong>Unidade de Conservação de domínio público</strong> pendente de regularização fundiária.
              </div>
              <div className="acam-modalidade-requisitos">
                <h4>Requisitos da Área:</h4>
                <ul>
                  <li>Mesma bacia hidrográfica de rio federal</li>
                  <li>Localizada em Minas Gerais</li>
                  <li>Vegetação nativa do Bioma MA</li>
                </ul>
              </div>
              <div className="acam-modalidade-destaque">
                <strong>Vantagens:</strong> Dispensa vistoria, obrigação encerra com transferência
              </div>
            </div>

            <div className="acam-modalidade-card">
              <span className="acam-modalidade-badge">Opção 2</span>
              <div className="acam-modalidade-titulo">Destinação para Conservação</div>
              <div className="acam-modalidade-subtitulo">Servidão Ambiental ou RPPN</div>
              <div className="acam-modalidade-desc">
                Destinação de área para conservação mediante <strong>servidão ambiental perpétua</strong> ou criação de <strong>RPPN</strong>.
              </div>
              <div className="acam-modalidade-requisitos">
                <h4>Requisitos da Área:</h4>
                <ul>
                  <li>Mesma bacia hidrográfica</li>
                  <li>Características ecológicas similares</li>
                  <li>Vegetação nativa do Bioma MA</li>
                </ul>
              </div>
              <div className="acam-modalidade-destaque">
                <strong>Vantagens:</strong> Não precisa estar em UC, área própria ou de terceiros
              </div>
            </div>

            <div className="acam-modalidade-card">
              <span className="acam-modalidade-badge">Opção 3</span>
              <div className="acam-modalidade-titulo">Recuperação Florestal</div>
              <div className="acam-modalidade-subtitulo">Plantio de Espécies Nativas</div>
              <div className="acam-modalidade-desc">
                Somente quando comprovada <strong>a inviabilidade</strong> das opções 1 e 2. Plantio de espécies nativas.
              </div>
              <div className="acam-modalidade-requisitos">
                <h4>Requisitos:</h4>
                <ul>
                  <li>Mesma bacia hidrográfica</li>
                  <li>Preferencialmente mesma sub-bacia</li>
                  <li>Espécies nativas do bioma</li>
                </ul>
              </div>
              <div className="acam-modalidade-destaque">
                <strong>Atenção:</strong> Exige plantio, monitoramento e vistoria
              </div>
            </div>
          </div>

          <div className="text-sm mt-6 space-y-1 acam-text-body">
            <p><strong>Estrutura:</strong> Cards com badge escuro (primary-600) posicionado no topo central.</p>
            <p><strong>Destaque:</strong> Bloco creme (primary-50) no rodapé do card para vantagens ou atenção.</p>
            <p><strong>Uso:</strong> Presente em todas as 8 páginas de compensação. Número de opções varia.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
