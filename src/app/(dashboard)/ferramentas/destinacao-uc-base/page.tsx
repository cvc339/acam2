"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { StatusBadge } from "@/components/acam"
import { MapaImovel } from "@/components/acam/mapa-imovel"

const CUSTO_CREDITOS = 5

// ============================================
// TIPOS DO PARECER (espelha API /api/consultas)
// ============================================

interface Proprietario {
  nome: string
  percentual: number
  cpf_cnpj: string | null
  estado_civil: string | null
  conjuge: string | null
  regime_bens: string | null
}

interface OnusGravame {
  tipo: string
  numero_averbacao: string
  descricao: string
  impacto_compra_venda: string
}

interface UC {
  nome: string
  categoria: string
  protecao_integral: boolean
  percentual_sobreposicao: number | null
  area_sobreposicao_ha?: number
  area_fora_uc_ha?: number
}

interface Parecer {
  imovel: {
    nome: string
    municipio: string
    estado: string
    area_hectares: number | null
    matricula: string | null
    cartorio: string | null
    data_emissao: string | null
    dias_desde_emissao: number | null
    ccir: string | null
    nirf: string | null
  }
  proprietarios: Proprietario[]
  onus_gravames: OnusGravame[]
  alertas_matricula: string[]
  cnd: {
    tipo: string
    cib: string | null
    data_emissao: string | null
    data_validade: string | null
    area_hectares: number | null
    nome_contribuinte: string | null
  } | null
  ide_sisema: {
    sucesso: boolean
    ucs: UC[]
    bbox: { minLon: number; maxLon: number; minLat: number; maxLat: number } | null
    centroide: { lon: number; lat: number } | null
    geojson_imovel: GeoJSON.FeatureCollection | null
  }
  pontuacao: { total: number; maximo: number }
  classificacao: { faixa: string; label: string; acao: string; cor: string }
  vetos: Array<{ origem: string; motivo: string }>
  dimensoes: Record<string, { nome: string; pontos: number; peso: number; percentual: number; itens: Array<{ item: string; status: string; mensagem: string }> }>
  vtn: { encontrado: boolean; valor_estimado?: number; valor_referencia?: number; municipio?: string } | null
  resumo: string
  validacao: { pendencias: string[]; pontos_positivos: string[] }
  status_final: {
    status: string
    justificativa: string
    impedimentos: string[]
    pendencias: string[]
    pontos_positivos: string[]
  }
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function DestinacaoUCBasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [resultado, setResultado] = useState<{ consultaId: string; parecer: Parecer } | null>(null)

  const [nomeImovel, setNomeImovel] = useState("")
  const [municipio, setMunicipio] = useState("")
  const [matriculaFile, setMatriculaFile] = useState<File | null>(null)
  const [kmlFile, setKmlFile] = useState<File | null>(null)
  const [cndFile, setCndFile] = useState<File | null>(null)

