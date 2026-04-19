/**
 * Gera um slug URL-safe a partir de um titulo em portugues.
 * Remove acentos, converte para minusculas, troca espacos/pontuacao por hifens.
 */
export function gerarSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
}
