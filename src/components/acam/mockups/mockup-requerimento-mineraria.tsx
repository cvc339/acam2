/**
 * Mockup visual da primeira página do PDF gerado pela ferramenta
 * Requerimento de Compensação Minerária. Reproduz estrutura típica
 * do formulário oficial usado pelo Estado.
 */
export function MockupRequerimentoMineraria() {
  return (
    <div className="acam-mockup acam-mockup-pdf">
      <div className="acam-mockup-pdf-header">
        <p className="acam-mockup-pdf-org">SECRETARIA DE ESTADO DE MEIO AMBIENTE</p>
        <p className="acam-mockup-pdf-titulo">REQUERIMENTO DE COMPENSAÇÃO AMBIENTAL — MINERÁRIA</p>
        <p className="acam-mockup-pdf-base">Lei 20.922/2013 · Decreto 47.749/2019 · Portaria IEF 27/2017</p>
      </div>

      <div className="acam-mockup-pdf-secao">
        <p className="acam-mockup-pdf-secao-titulo">1. RESPONSÁVEL TÉCNICO</p>
        <div className="acam-mockup-grid-2">
          <div><span className="acam-mockup-field-label">Nome</span><span>Eng. Ana Beatriz Souza</span></div>
          <div><span className="acam-mockup-field-label">CPF</span><span>●●●.●●●.●●●-●●</span></div>
          <div><span className="acam-mockup-field-label">CREA/MG</span><span>178.452/D</span></div>
          <div><span className="acam-mockup-field-label">ART/RRT</span><span>2026/0421-AB</span></div>
        </div>
      </div>

      <div className="acam-mockup-pdf-secao">
        <p className="acam-mockup-pdf-secao-titulo">2. EMPREENDEDOR</p>
        <div className="acam-mockup-grid-2">
          <div><span className="acam-mockup-field-label">Razão social</span><span>Mineradora Vale do Cipó S.A.</span></div>
          <div><span className="acam-mockup-field-label">CNPJ</span><span>●●.●●●.●●●/●●●●-●●</span></div>
        </div>
      </div>

      <div className="acam-mockup-pdf-secao">
        <p className="acam-mockup-pdf-secao-titulo">3. PROCESSO MINERÁRIO</p>
        <div className="acam-mockup-grid-2">
          <div><span className="acam-mockup-field-label">DNPM/ANM</span><span>831.422/2019</span></div>
          <div><span className="acam-mockup-field-label">Substância</span><span>Minério de ferro</span></div>
          <div><span className="acam-mockup-field-label">Tipo de licença</span><span>Licença de Operação</span></div>
          <div><span className="acam-mockup-field-label">Área a suprimir</span><span>12,40 ha</span></div>
        </div>
      </div>

      <p className="acam-mockup-pdf-rodape">Página 1 de 4 · Gerado pelo ACAM · acam.com.br</p>
    </div>
  )
}
