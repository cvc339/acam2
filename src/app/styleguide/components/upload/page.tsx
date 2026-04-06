"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function UploadShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Upload de Documentos e Arquivos</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Dois componentes padronizados: upload de documentos PDF e upload de arquivos geoespaciais (KML/SHP).
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Upload de documentos (padrão para todas as ferramentas)</CardTitle></CardHeader>
        <CardContent>
          <div className="acam-card acam-upload-card">
            <h2 className="font-semibold acam-doc-section-title">Documentação do Imóvel</h2>

            <div className="acam-documento-item">
              <div className="acam-documento-status">?</div>
              <div className="acam-documento-info">
                <span className="acam-documento-nome">Matrícula do Imóvel *</span>
              </div>
              <label className="acam-btn acam-btn-sm acam-btn-outline cursor-pointer">Selecionar</label>
            </div>

            <div className="acam-documento-item">
              <div className="acam-documento-status acam-documento-status-ok">✓</div>
              <div className="acam-documento-info">
                <span className="acam-documento-nome">CND-ITR *</span>
                <span className="acam-documento-arquivo">cnd_itr_fazenda_santa_maria.pdf</span>
              </div>
              <label className="acam-btn acam-btn-sm acam-btn-outline cursor-pointer">Alterar</label>
            </div>

            <div className="acam-documento-item">
              <div className="acam-documento-status">?</div>
              <div className="acam-documento-info">
                <span className="acam-documento-nome">CCIR</span>
              </div>
              <label className="acam-btn acam-btn-sm acam-btn-outline cursor-pointer">Selecionar</label>
            </div>

            <div className="acam-documento-item">
              <div className="acam-documento-status">?</div>
              <div className="acam-documento-info">
                <span className="acam-documento-nome">CAR</span>
              </div>
              <label className="acam-btn acam-btn-sm acam-btn-outline cursor-pointer">Selecionar</label>
            </div>
          </div>

          <div className="text-sm mt-4 space-y-1 acam-text-body">
            <p><strong>Regra:</strong> Documentos obrigatórios marcados com asterisco (*). Indicador circular muda de &quot;?&quot; (cinza) para &quot;✓&quot; (verde) ao selecionar.</p>
            <p>Usar este componente em todas as ferramentas que captam documentos.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Upload de arquivos geoespaciais (KML/SHP)</CardTitle></CardHeader>
        <CardContent>
          <div className="acam-upload-grid">
            <div className="acam-card acam-upload-card">
              <h2 className="font-semibold">Área de Supressão</h2>
              <p>Local onde ocorreu/ocorrerá a supressão</p>
              <div className="acam-upload-zone">
                <p>Clique para selecionar KML ou GeoJSON</p>
              </div>
            </div>

            <div className="acam-card acam-upload-card">
              <h2 className="font-semibold">Imóvel Proposto</h2>
              <p>Área proposta para destinação</p>
              <div className="acam-upload-zone acam-upload-zone-success">
                <p>✓ imovel_proposto.kml</p>
              </div>

              <div className="acam-dados-extraidos">
                {[
                  { label: "Área", value: "145,3 ha" },
                  { label: "Bioma", value: "Mata Atlântica" },
                  { label: "Bacia", value: "Rio São Francisco" },
                  { label: "Sub-bacia", value: "Rio das Velhas" },
                  { label: "Vegetação", value: "Floresta Estacional Semidecidual" },
                ].map((item) => (
                  <div key={item.label} className="acam-dados-extraidos-row">
                    <span className="acam-dados-extraidos-label">{item.label}:</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-sm mt-4 space-y-1 acam-text-body">
            <p><strong>Estado inicial:</strong> Borda tracejada cinza, fundo branco.</p>
            <p><strong>Com arquivo:</strong> Borda sólida verde, fundo primary-50, nome do arquivo com &quot;✓&quot;.</p>
            <p><strong>Erro:</strong> Borda vermelha, fundo red-50.</p>
            <p><strong>Dados extraídos:</strong> Aparecem abaixo da zona de upload após processamento. Sem mapa — mapas apenas nos resultados.</p>
            <p>Aceita: .kml, .kmz, .geojson, .json, .shp (zip).</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
