import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { jsPDF } from "jspdf"
import { readFileSync } from "fs"
import { join } from "path"
import type {
  FormMineraria,
  FormMataAtlantica,
  FormSNUC,
  DadosEmpreendedor,
  DadosCorrespondencia,
} from "@/lib/requerimentos/types"

// Brasão de MG — string base64 pura lida como texto UTF-8
const brasaoPath = join(process.cwd(), "src/lib/pdf/brasao-mg-base64.txt")
let brasaoMG = ""
try {
  const raw = readFileSync(brasaoPath, "utf-8").trim()
  brasaoMG = "data:image/png;base64," + raw
} catch (e) {
  console.warn("Brasão de MG não encontrado:", e)
}

// ============================================
// HELPERS COMPARTILHADOS
// ============================================

function setupDoc() {
  const doc = new jsPDF()
  const pw = doc.internal.pageSize.getWidth()
  const m = 15
  const cw = pw - 2 * m
  return { doc, pw, m, cw }
}

type DrawHeaderFn = (doc: jsPDF, yPos: number, m: number, cw: number) => void

function drawHeaderMineraria(doc: jsPDF, yPos: number, m: number, cw: number) {
  doc.setDrawColor(0)
  doc.setLineWidth(0.3)
  doc.rect(m, yPos, cw, 22)

  if (brasaoMG) {
    try { doc.addImage(brasaoMG, "PNG", m + 2, yPos + 1, 20, 20) } catch {}
  }

  const divX = m + 118
  doc.line(divX, yPos, divX, yPos + 22)

  const txLeft = m + 24
  doc.setFontSize(8); doc.setFont("helvetica", "bold")
  doc.text("GOVERNO DO ESTADO DE MINAS GERAIS", txLeft, yPos + 5)
  doc.setFontSize(6); doc.setFont("helvetica", "normal")
  doc.text("Secretaria de Estado de Meio Ambiente e", txLeft, yPos + 9)
  doc.text("Desenvolvimento Sustentável - SEMAD", txLeft, yPos + 12)
  doc.text("Conselho Estadual de Política Ambiental - COPAM", txLeft, yPos + 15)
  doc.text("Instituto Estadual de Florestas - IEF", txLeft, yPos + 18)

  doc.setFontSize(6.5); doc.setFont("helvetica", "bold")
  doc.text("ANEXO I", divX + 3, yPos + 6)
  doc.text("REQUERIMENTO PARA FORMALIZAÇÃO", divX + 3, yPos + 10)
  doc.text("DE PROPOSTA DE COMPENSAÇÃO", divX + 3, yPos + 14)
  doc.text("FLORESTAL MINERÁRIA", divX + 3, yPos + 18)
}

function drawHeaderMataAtlantica(doc: jsPDF, yPos: number, m: number, cw: number) {
  doc.setDrawColor(0)
  doc.setLineWidth(0.3)
  doc.rect(m, yPos, cw, 22)

  if (brasaoMG) {
    try { doc.addImage(brasaoMG, "PNG", m + 2, yPos + 1, 20, 20) } catch {}
  }

  const divX = m + 118
  doc.line(divX, yPos, divX, yPos + 22)

  const txLeft = m + 24
  doc.setFontSize(8); doc.setFont("helvetica", "bold")
  doc.text("GOVERNO DO ESTADO DE MINAS GERAIS", txLeft, yPos + 5)
  doc.setFontSize(6); doc.setFont("helvetica", "normal")
  doc.text("Secretaria de Estado de Meio Ambiente e", txLeft, yPos + 9)
  doc.text("Desenvolvimento Sustentável - SEMAD", txLeft, yPos + 12)
  doc.text("Conselho Estadual de Política Ambiental - COPAM", txLeft, yPos + 15)
  doc.text("Instituto Estadual de Florestas - IEF", txLeft, yPos + 18)

  doc.setFontSize(6.5); doc.setFont("helvetica", "bold")
  doc.text("ANEXO I", divX + 3, yPos + 6)
  doc.text("REQUERIMENTO PARA FORMALIZAÇÃO", divX + 3, yPos + 10)
  doc.text("DE PROPOSTA DE COMPENSAÇÃO", divX + 3, yPos + 14)
  doc.text("FLORESTAL - MATA ATLÂNTICA", divX + 3, yPos + 18)
}

