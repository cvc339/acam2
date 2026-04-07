"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DocumentoItem, UploadZone } from "@/components/acam"

export default function UploadShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Upload de Documentos e Arquivos</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Componentes: DocumentoItem e UploadZone. Padronizados para todas as ferramentas.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Upload de documentos (DocumentoItem)</CardTitle></CardHeader>
        <CardContent>
          <div className="acam-card acam-upload-card">
            <h2 className="font-semibold acam-doc-section-title">Documentação do Imóvel</h2>
            <DocumentoItem nome="Matrícula do Imóvel" obrigatorio />
            <DocumentoItem nome="CND-ITR" obrigatorio arquivo="cnd_itr_fazenda_santa_maria.pdf" />
            <DocumentoItem nome="CCIR" />
            <DocumentoItem nome="CAR" />
          </div>

          <div className="text-sm mt-4 space-y-1 acam-text-body">
            <p><strong>Regra:</strong> Documentos obrigatórios marcados com asterisco (*). Indicador muda de &quot;?&quot; para &quot;✓&quot; ao selecionar.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Upload geoespacial (UploadZone)</CardTitle></CardHeader>
        <CardContent>
          <div className="acam-upload-grid">
            <UploadZone titulo="Área de Supressão" descricao="Local onde ocorreu/ocorrerá a supressão" />
            <UploadZone titulo="Imóvel Proposto" descricao="Área proposta para destinação" arquivo="imovel_proposto.kml" />
          </div>

          <div className="text-sm mt-4 space-y-1 acam-text-body">
            <p><strong>Dados extraídos:</strong> Aparecem abaixo da zona de upload após processamento. Sem mapa — mapas apenas nos resultados.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Código</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">{`import { DocumentoItem, UploadZone } from "@/components/acam"

{/* Documentos */}
<DocumentoItem nome="Matrícula do Imóvel" obrigatorio />
<DocumentoItem nome="CND-ITR" obrigatorio arquivo="arquivo.pdf" />
<DocumentoItem nome="CCIR" />

{/* Geoespacial */}
<UploadZone
  titulo="Área de Supressão"
  descricao="Local onde ocorreu a supressão"
/>
<UploadZone
  titulo="Imóvel Proposto"
  descricao="Área proposta"
  arquivo="imovel.kml"
/>`}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
