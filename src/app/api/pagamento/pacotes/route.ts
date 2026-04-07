import { NextResponse } from "next/server"

const PACOTES = {
  avulso: { nome: "Avulso", creditos: 1, valor: 12.00 },
  basico: { nome: "Básico", creditos: 10, valor: 100.00 },
  intermediario: { nome: "Intermediário", creditos: 25, valor: 225.00 },
  premium: { nome: "Premium", creditos: 50, valor: 400.00 },
}

export async function GET() {
  return NextResponse.json({ sucesso: true, pacotes: PACOTES })
}
