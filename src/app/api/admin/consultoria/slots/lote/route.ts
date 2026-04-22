import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { consultoria } from "@/lib/consultoria"

interface BodyLote {
  diasSemana?: number[] // 0=Dom, 1=Seg, ..., 6=Sáb
  horarios?: Array<{ inicio: string; fim: string }>
  semanas?: number
}

/**
 * POST /api/admin/consultoria/slots/lote
 *
 * Cria slots em lote nos próximos N semanas, nos dias da semana e horários especificados.
 * Slots já existentes (mesma data+horaInicio) são silenciosamente ignorados.
 *
 * Body: { diasSemana: [1, 3], horarios: [{inicio:"14:00", fim:"14:30"}], semanas: 2 }
 */
export async function POST(request: Request) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  let body: BodyLote
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 })
  }

  const { diasSemana, horarios, semanas } = body

  if (
    !Array.isArray(diasSemana) || diasSemana.length === 0 ||
    !Array.isArray(horarios) || horarios.length === 0 ||
    typeof semanas !== "number" || semanas < 1 || semanas > 12
  ) {
    return NextResponse.json(
      { erro: "Parâmetros inválidos: diasSemana, horarios e semanas (1-12) são obrigatórios" },
      { status: 400 }
    )
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const diasTotal = semanas * 7
  let criados = 0
  let ignorados = 0
  const erros: string[] = []

  for (let offset = 0; offset < diasTotal; offset++) {
    const dia = new Date(hoje)
    dia.setDate(dia.getDate() + offset)
    const diaSemana = dia.getDay()

    if (!diasSemana.includes(diaSemana)) continue

    const dataISO = dia.toISOString().slice(0, 10)

    for (const h of horarios) {
      if (!h.inicio || !h.fim) continue
      const resultado = await consultoria.criarSlot(dataISO, h.inicio, h.fim)
      if (resultado.sucesso) {
        criados++
      } else if (resultado.erro?.includes("slot_unico") || resultado.erro?.includes("duplicate")) {
        ignorados++
      } else {
        erros.push(`${dataISO} ${h.inicio}: ${resultado.erro}`)
      }
    }
  }

  return NextResponse.json({ sucesso: true, criados, ignorados, erros })
}
