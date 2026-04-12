/**
 * Registro de fontes para @react-pdf/renderer
 * Importar este módulo garante que as fontes estejam registradas
 * antes de qualquer renderização de PDF.
 */
import { Font } from "@react-pdf/renderer"

// Desabilitar hifenização automática (causa quebras erradas em português)
Font.registerHyphenationCallback((word) => [word])

Font.register({
  family: "Source Sans 3",
  fonts: [
    { src: "https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Ky461EN.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Kxm7FEN.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Kxf7FEN.ttf", fontWeight: 700 },
  ],
})

Font.register({
  family: "Source Serif 4",
  fonts: [
    { src: "https://fonts.gstatic.com/s/sourceserif4/v14/vEFy2_tTDB4M7-auWDN0ahZJW3IX2ih5nk3AucvUHf6OAVIJmeUDygwjihdqrhw.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/sourceserif4/v14/vEFy2_tTDB4M7-auWDN0ahZJW3IX2ih5nk3AucvUHf6OAVIJmeUDygwjisltrhw.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/sourceserif4/v14/vEFy2_tTDB4M7-auWDN0ahZJW3IX2ih5nk3AucvUHf6OAVIJmeUDygwjivBtrhw.ttf", fontWeight: 700 },
  ],
})
