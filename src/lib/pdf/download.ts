/**
 * Download de PDF no browser — client-side only
 *
 * Módulo centralizado. Não duplicar lógica de blob/createObjectURL.
 * Importar: import { downloadPDF } from "@/lib/pdf/download"
 */

/** Faz download de um PDF a partir de um Response (fetch) */
export async function downloadPDF(response: Response, filename: string): Promise<void> {
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