  async function handleSubmit() {
    setErro("")
    if (!matriculaFile) return setErro("Envie a matrícula do imóvel (PDF).")
    if (!kmlFile) return setErro("Envie o arquivo geoespacial (KML ou GeoJSON).")

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("ferramenta_id", "dest-uc-base")
      formData.append("nome_imovel", nomeImovel)
      formData.append("municipio", municipio)
      formData.append("matricula", matriculaFile)
      formData.append("kml", kmlFile)
      if (cndFile) formData.append("cnd", cndFile)

      const res = await fetch("/api/consultas", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) {
        setErro(data.erro || "Erro ao processar consulta.")
        setLoading(false)
        return
      }

      setResultado({ consultaId: data.consulta_id, parecer: data.parecer })
      router.refresh()
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    }
    setLoading(false)
  }

  // ============================================
  // TELA DE RESULTADO
  // ============================================

  if (resultado) {
    const { parecer, consultaId } = resultado
    const p = parecer
    const temVeto = p.vetos.length > 0
    const corFaixa = p.classificacao.cor

    // UC principal (maior sobreposição)
    const ucPrincipal = p.ide_sisema.ucs.length > 0
      ? p.ide_sisema.ucs.reduce((max, uc) => (uc.percentual_sobreposicao || 0) > (max.percentual_sobreposicao || 0) ? uc : max, p.ide_sisema.ucs[0])
      : null

    // CND vencida?
    const cndVencida = p.cnd?.data_validade ? new Date(p.cnd.data_validade) < new Date() : false

    // Divergência de área matrícula vs CND
    const areaMat = p.imovel.area_hectares
    const areaCND = p.cnd?.area_hectares
    const temDivergenciaArea = areaMat && areaCND && Math.abs((areaCND - areaMat) / areaMat * 100) > 5

    return (
      <div>
        <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "var(--spacing-4) var(--spacing-6) 0" }}>
          <Link href="/dashboard" className="text-sm text-muted-foreground inline-flex items-center gap-1" style={{ textDecoration: "none" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Voltar ao dashboard
          </Link>
        </div>

        <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "var(--spacing-6)", display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>

          {/* Header do resultado */}
          <div style={{ background: `linear-gradient(135deg, ${corFaixa} 0%, ${corFaixa}cc 100%)`, color: "white", borderRadius: "var(--radius-xl)", padding: "2rem" }}>
            <p style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "0.25rem" }}>Análise Preliminar de Viabilidade</p>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>{p.imovel.nome || p.imovel.municipio || "Imóvel Analisado"}</h2>
            <p style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {p.imovel.municipio}/{p.imovel.estado} — {p.imovel.area_hectares?.toFixed(2)} ha
            </p>
            <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.15)", borderRadius: "var(--radius-lg)" }}>
              <strong>{temVeto ? "Impedimentos identificados" : p.classificacao.label}</strong> — {p.classificacao.acao}
            </div>
          </div>

          {/* Disclaimer principal */}
          <div className="acam-alert acam-alert-warning">
            <strong>Análise preliminar.</strong> Este relatório é uma pré-avaliação automatizada e não substitui parecer técnico ou jurídico com responsabilidade profissional. O objetivo é antecipar possíveis problemas antes de investir esforço em negociações. Para análise aprofundada, consulte um profissional qualificado.
          </div>

          {/* VETOS */}
          {temVeto && (
            <div className="acam-card" style={{ padding: "var(--spacing-6)", borderLeft: "4px solid var(--error)" }}>
              <h3 className="font-semibold mb-3" style={{ color: "var(--error)" }}>Impedimentos Identificados</h3>
              <p className="text-sm text-muted-foreground mb-3">Situações que, se confirmadas, impedem a destinação do imóvel.</p>
              {p.vetos.map((v, i) => (
                <div key={i} style={{ padding: "0.75rem", background: "var(--error-50, #fef2f2)", borderRadius: "var(--radius-md)", marginBottom: "0.5rem" }}>
                  <strong className="text-sm">{v.origem}:</strong> <span className="text-sm">{v.motivo}</span>
                </div>
              ))}
            </div>
          )}

          {/* ============================================ */}
          {/* SEÇÃO 1: LOCALIZAÇÃO EM UC */}
          {/* ============================================ */}
          <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
            <h3 className="font-semibold mb-2">Localização em Unidade de Conservação</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Para compensação minerária, o imóvel deve estar inserido em UC de Proteção Integral pendente de regularização fundiária (Lei Estadual 20.922/2013).
            </p>

            {p.ide_sisema.ucs.length === 0 ? (
              <div className="acam-alert acam-alert-error">
                Nenhuma Unidade de Conservação identificada na área do imóvel. O imóvel não atende ao requisito básico de localização.
              </div>
            ) : (
              <>
                {p.ide_sisema.ucs.map((uc, i) => (
                  <div key={i} style={{ padding: "1rem", background: "var(--neutral-50)", borderRadius: "var(--radius-md)", marginBottom: "0.75rem" }}>
                    <div className="flex items-center justify-between mb-2">
                      <strong className="text-sm">{uc.nome}</strong>
                      <StatusBadge variant={uc.protecao_integral ? "success" : "warning"}>
                        {uc.protecao_integral ? "Proteção Integral" : "Uso Sustentável"}
                      </StatusBadge>
                    </div>
                    <div className="text-sm text-muted-foreground">{uc.categoria}</div>
                    {uc.percentual_sobreposicao != null && (
                      <div className="text-sm mt-2">
                        <strong>{uc.percentual_sobreposicao}%</strong> do imóvel está no interior da UC
                        {uc.area_sobreposicao_ha != null && <> ({uc.area_sobreposicao_ha} ha)</>}
                        {uc.area_fora_uc_ha != null && uc.area_fora_uc_ha > 0 && (
                          <span className="text-muted-foreground"> — {uc.area_fora_uc_ha} ha fora da UC</span>
                        )}
                      </div>
                    )}
                    {!uc.protecao_integral && (
                      <div className="text-sm mt-2" style={{ color: "var(--warning)" }}>
                        A UC não é de Proteção Integral. A Portaria IEF 27/2017 exige que o imóvel esteja em UC de Proteção Integral.
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Mapa */}
            {p.ide_sisema.bbox && p.ide_sisema.centroide && (
              <div style={{ marginTop: "1rem" }}>
                <MapaImovel
                  bbox={p.ide_sisema.bbox}
                  centroide={p.ide_sisema.centroide}
                  geojsonImovel={p.ide_sisema.geojson_imovel || undefined}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  O mapa mostra a localização aproximada baseada no arquivo geoespacial enviado. Para visualização precisa, utilize software GIS.
                </p>
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* SEÇÃO 2: ANÁLISE DA MATRÍCULA */}
          {/* ============================================ */}
          <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
            <h3 className="font-semibold mb-2">Análise da Matrícula</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Extração automática dos dados registrais. A IA analisa o PDF da matrícula e identifica proprietários, ônus, gravames e dados do imóvel.
            </p>

            {/* Dados básicos */}
            <div style={{ padding: "1rem", background: "var(--neutral-50)", borderRadius: "var(--radius-md)", marginBottom: "1rem" }}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {p.imovel.matricula && <div><span className="text-muted-foreground">Matrícula:</span> <strong>{p.imovel.matricula}</strong></div>}
                {p.imovel.cartorio && <div><span className="text-muted-foreground">Cartório:</span> <strong>{p.imovel.cartorio}</strong></div>}
                {p.imovel.area_hectares && <div><span className="text-muted-foreground">Área:</span> <strong>{p.imovel.area_hectares.toFixed(2)} ha</strong></div>}
                {p.imovel.data_emissao && (
                  <div>
                    <span className="text-muted-foreground">Emissão:</span>{" "}
                    <strong>{new Date(p.imovel.data_emissao).toLocaleDateString("pt-BR")}</strong>
                    {p.imovel.dias_desde_emissao != null && p.imovel.dias_desde_emissao > 30 && (
                      <span style={{ color: "var(--warning)", marginLeft: "0.5rem" }}>({p.imovel.dias_desde_emissao} dias — recomenda-se atualização)</span>
                    )}
                  </div>
                )}
                {p.imovel.ccir && <div><span className="text-muted-foreground">CCIR:</span> <strong>{p.imovel.ccir}</strong></div>}
                {p.imovel.nirf && <div><span className="text-muted-foreground">NIRF/CIB:</span> <strong>{p.imovel.nirf}</strong></div>}
              </div>
            </div>

            {/* Proprietários */}
            <h4 className="font-medium text-sm mb-2">Proprietários identificados</h4>
            {p.proprietarios.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum proprietário identificado na matrícula.</p>
            ) : (
              <div style={{ marginBottom: "1rem" }}>
                {p.proprietarios.map((prop, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b text-sm">
                    <div>
                      <strong>{prop.nome}</strong>
                      {prop.estado_civil && <span className="text-muted-foreground"> — {prop.estado_civil}</span>}
                      {prop.conjuge && <span className="text-muted-foreground"> (cônjuge: {prop.conjuge})</span>}
                    </div>
                    <span className="font-semibold">{prop.percentual}%</span>
                  </div>
                ))}
                {p.proprietarios.length > 2 && (
                  <p className="text-xs mt-2" style={{ color: "var(--warning)" }}>
                    Condomínio com {p.proprietarios.length} proprietários — todos devem assinar a escritura de doação.
                  </p>
                )}
              </div>
            )}

            {/* Ônus e Gravames */}
            <h4 className="font-medium text-sm mb-2">Ônus e Gravames</h4>
            {p.onus_gravames.length === 0 ? (
              <div style={{ padding: "0.75rem", background: "#f0fdf4", borderRadius: "var(--radius-md)" }}>
                <span className="text-sm" style={{ color: "var(--success)" }}>Nenhum ônus ou gravame identificado na matrícula — situação favorável.</span>
              </div>
            ) : (
              <div>
                {p.onus_gravames.map((onus, i) => (
                  <div key={i} style={{ padding: "0.75rem", background: "#fef2f2", borderRadius: "var(--radius-md)", marginBottom: "0.5rem" }}>
                    <strong className="text-sm">{onus.tipo}</strong>
                    {onus.numero_averbacao && <span className="text-xs text-muted-foreground"> ({onus.numero_averbacao})</span>}
                    <div className="text-sm mt-1">{onus.impacto_compra_venda || onus.descricao}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Alertas da matrícula */}
            {p.alertas_matricula.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <h4 className="font-medium text-sm mb-2">Alertas</h4>
                {p.alertas_matricula.map((alerta, i) => (
                  <p key={i} className="text-sm" style={{ color: "var(--warning)" }}>• {alerta}</p>
                ))}
              </div>
            )}

            {/* Disclaimer OCR */}
            <p className="text-xs text-muted-foreground mt-4" style={{ fontStyle: "italic" }}>
              A extração de dados da matrícula é feita por inteligência artificial. PDFs escaneados (imagem) podem ter precisão reduzida em relação a PDFs com texto selecionável. Recomenda-se conferir os dados extraídos com o documento original.
            </p>
          </div>

          {/* ============================================ */}
          {/* SEÇÃO 3: ANÁLISE FISCAL (CND-ITR) */}
          {/* ============================================ */}
          <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
            <h3 className="font-semibold mb-2">Análise Fiscal — CND-ITR</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A Certidão Negativa de Débitos do ITR comprova a regularidade fiscal do imóvel perante a Receita Federal, requisito para a transferência.
            </p>

            {!p.cnd ? (
              <div className="acam-alert acam-alert-info">
                CND-ITR não apresentada. A análise fiscal não pôde ser realizada. Recomenda-se incluir este documento para uma avaliação mais completa.
              </div>
            ) : (
              <div style={{ padding: "1rem", background: "var(--neutral-50)", borderRadius: "var(--radius-md)" }}>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>{" "}
                    <strong style={{ color: p.cnd.tipo === "negativa" || p.cnd.tipo?.includes("efeito") ? "var(--success)" : "var(--error)" }}>
                      {p.cnd.tipo === "negativa" ? "Certidão Negativa" :
                       p.cnd.tipo?.includes("efeito") ? "Positiva com Efeitos de Negativa" :
                       p.cnd.tipo === "positiva" ? "Certidão Positiva (débitos)" : p.cnd.tipo}
                    </strong>
                  </div>
                  {p.cnd.cib && <div><span className="text-muted-foreground">CIB/NIRF:</span> <strong>{p.cnd.cib}</strong></div>}
                  {p.cnd.data_validade && (
                    <div>
                      <span className="text-muted-foreground">Validade:</span>{" "}
                      <strong style={{ color: cndVencida ? "var(--error)" : "var(--success)" }}>
                        {new Date(p.cnd.data_validade).toLocaleDateString("pt-BR")}
                        {cndVencida && " (VENCIDA)"}
                      </strong>
                    </div>
                  )}
                  {p.cnd.area_hectares && (
                    <div><span className="text-muted-foreground">Área na CND:</span> <strong>{p.cnd.area_hectares.toFixed(2)} ha</strong></div>
                  )}
                </div>

                {/* Divergência de área */}
                {temDivergenciaArea && (
                  <div className="acam-alert acam-alert-warning" style={{ marginTop: "0.75rem" }}>
                    <strong>Divergência de área:</strong> Matrícula registra {areaMat?.toFixed(2)} ha, CND-ITR registra {areaCND?.toFixed(2)} ha
                    (diferença de {areaMat && areaCND ? Math.abs((areaCND - areaMat) / areaMat * 100).toFixed(1) : 0}%).
                    Pode indicar necessidade de retificação ou atualização cadastral.
                  </div>
                )}

                {/* NIRF cruzamento */}
                {p.imovel.nirf && p.cnd.cib && p.imovel.nirf !== p.cnd.cib && (
                  <div className="acam-alert acam-alert-warning" style={{ marginTop: "0.75rem" }}>
                    <strong>Divergência de código:</strong> NIRF na matrícula ({p.imovel.nirf}) difere do CIB na CND ({p.cnd.cib}).
                    Verificar se os documentos se referem ao mesmo imóvel.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* SEÇÃO 4: PENDÊNCIAS E PONTOS POSITIVOS */}
          {/* ============================================ */}
          <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
            <h3 className="font-semibold mb-4">Síntese da Análise</h3>

            {p.validacao.pontos_positivos.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <h4 className="font-medium text-sm mb-2" style={{ color: "var(--success)" }}>Pontos Favoráveis</h4>
                {p.validacao.pontos_positivos.map((pp, i) => (
                  <p key={i} className="text-sm" style={{ color: "var(--success)" }}>✓ {pp}</p>
                ))}
              </div>
            )}

            {p.validacao.pendencias.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <h4 className="font-medium text-sm mb-2" style={{ color: "var(--warning)" }}>Pendências Identificadas</h4>
                {p.validacao.pendencias.map((pend, i) => (
                  <p key={i} className="text-sm" style={{ color: "var(--warning)" }}>• {pend}</p>
                ))}
              </div>
            )}

            {p.status_final.impedimentos.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2" style={{ color: "var(--error)" }}>Impedimentos</h4>
                {p.status_final.impedimentos.map((imp, i) => (
                  <p key={i} className="text-sm" style={{ color: "var(--error)" }}>✗ {imp}</p>
                ))}
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* SEÇÃO 5: CONCLUSÃO */}
          {/* ============================================ */}
          <div className="acam-card" style={{ padding: "var(--spacing-6)", borderLeft: `4px solid ${corFaixa}` }}>
            <h3 className="font-semibold mb-2">Conclusão</h3>
            <p className="text-sm mb-3">{p.status_final.justificativa}</p>
            <p className="text-sm text-muted-foreground">{p.resumo}</p>
          </div>

          {/* VTN */}
          {p.vtn?.encontrado && (
            <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
              <h3 className="font-semibold mb-2">Valor de Referência (VTN)</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Valor da Terra Nua por hectare, conforme Sistema de Preços de Terras (SIPT/Receita Federal). Referência para estimativa, não substitui laudo de avaliação.
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Município:</span> <strong>{p.vtn.municipio}</strong></div>
                <div><span className="text-muted-foreground">R$/ha (preservação):</span> <strong>R$ {p.vtn.valor_referencia?.toLocaleString("pt-BR")}</strong></div>
                {p.vtn.valor_estimado && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span className="text-muted-foreground">Valor estimado total:</span>{" "}
                    <strong style={{ fontSize: "1.1rem" }}>R$ {p.vtn.valor_estimado.toLocaleString("pt-BR")}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Disclaimer final */}
          <div className="acam-alert-result">
            <strong>Importante.</strong> Esta é uma análise preliminar automatizada. Não constitui parecer jurídico ou técnico. Os dados extraídos por IA devem ser conferidos com os documentos originais. A viabilidade definitiva da compensação depende de análise por profissional qualificado e aprovação do órgão gestor da UC.
          </div>

          {/* Botões */}
          <div style={{ display: "flex", gap: "var(--spacing-3)", flexWrap: "wrap" }}>
            <button className="acam-btn acam-btn-primary" onClick={async () => {
              const res = await fetch(`/api/consultas/${consultaId}`)
              const data = await res.json()
              if (data.consulta?.pdf_url) {
                window.open(data.consulta.pdf_url, "_blank")
              }
            }}>Baixar Relatório PDF</button>
            <Link href="/dashboard" className="acam-btn acam-btn-secondary">Voltar ao dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // TELA DE UPLOAD (FORMULÁRIO)
  // ============================================

  return (
    <div>
      <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "var(--spacing-4) var(--spacing-6) 0" }}>
        <Link href="/dashboard" className="text-sm text-muted-foreground inline-flex items-center gap-1" style={{ textDecoration: "none" }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Voltar ao dashboard
        </Link>
      </div>

      <div className="acam-service-header acam-service-header-primary">
        <div className="acam-service-header-content">
          <div className="acam-service-header-info">
            <div className="acam-service-header-icon">UC</div>
            <div className="acam-service-header-text">
              <h1>Destinação em UC — Base</h1>
              <p>Compensação Minerária (2.1) e Reserva Legal (6.3)</p>
            </div>
          </div>
          <div className="acam-service-header-cost">
            <div className="acam-service-header-cost-label">Custo</div>
            <div className="acam-service-header-cost-value">{CUSTO_CREDITOS} créditos</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "var(--spacing-6)", display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
        <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
          <div className="acam-section-title">Dados do Imóvel</div>
          <div className="acam-section-desc">Informações básicas para identificação.</div>
          <div className="acam-fg acam-fg-2">
            <div className="acam-field">
              <label>Nome do Imóvel</label>
              <input className="acam-form-input" placeholder="Ex: Fazenda Boa Vista" value={nomeImovel} onChange={(e) => setNomeImovel(e.target.value)} />
            </div>
            <div className="acam-field">
              <label>Município</label>
              <input className="acam-form-input" placeholder="Ex: Três Marias" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
          <div className="acam-section-title">Documentos Obrigatórios</div>
          <div className="acam-section-desc">Matrícula atualizada e arquivo geoespacial do imóvel.</div>
          <div className="acam-fg acam-fg-2">
            <div className="acam-field">
              <label>Matrícula do Imóvel <span className="req">*</span></label>
              <input type="file" className="acam-form-input" accept=".pdf" onChange={(e) => setMatriculaFile(e.target.files?.[0] || null)} />
              <span className="hint">PDF da matrícula atualizada (máx. 10MB). PDFs com texto selecionável produzem resultados mais precisos.</span>
            </div>
            <div className="acam-field">
              <label>Arquivo Geoespacial <span className="req">*</span></label>
              <input type="file" className="acam-form-input" accept=".kml,.kmz,.geojson,.json" onChange={(e) => setKmlFile(e.target.files?.[0] || null)} />
              <span className="hint">KML, KMZ ou GeoJSON do perímetro do imóvel</span>
            </div>
          </div>
        </div>

        <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
          <div className="acam-section-title">Documento Complementar</div>
          <div className="acam-section-desc">A CND-ITR permite verificar a regularidade fiscal e cruzar dados com a matrícula.</div>
          <div className="acam-field">
            <label>CND-ITR (Certidão Negativa de Débitos do ITR)</label>
            <input type="file" className="acam-form-input" accept=".pdf" onChange={(e) => setCndFile(e.target.files?.[0] || null)} />
            <span className="hint">Certidão do imóvel rural emitida pela Receita Federal. Opcional, mas recomendada.</span>
          </div>
        </div>

        {erro && <div className="acam-alert acam-alert-error">{erro}</div>}

        <div className="acam-alert-result">
          <strong>O que será analisado:</strong> A matrícula será processada por IA para extrair proprietários, ônus e dados registrais.
          O arquivo geoespacial será cruzado com a base do IDE-Sisema para verificar sobreposição com Unidades de Conservação de Proteção Integral.
          Se a CND-ITR for incluída, os dados fiscais serão cruzados com os dados da matrícula para identificar divergências.
        </div>

        <button className="acam-btn acam-btn-primary" style={{ width: "100%" }} onClick={handleSubmit} disabled={loading}>
          {loading ? "Processando análise..." : `Analisar Imóvel (${CUSTO_CREDITOS} créditos)`}
        </button>
      </div>
    </div>
  )
}
