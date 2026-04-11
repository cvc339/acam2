/**
 * Script de teste do pipeline de análise de matrícula.
 *
 * Testa 3 configurações de modelo contra matrículas reais
 * e compara resultados com os valores esperados.
 *
 * Uso:
 *   npx tsx scripts/testar-pipeline-matricula.ts
 *   npx tsx scripts/testar-pipeline-matricula.ts --modelo sonnet
 *   npx tsx scripts/testar-pipeline-matricula.ts --modelo opus
 *   npx tsx scripts/testar-pipeline-matricula.ts --modelo hibrido
 *   npx tsx scripts/testar-pipeline-matricula.ts --todos
 */

import fs from "fs"
import path from "path"
import dotenv from "dotenv"

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") })

// ============================================
// RESULTADOS ESPERADOS (do documento de referência)
// ============================================

interface ResultadoEsperado {
  matricula: string
  arquivo: string
  proprietarios: Array<{ nome: string; percentual: number }>
  area_vigente_ha: number
  onus_ativos: number
  semaforo: "verde" | "amarelo" | "vermelho"
  georef: boolean
  descricao: string
}

const ESPERADOS: ResultadoEsperado[] = [
  {
    matricula: "12669",
    arquivo: "2024-05-09-cert-inteor-12669.pdf",
    proprietarios: [
      { nome: "MARIA IOLANDA RODRIGUES DE SOUSA", percentual: 80 },
      { nome: "EUNAPIO BOTELHO DE SOUSA", percentual: 20 },
    ],
    area_vigente_ha: 324.3614,
    onus_ativos: 0,
    semaforo: "amarelo", // copropriedade + restrição ambiental
    georef: true,
    descricao: "Dois proprietários 80/20, sem ônus, georef existente, restrição ambiental",
  },
  {
    matricula: "12795",
    arquivo: "inteiro-teor-12795.pdf",
    proprietarios: [{ nome: "DEVANIL GIUSTO FUJIWARA", percentual: 100 }],
    area_vigente_ha: 33.9761,
    onus_ativos: 0,
    semaforo: "vermelho", // georef ausente > 25 ha
    georef: false,
    descricao: "Viúva, proprietária única, sem ônus, georef ausente",
  },
  {
    matricula: "12795-cnd",
    arquivo: "cnd-matricula-12795.pdf",
    proprietarios: [{ nome: "DEVANIL GIUSTO FUJIWARA", percentual: 100 }],
    area_vigente_ha: 33.9761,
    onus_ativos: 0,
    semaforo: "vermelho",
    georef: false,
    descricao: "Mesma matrícula 12795 via CND",
  },
  {
    matricula: "652",
    arquivo: "cnd-completa-matricula-652.pdf",
    proprietarios: [], // "Depende da resolução dos atos R.1, R.2, R.3"
    area_vigente_ha: 65.1007, // retificada pela AV.4
    onus_ativos: 0,
    semaforo: "vermelho", // georef ausente > 25 ha + OCR baixo
    georef: false,
    descricao: "Área retificada, OCR baixo, georef ausente",
  },
  {
    matricula: "18174",
    arquivo: "cnd-matricula-18174.pdf",
    proprietarios: [
      { nome: "CAMILA FALASCINA CAMARGO RAMOS", percentual: 50 },
      { nome: "BRUNO THOMAZ FALASCINA", percentual: 50 },
    ],
    area_vigente_ha: 43.95,
    onus_ativos: 0,
    semaforo: "vermelho", // georef ausente > 25 ha
    georef: false,
    descricao: "Copropriedade, separação de bens, georef ausente",
  },
  {
    matricula: "18174-alt",
    arquivo: "M12 A - CND matricula 18.174.PDF",
    proprietarios: [
      { nome: "CAMILA FALASCINA CAMARGO RAMOS", percentual: 50 },
      { nome: "BRUNO THOMAZ FALASCINA", percentual: 50 },
    ],
    area_vigente_ha: 43.95,
    onus_ativos: 0,
    semaforo: "vermelho",
    georef: false,
    descricao: "Mesmo imóvel 18174, outro arquivo",
  },
  {
    matricula: "11290",
    arquivo: "M15 - CND matrícula 11.290.PDF",
    proprietarios: [{ nome: "PEDRO AFONSO DE SOUZA", percentual: 100 }],
    area_vigente_ha: 59.7547,
    onus_ativos: 0, // R.5 cancelado pela AV.6
    semaforo: "vermelho", // georef ausente > 25 ha
    georef: false,
    descricao: "Proprietário único, casado c/ Regina, hipoteca cancelada, georef ausente",
  },
]