function drawHeaderSNUC(doc: jsPDF, yPos: number, m: number, cw: number) {
  doc.setDrawColor(0)
  doc.setLineWidth(0.3)
  doc.rect(m, yPos, cw, 22)

  if (brasaoMG) {
    try { doc.addImage(brasaoMG, "PNG", m + 2, yPos + 1, 20, 20) } catch {}
  }

  const divX = m + 118
  doc.line(divX, yPos, divX, yPos + 22)

  const txLeft = m + 24
  doc.setFontSize(9); doc.setFont("helvetica", "bold")
  doc.text("GOVERNO DO ESTADO DE MINAS GERAIS", txLeft, yPos + 7)
  doc.setFontSize(7); doc.setFont("helvetica", "normal")
  doc.text("Secretaria de Estado de Meio Ambiente e", txLeft, yPos + 11)
  doc.text("Desenvolvimento Sustentável - SEMAD", txLeft, yPos + 14)
  doc.text("Conselho Estadual de Política Ambiental - COPAM", txLeft, yPos + 17)

  doc.setFontSize(7.5); doc.setFont("helvetica", "bold")
  doc.text("REQUERIMENTO PARA", divX + 3, yPos + 7)
  doc.text("FORMALIZAÇÃO DE PROCESSO", divX + 3, yPos + 11)
  doc.text("DE COMPENSAÇÃO AMBIENTAL", divX + 3, yPos + 15)
}

function drawFooter(doc: jsPDF, m: number, cw: number) {
  const pw = doc.internal.pageSize.getWidth()
  const ph = doc.internal.pageSize.getHeight()
  doc.setDrawColor(0)
  doc.setLineWidth(0.3)
  doc.line(m, ph - 20, m + cw, ph - 20)

  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.text("Instituto Estadual de Florestas – IEF", pw / 2, ph - 16, { align: "center" })
  doc.setFont("helvetica", "normal")
  doc.text("Diretoria de Áreas Protegidas – DIAP // Gerência de Compensação Ambiental – GCA", pw / 2, ph - 12, { align: "center" })
  doc.text("Cidade Administrativa do Estado de Minas Gerais - Rodovia Prefeito Américo Gianetti, s/n. Bairro Serra Verde - Belo Horizonte - MG", pw / 2, ph - 8, { align: "center" })
  doc.text("CEP: 31630-900 - Telefone (31) 3916-9269", pw / 2, ph - 4, { align: "center" })
}

function drawSignature(doc: jsPDF, m: number, cw: number, y: number, nomeCompleto: string, qualidade: string): number {
  y += 12

  doc.setDrawColor(0)
  doc.setLineWidth(0.2)

  doc.text("___/___/______", m, y)

  const nomeLineStart = m + 40
  const nomeLineEnd = m + 120
  doc.line(nomeLineStart, y, nomeLineEnd, y)

  const assLineStart = m + 130
  const assLineEnd = m + cw
  doc.line(assLineStart, y, assLineEnd, y)

  y += 4

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Data", m + 8, y)
  doc.text("Nome legível", nomeLineStart + 25, y)
  doc.text("Assinatura", assLineStart + 15, y)

  y += 6

  doc.setFontSize(8)
  const nomeResp = `${nomeCompleto} - ${qualidade}`
  const nomeRespWidth = doc.getTextWidth(nomeResp)
  const centerX = (nomeLineStart + nomeLineEnd) / 2 - nomeRespWidth / 2
  doc.text(nomeResp, centerX, y)

  return y
}