// ============================================
// CONFIGURAÇÕES DE MODELO
// ============================================

const CONFIGS = {
  sonnet: {
    nome: "Sonnet (A+B+C)",
    modelo: "claude-sonnet-4-20250514",
  },
  opus: {
    nome: "Opus (A+B+C)",
    modelo: "claude-opus-4-20250514",
  },
  hibrido: {
    nome: "Híbrido (A+B Sonnet, C Opus)",
    modelo: "hibrido", // tratado no código
  },
}

// ============================================
// EXECUÇÃO
// ============================================

function normNome(nome: string): string {
  return nome.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

interface ResultadoPipelineTest {
  proprietarios: Array<{ nome: string; percentual: number | null }>
  area_ha: number | null
  onus_ativos: number
  semaforo: string
  georef_existente: boolean
  confianca_ocr: string
  outorga: Array<{ nome: string; exige_outorga: boolean }>
  restricoes_ambientais: number
  tokens: Array<{ etapa: string; input: number; output: number }>
  analise_resumo: string | null
}

async function executarPipeline(
  pdfBuffer: Buffer,
  modelo: string,
): Promise<ResultadoPipelineTest> {
  // Configurar modelo via env ANTES do import
  process.env.CLAUDE_MODEL = modelo

  const { analisarMatriculaPipeline } = await import("../src/lib/services/analise-matricula")
  const resultado = await analisarMatriculaPipeline(pdfBuffer)

  return {
    proprietarios: resultado.proprietarios_atuais.map((p) => ({
      nome: p.nome,
      percentual: p.percentual,
    })),
    area_ha: resultado.imovel.area_ha,
    onus_ativos: resultado.onus_ativos.length,
    semaforo: resultado.semaforo,
    georef_existente: resultado.georeferenciamento.existente,
    confianca_ocr: resultado.imovel.confianca_ocr,
    outorga: resultado.outorga_conjugal.map((o) => ({
      nome: o.nome,
      exige_outorga: o.exige_outorga,
    })),
    restricoes_ambientais: resultado.restricoes_ambientais.length,
    tokens: resultado.tokens_consumidos,
    analise_resumo: resultado.analise_transmissibilidade?.resumo ?? null,
  }
}

function compararResultado(
  resultado: ResultadoPipelineTest,
  esperado: ResultadoEsperado,
): { acertos: string[]; erros: string[] } {
  const acertos: string[] = []
  const erros: string[] = []

  // Proprietários (pular se esperado vazio = resultado indefinido)
  if (esperado.proprietarios.length === 0) {
    acertos.push(`Qtd proprietários: ${resultado.proprietarios.length} (sem gabarito definido)`)
  } else if (resultado.proprietarios.length === esperado.proprietarios.length) {
    acertos.push(`Qtd proprietários: ${resultado.proprietarios.length} ✓`)
  } else {
    erros.push(`Qtd proprietários: ${resultado.proprietarios.length} (esperado: ${esperado.proprietarios.length})`)
  }

  for (const esp of esperado.proprietarios) {
    const encontrado = resultado.proprietarios.find(
      (p) => normNome(p.nome).includes(normNome(esp.nome).split(" ")[0]),
    )
    if (!encontrado) {
      erros.push(`Proprietário não encontrado: ${esp.nome}`)
    } else {
      if (encontrado.percentual === esp.percentual) {
        acertos.push(`${esp.nome.split(" ")[0]}: ${esp.percentual}% ✓`)
      } else {
        erros.push(`${esp.nome.split(" ")[0]}: ${encontrado.percentual}% (esperado: ${esp.percentual}%)`)
      }
    }
  }

  // Área
  if (resultado.area_ha != null) {
    const diff = Math.abs(resultado.area_ha - esperado.area_vigente_ha)
    if (diff < 0.1) {
      acertos.push(`Área: ${resultado.area_ha} ha ✓`)
    } else {
      erros.push(`Área: ${resultado.area_ha} ha (esperado: ${esperado.area_vigente_ha} ha)`)
    }
  } else {
    erros.push(`Área: null (esperado: ${esperado.area_vigente_ha} ha)`)
  }

  // Ônus
  if (resultado.onus_ativos === esperado.onus_ativos) {
    acertos.push(`Ônus ativos: ${resultado.onus_ativos} ✓`)
  } else {
    erros.push(`Ônus ativos: ${resultado.onus_ativos} (esperado: ${esperado.onus_ativos})`)
  }

  // Semáforo
  if (resultado.semaforo === esperado.semaforo) {
    acertos.push(`Semáforo: ${resultado.semaforo} ✓`)
  } else {
    erros.push(`Semáforo: ${resultado.semaforo} (esperado: ${esperado.semaforo})`)
  }

  // Georef
  if (resultado.georef_existente === esperado.georef) {
    acertos.push(`Georef: ${resultado.georef_existente} ✓`)
  } else {
    erros.push(`Georef: ${resultado.georef_existente} (esperado: ${esperado.georef})`)
  }

  return { acertos, erros }
}

function calcularCusto(tokens: Array<{ etapa: string; input: number; output: number }>, modelo: string): number {
  // Preços por 1M tokens (USD)
  const precos: Record<string, { input: number; output: number }> = {
    "claude-sonnet-4-20250514": { input: 3, output: 15 },
    "claude-opus-4-20250514": { input: 15, output: 75 },
  }

  const preco = precos[modelo] || precos["claude-sonnet-4-20250514"]
  let custo = 0
  for (const t of tokens) {
    custo += (t.input / 1_000_000) * preco.input + (t.output / 1_000_000) * preco.output
  }
  return custo
}

async function main() {
  const args = process.argv.slice(2)
  const modoTodos = args.includes("--todos")
  const modeloArg = args.find((a) => a !== "--todos" && !a.startsWith("--modelo"))
    || args[args.indexOf("--modelo") + 1]
    || (modoTodos ? "todos" : "sonnet")

  const limiteArg = args.find((a) => a.startsWith("--limite="))
  const limite = limiteArg ? parseInt(limiteArg.split("=")[1]) : undefined

  const modelos = modoTodos || modeloArg === "todos"
    ? ["sonnet", "opus"] as const
    : [modeloArg as "sonnet" | "opus" | "hibrido"]

  // Encontrar PDFs de matrícula disponíveis
  const rootDir = path.resolve(__dirname, "..")
  const pdfsDisponiveis = ESPERADOS.filter((e) => {
    const fullPath = path.join(rootDir, e.arquivo)
    return fs.existsSync(fullPath)
  })

  // Aplicar limite se especificado
  if (limite && limite > 0) {
    pdfsDisponiveis.splice(limite)
  }

  if (pdfsDisponiveis.length === 0) {
    console.error("\n❌ Nenhum PDF de matrícula encontrado para teste.")
    console.error("PDFs esperados:")
    for (const e of ESPERADOS) {
      const existe = fs.existsSync(path.join(rootDir, e.arquivo))
      console.error(`  ${existe ? "✓" : "✗"} ${e.arquivo} (matrícula ${e.matricula})`)
    }
    process.exit(1)
  }

  console.log("\n" + "=".repeat(70))
  console.log("TESTE DO PIPELINE DE ANÁLISE DE MATRÍCULA")
  console.log("=".repeat(70))
  console.log(`\nPDFs disponíveis: ${pdfsDisponiveis.length}`)
  console.log(`Modelos a testar: ${modelos.join(", ")}`)
  console.log("")

  const resultadosGerais: Array<{
    modelo: string
    matricula: string
    acertos: number
    erros: number
    custo_usd: number
    tempo_ms: number
    detalhes: { acertos: string[]; erros: string[] }
    resultado: ResultadoPipelineTest
  }> = []

  for (const modeloKey of modelos) {
    const config = CONFIGS[modeloKey as keyof typeof CONFIGS] || CONFIGS.sonnet
    const modeloId = config.modelo === "hibrido"
      ? "claude-sonnet-4-20250514" // híbrido usa Sonnet como base
      : config.modelo

    console.log(`\n${"─".repeat(70)}`)
    console.log(`MODELO: ${config.nome} (${modeloId})`)
    console.log(`${"─".repeat(70)}`)

    for (const esperado of pdfsDisponiveis) {
      const pdfPath = path.join(rootDir, esperado.arquivo)
      const pdfBuffer = fs.readFileSync(pdfPath)

      console.log(`\n  📄 Matrícula ${esperado.matricula} — ${esperado.descricao}`)
      console.log(`     Arquivo: ${esperado.arquivo} (${(pdfBuffer.length / 1024).toFixed(0)} KB)`)

      const inicio = Date.now()
      try {
        const resultado = await executarPipeline(pdfBuffer, modeloId)
        const tempo = Date.now() - inicio
        const custo = calcularCusto(resultado.tokens, modeloId)
        const { acertos, erros } = compararResultado(resultado, esperado)

        resultadosGerais.push({
          modelo: config.nome,
          matricula: esperado.matricula,
          acertos: acertos.length,
          erros: erros.length,
          custo_usd: custo,
          tempo_ms: tempo,
          detalhes: { acertos, erros },
          resultado,
        })

        console.log(`     Tempo: ${(tempo / 1000).toFixed(1)}s | Custo: $${custo.toFixed(4)}`)
        console.log(`     OCR: ${resultado.confianca_ocr}`)
        console.log(`     Proprietários:`)
        for (const p of resultado.proprietarios) {
          console.log(`       • ${p.nome}: ${p.percentual ?? "?"}%`)
        }
        console.log(`     Área: ${resultado.area_ha} ha`)
        console.log(`     Semáforo: ${resultado.semaforo}`)
        console.log(`     Ônus ativos: ${resultado.onus_ativos}`)
        console.log(`     Georef: ${resultado.georef_existente}`)
        console.log(`     Outorga:`)
        for (const o of resultado.outorga) {
          console.log(`       • ${o.nome}: ${o.exige_outorga ? "EXIGE" : "não exige"}`)
        }
        console.log(`     Restrições ambientais: ${resultado.restricoes_ambientais}`)
        if (resultado.analise_resumo) {
          console.log(`     Análise: ${resultado.analise_resumo.substring(0, 150)}...`)
        }

        console.log(`\n     VALIDAÇÃO:`)
        for (const a of acertos) console.log(`       ✅ ${a}`)
        for (const e of erros) console.log(`       ❌ ${e}`)
        console.log(`     Score: ${acertos.length}/${acertos.length + erros.length}`)
      } catch (err) {
        const tempo = Date.now() - inicio
        console.error(`     ❌ ERRO após ${(tempo / 1000).toFixed(1)}s:`, (err as Error).message)
        resultadosGerais.push({
          modelo: config.nome,
          matricula: esperado.matricula,
          acertos: 0,
          erros: 99,
          custo_usd: 0,
          tempo_ms: tempo,
          detalhes: { acertos: [], erros: [`ERRO: ${(err as Error).message}`] },
          resultado: {} as ResultadoPipelineTest,
        })
      }
    }
  }

  // ── RESUMO COMPARATIVO ──
  if (resultadosGerais.length > 1) {
    console.log(`\n\n${"=".repeat(70)}`)
    console.log("RESUMO COMPARATIVO")
    console.log("=".repeat(70))

    const porModelo = new Map<string, typeof resultadosGerais>()
    for (const r of resultadosGerais) {
      const arr = porModelo.get(r.modelo) || []
      arr.push(r)
      porModelo.set(r.modelo, arr)
    }

    console.log(`\n${"Modelo".padEnd(30)} ${"Score".padEnd(10)} ${"Custo".padEnd(12)} ${"Tempo".padEnd(10)}`)
    console.log("─".repeat(62))

    for (const [modelo, resultados] of porModelo) {
      const totalAcertos = resultados.reduce((s, r) => s + r.acertos, 0)
      const totalTestes = resultados.reduce((s, r) => s + r.acertos + r.erros, 0)
      const totalCusto = resultados.reduce((s, r) => s + r.custo_usd, 0)
      const totalTempo = resultados.reduce((s, r) => s + r.tempo_ms, 0)

      console.log(
        `${modelo.padEnd(30)} ${(totalAcertos + "/" + totalTestes).padEnd(10)} $${totalCusto.toFixed(4).padEnd(11)} ${(totalTempo / 1000).toFixed(1)}s`,
      )
    }
  }

  // Salvar resultados em JSON
  const outputPath = path.join(rootDir, "scripts", "resultado-teste-pipeline.json")
  fs.writeFileSync(outputPath, JSON.stringify(resultadosGerais, null, 2))
  console.log(`\nResultados salvos em: ${outputPath}`)
}

main().catch((err) => {
  console.error("Erro fatal:", err)
  process.exit(1)
})