function drawAtencao(doc: jsPDF, m: number, cw: number, y: number): number {
  y += 6
  doc.setDrawColor(0)
  doc.setLineWidth(0.3)
  doc.rect(m, y - 3, cw, 14, "S")

  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("ATENÇÃO!", m + 2, y + 1)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  const alertText = "FORMULÁRIOS COM INSUFICIÊNCIA, INCORREÇÃO DE INFORMAÇÕES OU DESACOMPANHADOS DE TODA A DOCUMENTAÇÃO NECESSÁRIA À FORMALIZAÇÃO DA PROPOSTA, SERÃO OFICIALMENTE DEVOLVIDOS AO REQUERENTE, VIA ENDEREÇO INDICADO NO CAMPO 3."
  const alertLines = doc.splitTextToSize(alertText, cw - 4)
  doc.text(alertLines, m + 2, y + 5)

  return y + 14
}

function drawEmpreendedor(
  doc: jsPDF, m: number, cw: number, y: number,
  emp: DadosEmpreendedor,
  sectionTitle: string,
  titleFn: (t: string) => void,
  fieldFn: (l: string, v: string) => void,
  checkFn: () => void,
  setY: (v: number) => void,
) {
  checkFn()
  titleFn(sectionTitle)
  fieldFn("Razão Social", emp.razaoSocial)
  fieldFn("Nome Fantasia", emp.nomeFantasia)
  fieldFn("CNPJ/CPF", emp.cnpjCpf)
  fieldFn("IE", emp.ie || "N/A")
  const endEmp = [emp.endereco, emp.numero, emp.complemento, emp.bairro].filter(Boolean).join(", ")
  fieldFn("Endereço", endEmp)
  fieldFn("Município/UF", `${emp.cidade}/${emp.uf}`)
  fieldFn("CEP", emp.cep)
  fieldFn("Tel", emp.telefone)
  fieldFn("Email", emp.email)
}

function drawCorrespondencia(
  doc: jsPDF, m: number, cw: number,
  corresp: DadosCorrespondencia,
  sectionTitle: string,
  titleFn: (t: string) => void,
  textFn: (t: string) => void,
  fieldFn: (l: string, v: string) => void,
  checkFn: () => void,
  getY: () => number,
  setY: (v: number) => void,
) {
  checkFn()
  titleFn(sectionTitle)
  doc.setFontSize(7); doc.setFont("helvetica", "italic")
  doc.text("(Informar endereço em área urbana, pois os Correios não entregam correspondência em área rural)", m, getY())
  setY(getY() + 4)

  if (corresp.tipo === "empreendedor") {
    textFn("[ X ] REPETIR CAMPO 2 (Empreendedor)")
  } else if (corresp.tipo === "empreendimento") {
    textFn("[ X ] REPETIR CAMPO 3 (Empreendimento)")
  } else {
    fieldFn("Destinatário", corresp.destinatario + " / " + corresp.vinculo)
    const endCorresp = [corresp.endereco, corresp.numero, corresp.complemento, corresp.bairro].filter(Boolean).join(", ")
    fieldFn("Endereço", endCorresp)
    fieldFn("Município/UF", `${corresp.cidade}/${corresp.uf}`)
    fieldFn("CEP", corresp.cep)
    if (corresp.telefone) fieldFn("Telefone", corresp.telefone)
    if (corresp.email) fieldFn("E-mail", corresp.email)
  }
}

// ============================================
// PDF: MINERÁRIA
// ============================================

function gerarPDFMineraria(form: FormMineraria): ArrayBuffer {
  const { doc, pw, m, cw } = setupDoc()
  let y = 12

  const drawH = (yPos: number) => drawHeaderMineraria(doc, yPos, m, cw)

  drawH(y)
  y += 30

  const title = (t: string) => { doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text(t, m, y); y += 5 }
  const text = (t: string) => { doc.setFontSize(9); doc.setFont("helvetica", "normal"); const l = doc.splitTextToSize(t, cw); doc.text(l, m, y); y += l.length * 4 }
  const field = (l: string, v: string) => { doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text(l + ": ", m, y); const lw = doc.getTextWidth(l + ": "); doc.setFont("helvetica", "normal"); doc.text(v || "___", m + lw, y); y += 5 }
  const check = () => { if (y > 240) { doc.addPage(); drawH(12); y = 42 } }

  const r = form.responsavel
  const p = form.processo

  // 1. Intro
  text(`EU, ${r.nomeCompleto || "___"}, ${r.nacionalidade || "Brasileiro(a)"}, ${r.estadoCivil || "___"}, portador da Cédula de Identidade ${r.rg || "___"} e do CPF Nº ${r.cpf || "___"}, residente e domiciliado na ${r.endereco || "___"}, nº ${r.numero || "___"}, Bairro ${r.bairro || "___"}, cidade de ${r.cidade || "___"}, CEP ${r.cep || "___"}, na qualidade de ${r.qualidade || "___"} do empreendimento abaixo indicado, ou, na qualidade de responsável legal pelo processo de intervenção ambiental igualmente identificado,`)
  text(`em observância ao disposto no § 2º do Art. 75 da Lei Estadual Nº 20.922, de 16 de outubro de 2013, compareço respeitosamente perante a Unidade Regional do IEF ${r.unidadeIEF || "___"}, a fim de requerer a formalização de proposta para cumprimento de COMPENSAÇÃO FLORESTAL DE EMPREENDIMENTOS MINERÁRIOS, prestando, para tanto, as seguintes informações, acompanhada de projeto executivo em anexo:`)
  y += 2

  // 2. Empreendedor
  drawEmpreendedor(doc, m, cw, y, form.empreendedor, "2. IDENTIFICAÇÃO DO EMPREENDEDOR / RESPONSÁVEL PELO PROCESSO DE INTERVENÇÃO AMBIENTAL", title, field, check, (v) => { y = v })
  y += 2

  // 3. Correspondência
  drawCorrespondencia(doc, m, cw, form.correspondencia, "3. ENDEREÇO PARA CORRESPONDÊNCIA", title, text, field, check, () => y, (v) => { y = v })
  y += 2

  // 4. Processo
  check(); title("4. IDENTIFICAÇÃO DO PROCESSO DE LICENCIAMENTO AMBIENTAL OU DO PROCESSO DE INTERVENÇÃO AMBIENTAL")
  field("4.1 Processo Administrativo", p.processoAdmin)
  field("4.2 Certificado de Licença/AAF/DAIA", p.certificadoLicenca + (p.tipoLicenca ? " / " + p.tipoLicenca : ""))
  field("4.3 Tipo de Licença", p.tipoLicenca || "N/A")
  field("4.4 Validade do Ato Autorizativo", `${p.validadeAto} anos`)
  field("4.5 Data Aprovação", p.dataAprovacao)
  field("4.6 Condicionante Comp. Florestal Minerária", p.condicionante)
  field("4.7 Área efetivamente ocupada pelo empreendimento (ha), conforme §1º do Art. 36 da Lei Estadual Nº 14.309/2002, recepcionado pelo §2º do Art. 75 da Lei Estadual Nº 20.922/2013", p.areaOcupada)
  field("4.8 Outros processos", p.outrosProc === "sim" ? "SIM - " + p.outrosProcNum : "NÃO")
  field("4.9 DNPM", p.dnpm)
  y += 3

  // Declaração
  check(); title("DECLARAÇÃO")
  text("Declaro sob as penas da lei que as informações aqui prestadas são verdadeiras e que estou ciente de que a falsidade com relação às mesmas configura crime, nos termos do Artigo 299 do Código Penal, c/c Artigo 3º da Lei 9.605/1998.")
  y += 5

  // Assinatura
  check()
  y = drawSignature(doc, m, cw, y, r.nomeCompleto, r.qualidade)

  // Atenção
  y = drawAtencao(doc, m, cw, y)

  // Rodapé
  drawFooter(doc, m, cw)

  return doc.output("arraybuffer")
}

// ============================================
// PDF: MATA ATLÂNTICA
// ============================================

function gerarPDFMataAtlantica(form: FormMataAtlantica): ArrayBuffer {
  const { doc, pw, m, cw } = setupDoc()
  let y = 12

  const drawH = (yPos: number) => drawHeaderMataAtlantica(doc, yPos, m, cw)

  drawH(y)
  y += 30

  const title = (t: string) => { doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text(t, m, y); y += 5 }
  const text = (t: string) => { doc.setFontSize(9); doc.setFont("helvetica", "normal"); const l = doc.splitTextToSize(t, cw); doc.text(l, m, y); y += l.length * 4 }
  const field = (l: string, v: string) => { doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text(l + ": ", m, y); const lw = doc.getTextWidth(l + ": "); doc.setFont("helvetica", "normal"); doc.text(v || "___", m + lw, y); y += 5 }
  const check = () => { if (y > 240) { doc.addPage(); drawH(12); y = 42 } }

  const r = form.responsavel
  const p = form.processo

  // 1. Intro
  text(`EU, ${r.nomeCompleto || "___"}, ${r.nacionalidade || "Brasileiro(a)"}, ${r.estadoCivil || "___"}, portador da Cédula de Identidade ${r.rg || "___"} e do CPF Nº ${r.cpf || "___"}, residente e domiciliado na ${r.endereco || "___"}, nº ${r.numero || "___"}, Bairro ${r.bairro || "___"}, cidade de ${r.cidade || "___"}, CEP ${r.cep || "___"}, na qualidade de ${r.qualidade || "___"} do empreendimento abaixo indicado, ou, na qualidade de responsável legal pelo processo de intervenção ambiental igualmente identificado,`)
  text(`em observância ao disposto no Art. 17 da Lei Federal Nº 11.428, de 22 de dezembro de 2006, compareço respeitosamente perante a Gerência de Compensação Ambiental - GCA/IEF, a fim de requerer a formalização de proposta para cumprimento de compensação florestal, prestando, para tanto, as seguintes informações, acompanhada de projeto executivo em anexo:`)
  y += 2

  // 2. Empreendedor
  drawEmpreendedor(doc, m, cw, y, form.empreendedor, "2. IDENTIFICAÇÃO DO EMPREENDEDOR / RESPONSÁVEL PELO PROCESSO DE INTERVENÇÃO AMBIENTAL", title, field, check, (v) => { y = v })
  y += 2

  // 3. Correspondência
  drawCorrespondencia(doc, m, cw, form.correspondencia, "3. ENDEREÇO PARA ENVIO DE CORRESPONDÊNCIA", title, text, field, check, () => y, (v) => { y = v })
  y += 2

  // 4. Processo
  check(); title("4. IDENTIFICAÇÃO DO PROCESSO DE LICENCIAMENTO AMBIENTAL OU DO PROCESSO DE INTERVENÇÃO AMBIENTAL")
  field("4.1 Processo COPAM Nº", p.processoCOPAM)
  field("4.2 Certificado de Licença/Tipo/Nº", p.certificadoLicenca + (p.tipoLicenca ? " / " + p.tipoLicenca : ""))
  field("4.3 Validade da Licença", `${p.validadeLicenca} anos`)
  field("4.4 Data Aprovação junto à URC/COPAM", p.dataAprovacao)
  field("4.5 Nº Condicionante Compensação Florestal", p.condicionante)
  field("4.6 Outros processos vinculados", p.outrosProc === "sim" ? "SIM - " + p.outrosProcNum : "NÃO")
  field("4.7 Processo de Intervenção Ambiental (Desmate)", p.processoDesmate || "N/A")
  field("4.8 APEF", p.apefNum ? p.apefNum + " - Válida até: " + p.apefValidade : "N/A")
  field("4.9 DAIA", p.daiaNum ? p.daiaNum + " - Válido até: " + p.daiaValidade : "N/A")
  y += 3

  // Declaração
  check(); title("DECLARAÇÃO")
  text("Declaro sob as penas da lei que as informações aqui prestadas são verdadeiras e que estou ciente de que a falsidade com relação às mesmas configura crime, nos termos do Artigo 299 do Código Penal, c/c Artigo 3º da Lei 9.605/1998.")
  y += 5

  // Assinatura
  check()
  y = drawSignature(doc, m, cw, y, r.nomeCompleto, r.qualidade)

  // Atenção
  y = drawAtencao(doc, m, cw, y)

  // Rodapé
  drawFooter(doc, m, cw)

  return doc.output("arraybuffer")
}

// ============================================
// PDF: SNUC
// ============================================

function gerarPDFSNUC(form: FormSNUC): ArrayBuffer {
  const { doc, pw, m, cw } = setupDoc()
  let y = 12

  const drawH = (yPos: number) => drawHeaderSNUC(doc, yPos, m, cw)

  drawH(y)
  y += 30

  const title = (t: string) => { doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text(t, m, y); y += 6 }
  const text = (t: string) => { doc.setFontSize(9); doc.setFont("helvetica", "normal"); const l = doc.splitTextToSize(t, cw); doc.text(l, m, y); y += l.length * 4.5 }
  const field = (l: string, v: string) => { doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text(l + ": ", m, y); const lw = doc.getTextWidth(l + ": "); doc.setFont("helvetica", "normal"); doc.text(v || "___", m + lw, y); y += 5.5 }
  const check = () => { if (y > 270) { doc.addPage(); drawH(12); y = 42 } }

  const r = form.responsavel
  const p = form.processo

  // Intro
  text(`EU, ${r.nomeCompleto || "___"}, ${r.nacionalidade || "Brasileiro(a)"}, ${r.estadoCivil || "___"}, portador do RG ${r.rg || "___"} e CPF ${r.cpf || "___"}, residente na ${r.endereco || "___"}, nº ${r.numero || "___"}, Bairro ${r.bairro || "___"}, ${r.cidade || "___"}, CEP ${r.cep || "___"}, na qualidade de ${r.qualidade || "___"} do empreendimento abaixo identificado,`)
  text(`em observância ao Art. 11 do Decreto Estadual 45.175/2009, compareço perante a GCA/IEF para requerer formalização de Processo Administrativo visando aferição do valor da compensação ambiental (Art. 36, Lei 9.985/2000).`)
  y += 4

  // 2. Empreendedor
  drawEmpreendedor(doc, m, cw, y, form.empreendedor, "2. IDENTIFICAÇÃO DO EMPREENDEDOR", title, field, check, (v) => { y = v })
  y += 3

  // 3. Empreendimento
  check(); title("3. IDENTIFICAÇÃO DO EMPREENDIMENTO")
  field("Razão Social", form.empreendimento.razaoSocial)
  field("Nome Fantasia", form.empreendimento.nomeFantasia)
  field("CNPJ", form.empreendimento.cnpjCpf)
  field("IE", form.empreendimento.ie || "N/A")
  const endEmpr = [form.empreendimento.endereco, form.empreendimento.numero, form.empreendimento.bairro].filter(Boolean).join(", ")
  field("Endereço", endEmpr)
  field("Município/UF", `${form.empreendimento.cidade}/${form.empreendimento.uf}`)
  field("CEP", form.empreendimento.cep)
  field("Tel", form.empreendimento.telefone)
  field("Email", form.empreendimento.email)
  y += 3

  // 4. Correspondência
  drawCorrespondencia(doc, m, cw, form.correspondencia, "4. ENDEREÇO PARA CORRESPONDÊNCIA", title, text, field, check, () => y, (v) => { y = v })
  y += 3

  // 5. Licenciamento
  check(); title("5. PROCESSO DE LICENCIAMENTO AMBIENTAL")
  field("5.1 Processo COPAM", p.processoCopam)
  field("5.2 Licença", `${p.certificadoLicenca} / ${p.tipoLicenca}`)
  field("5.3 Validade", `${p.validadeLicenca} anos`)
  field("5.4 Data Aprovação", p.dataAprovacao)
  field("5.5 Condicionante", p.condicionante)
  field("5.6 Outros processos", p.outrosProc === "sim" ? "SIM - " + p.outrosProcNum : "NÃO")
  field("5.7 Data implantação", p.dataImplantacao || "N/A")

  if (p.ampliacao === "sim") {
    field("5.8 Ampliação", "SIM")
    field("    Processo Principal", p.processoPrincipal)
    if (p.compCumprida === "sim") {
      field("    Compensação cumprida", "SIM - TC Nº " + p.termoCompromisso)
    } else if (p.compCumprida === "nao") {
      field("    Compensação cumprida", "NÃO - Motivo: " + p.motivoNaoCumprida)
    } else {
      field("    Compensação cumprida", "___")
    }
  } else {
    field("5.8 Ampliação", "NÃO")
  }

  field("5.9 Revalidação LO", p.revalidacao === "sim" ? "SIM - " + p.procCompensados : "NÃO")
  y += 3

  // 6. UCs
  check(); title("6. LOCALIZAÇÃO EM RELAÇÃO ÀS UCs")
  field("6.1 Raio 3km de UC", form.ucs.uc3km === "sim" ? "SIM - " + form.ucs.uc3kmNomes : "NÃO")
  field("6.2 Inserido em UC", form.ucs.ucInserido === "sim" ? "SIM - " + form.ucs.ucInseridoNomes : "NÃO")
  field("6.3 Zona Amortecimento", form.ucs.ucZA === "sim" ? "SIM - " + form.ucs.ucZANomes : "NÃO")
  y += 6

  // Declaração
  check(); title("DECLARAÇÃO")
  text("Declaro sob as penas da lei que as informações são verdadeiras. A falsidade configura crime (Art. 299 CP, Art. 3º Lei 9.605/98, Art. 11 Dec. 45.175/2009, Art. 19 Res. CONAMA 237/97).")
  text("Declaro ter conhecimento de que as informações sobre Valor de Referência devem ser prestadas por profissional legalmente habilitado.")
  y += 10

  // Assinatura
  check()
  y += 5

  doc.setDrawColor(0)
  doc.setLineWidth(0.2)
  doc.text("___/___/______", m, y)

  const nomeLineStart = m + 40
  const nomeLineEnd = m + 120
  doc.line(nomeLineStart, y, nomeLineEnd, y)

  const assLineStart = m + 130
  const assLineEnd = m + cw
  doc.line(assLineStart, y, assLineEnd, y)

  y += 4

  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("Data", m + 8, y)
  doc.text("Nome legível", nomeLineStart + 25, y)
  doc.text("Assinatura", assLineStart + 15, y)

  y += 5

  doc.setFontSize(8)
  const nomeResp = `${r.nomeCompleto} - ${r.qualidade}`
  const nomeRespWidth = doc.getTextWidth(nomeResp)
  const centerX = (nomeLineStart + nomeLineEnd) / 2 - nomeRespWidth / 2
  doc.text(nomeResp, centerX, y)

  return doc.output("arraybuffer")
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: Request) {
  try {
    // Autenticação obrigatória (ferramenta paga — regra 8 CLAUDE.md)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { tipo, form } = body

    let buffer: ArrayBuffer

    switch (tipo) {
      case "mineraria":
        buffer = gerarPDFMineraria(form as FormMineraria)
        break
      case "mata-atlantica":
        buffer = gerarPDFMataAtlantica(form as FormMataAtlantica)
        break
      case "snuc":
        buffer = gerarPDFSNUC(form as FormSNUC)
        break
      default:
        return NextResponse.json({ erro: "Tipo de requerimento inválido." }, { status: 400 })
    }

    const nomes: Record<string, string> = {
      mineraria: "Compensacao_Mineraria",
      "mata-atlantica": "Compensacao_Mata_Atlantica",
      snuc: "SNUC",
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Requerimento_${nomes[tipo] || tipo}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar PDF de requerimento:", error)
    return NextResponse.json({ erro: "Erro ao gerar PDF" }, { status: 500 })
  }
}
