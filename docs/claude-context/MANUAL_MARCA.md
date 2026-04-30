# Manual de Marca ACAM

*Sistema de identidade visual — Plataforma ACAM, Vieira Castro Advogados*
*Versão 1.0 — Abril 2026*

---

## Sumário

1. [Identidade e posicionamento](#1-identidade-e-posicionamento)
2. [Marca (variantes e uso)](#2-marca-variantes-e-uso)
3. [Espaçamento e tamanhos mínimos](#3-espaçamento-e-tamanhos-mínimos)
4. [Paleta de cores](#4-paleta-de-cores)
5. [Tipografia](#5-tipografia)
6. [Componentes UI](#6-componentes-ui)
7. [Aplicações práticas](#7-aplicações-práticas)
8. [O que não fazer](#8-o-que-não-fazer)
9. [Recursos do kit](#9-recursos-do-kit)

---

## 1. Identidade e posicionamento

ACAM é plataforma SaaS de cálculo de compensação ambiental, parte do ecossistema Vieira Castro Advogados. Atende mineração, indústria farmacêutica, consultorias ambientais e órgãos reguladores em Minas Gerais e nacionalmente.

A identidade visual deve transmitir três coisas, nesta ordem: **competência técnica**, **autoridade regulatória** e **precisão analítica**. Não deve transmitir aconchego, artesania ou simpatia — esse é o registro de marcas B2C, e o cliente do ACAM é técnico ou compliance, não consumidor final.

A construção da marca apoia-se em três decisões estruturais:

**Símbolo geométrico, não ilustrativo.** O monograma "A" é construído como triângulo com vazados internos. Lê primeiro como pico de elevação, depois como letra. As três curvas de nível em creme atravessando o desenho remetem diretamente a topografia, geoprocessamento, medição — fala da natureza técnica do produto sem virar pictograma de mapa ou folha estilizada.

**Base em cobre como estrutura semântica.** A faixa horizontal cobre na base do "A" não é decoração — é a fundação visual da marca. Conceitualmente representa o substrato compensado, a contrapartida ambiental. O verde acima representa o que se preserva ou restaura. A leitura conjunta: medir o que está em cima para compensar com o que está embaixo. É exatamente o que a plataforma faz.

**Tipografia editorial, não corporativa.** Wordmark em serifa Cormorant Garamond e tagline em itálico serif. Esse registro dialoga com a convenção brasileira de marca jurídico-consultiva (escritórios de advocacia, consultorias de engenharia, peritagens). Sans-serif técnico foi descartado intencionalmente — daria à marca cara de painel admin, e o ACAM não é só ferramenta interna, é assinatura institucional do escritório no espaço SaaS.

---

## 2. Marca (variantes e uso)

### 2.1 Marca vertical (principal)

![Marca ACAM vertical](./acam-logo-vertical.svg)

**Uso preferencial:** landing page hero, capa de apresentação, página inicial de relatórios PDF, frente de cartão de visita, header largo de site institucional.

Composição em três camadas verticais: símbolo monograma, wordmark "ACAM" em serifa, tagline editorial "Compensação ambiental" em itálico, com separador horizontal de hairline e ponto de cobre entre wordmark e tagline.

Arquivo: `acam-logo-vertical.svg`

### 2.2 Marca horizontal

![Marca ACAM horizontal](./acam-logo-horizontal.svg)

**Uso preferencial:** header de site (navbar superior), rodapé contratual, assinatura de e-mail, header em apresentações de slide, navbar do app SaaS.

O símbolo horizontal usa versão simplificada (sem curvas de nível) para garantir leitura limpa em escalas pequenas. Essa simplificação é deliberada e correta para esse contexto.

Arquivo: `acam-logo-horizontal.svg`

### 2.3 Símbolo isolado

![Símbolo ACAM](./acam-simbolo.svg)

**Uso preferencial:** ícone de aplicativo iOS/Android (proporção quadrada), padrão de fundo decorativo, marca em ambientes onde o wordmark já está visível por outros meios (tela de login do app, por exemplo).

Inclui as curvas de nível e a base em cobre. Resolução-segura para uso a partir de 64×64px.

Arquivo: `acam-simbolo.svg`

### 2.4 Símbolo simplificado (favicon)

![Símbolo ACAM favicon](./acam-simbolo-favicon.svg)

**Uso preferencial:** favicon de navegador (16×16, 32×32), ícone em listas de aplicativos, contextos onde o símbolo apareceria abaixo de 48px de lado.

Versão deliberadamente despojada: triângulo geométrico com slot horizontal (a barra do "A") e base em cobre. Sem curvas de nível, sem vazio superior — esses detalhes desaparecem em escala pequena de qualquer forma, e mantê-los gera ruído visual.

Arquivo: `acam-simbolo-favicon.svg`

### 2.5 Versão monocromática

Para uso em impressão econômica (preto e branco), fax, documentos oficiais que não suportam cor, e contextos onde a paleta completa não estiver disponível.

Construção: mesma marca vertical, mas com todos os elementos em verde floresta (`#1a3a2a`) — incluindo o ponto separador (em verde, não em cobre) — e sem a base em cobre na letra. A letra "A" fica sólida em verde, sem o acento da fundação cobre.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 290" role="img">
  <path d="M 300 155 L 380 155 L 340 55 Z M 332 115 L 348 115 L 340 80 Z M 320 140 L 360 140 L 348 123 L 332 123 Z" fill="#1a3a2a" fill-rule="evenodd"/>
  <text x="340" y="215" font-family="Cormorant Garamond, serif" font-size="42" letter-spacing="4" fill="#1a3a2a" text-anchor="middle">ACAM</text>
  <line x1="252" y1="240" x2="320" y2="240" stroke="#1a3a2a" stroke-width="0.5"/>
  <circle cx="340" cy="240" r="2" fill="#1a3a2a"/>
  <line x1="360" y1="240" x2="428" y2="240" stroke="#1a3a2a" stroke-width="0.5"/>
  <text x="340" y="265" font-family="Cormorant Garamond, serif" font-size="14" font-style="italic" fill="#1a3a2a" text-anchor="middle">Compensação ambiental</text>
</svg>
```

### 2.6 Versão dark mode

Para fundos escuros (verde floresta `#1a3a2a` ou verde profundo `#0d2018`), a marca inverte: símbolo e tipografia em creme `#f5f0e8`, base do símbolo permanece em cobre `#c17f59`. As curvas de nível invertem para verde floresta (sobre o "A" em creme).

Use quando a interface estiver em dark mode ou quando a marca estiver sobre uma fotografia escura. **Nunca invente outras combinações cromáticas.**

---

## 3. Espaçamento e tamanhos mínimos

### Clear space (espaço de proteção)

Toda variante da marca exige espaço livre ao redor — área onde nenhum outro elemento pode invadir. A regra: o espaço mínimo equivale à altura da letra "A" do wordmark em todos os lados (acima, abaixo, esquerda, direita).

Em CSS prático, isso significa: ao usar a marca dentro de um container, deixe `padding` igual à altura da letra "A" no contêiner imediato. Para a marca vertical em um header padrão, isso costuma ser entre `2rem` e `3rem` (32px–48px).

### Tamanhos mínimos absolutos

| Variante | Largura mínima | Contexto típico |
|---|---|---|
| Marca vertical (com tagline) | 200px | Cabeçalho de relatório |
| Marca vertical (sem tagline) | 160px | Cartão de visita |
| Marca horizontal | 180px | Navbar superior |
| Símbolo isolado | 48px | Ícone de app |
| Símbolo simplificado (favicon) | 16px | Favicon |

Em escalas abaixo dos limites mínimos, troque para a variante mais simples. Nunca tente forçar a marca completa em espaço apertado — a leitura fica comprometida e a percepção de profissionalismo cai.

---

## 4. Paleta de cores

### Cores primárias

| Nome | Hex | RGB | Uso |
|---|---|---|---|
| Verde Floresta | `#1a3a2a` | `26, 58, 42` | Cor principal: símbolo, texto, fundo dark |
| Cobre | `#c17f59` | `193, 127, 89` | Acento exclusivo: base do símbolo, ornamentos, CTAs premium |
| Creme | `#f5f0e8` | `245, 240, 232` | Fundo principal, modo claro |

### Cores secundárias

| Nome | Hex | Uso |
|---|---|---|
| Verde Médio | `#2d5a3f` | Hover states, fundos secundários, status de sucesso |
| Verde Profundo | `#0d2018` | Background do dark mode |
| Cobre Claro | `#d99a78` | Hover do cobre, estados ativos |
| Cobre Escuro | `#9a6044` | Cobre em fundos claros (melhor contraste) |
| Creme Elevado | `#fbf8f1` | Cards, modais, superfícies elevadas no modo claro |
| Creme Recuado | `#ebe4d6` | Seções alternadas, fundos de inputs em modo claro |

### Regras de uso de cor

**Verde Floresta** é a cor presente em toda peça da marca. Não há aplicação ACAM sem verde floresta.

**Cobre é acento, não cor secundária.** Use copiosamente como detalhe (base do A, separador, hover, ícones de status warning, CTAs muito específicos), mas nunca como fundo de área grande nem como cor principal de texto. Cobre em block é cliché de "marca eco" — exatamente o que estamos evitando.

**Creme não é branco.** Não substitua `#f5f0e8` por `#ffffff`. O fundo creme dá calor sutil que diferencia a marca do registro tech-frio padrão de SaaS. Branco puro é proibido como fundo principal.

**Evitar absolutamente:** verdes neon ou saturados (`#00ff00`, `#39d353`), azuis tech (`#1d4ed8`, `#3b82f6`, qualquer azul que pareça Bootstrap), gradientes de qualquer tipo, roxos. Gradiente de qualquer cor sobre qualquer cor é violação direta da identidade.

### Tokens CSS

Importar `acam-tokens.css` na raiz do projeto. Disponíveis como custom properties:

```css
:root {
  --acam-verde-floresta: #1a3a2a;
  --acam-verde-medio: #2d5a3f;
  --acam-cobre: #c17f59;
  --acam-creme: #f5f0e8;
  /* ... */
}
```

Tokens semânticos (preferíveis ao uso direto):

```css
color: var(--color-text-primary);        /* verde floresta */
background: var(--color-bg-primary);     /* creme */
border-color: var(--color-border-subtle);
```

### Tailwind (extensão de tema)

Adicione ao `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        verde: {
          floresta: '#1a3a2a',
          medio: '#2d5a3f',
          profundo: '#0d2018',
        },
        cobre: {
          DEFAULT: '#c17f59',
          claro: '#d99a78',
          escuro: '#9a6044',
        },
        creme: {
          DEFAULT: '#f5f0e8',
          elevado: '#fbf8f1',
          recuado: '#ebe4d6',
        },
      },
    },
  },
};
```

Uso em classes Tailwind: `bg-creme text-verde-floresta border-cobre`.

---

## 5. Tipografia

### Família serif — Cormorant Garamond

**Para wordmark, headings editoriais (h1, h2) e taglines.**

Cormorant Garamond é serifa contemporânea inspirada em fontes garaldas do século XVI, com contraste alto entre traços finos e grossos. Tem mais caráter do que EB Garamond ou Times, sem cair no exagero das serifas display tipo Playfair. Combina autoridade institucional com refinamento editorial — ideal para o registro jurídico-ambiental.

Disponível gratuitamente no Google Fonts.

### Família sans — Manrope

**Para corpo de texto, UI, dados, navegação, formulários.**

Manrope é sans-serif geométrica humanista de código aberto. Tem identidade própria sem ser eccêntrica — diferencia o ACAM do default Inter/Roboto que dominam SaaS, mantendo perfil profissional. Renderização excelente em todas as escalas.

Disponível gratuitamente no Google Fonts.

### Família monoespaçada — JetBrains Mono

**Para código, dados tabulares, IDs de operações, hashes.**

Quando o app exibir IDs de licença, hashes de transação Mercado Pago, snippets de código em documentação técnica, etc.

### Importação no Next.js (App Router)

```typescript
// app/layout.tsx
import { Cormorant_Garamond, Manrope, JetBrains_Mono } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
});

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${manrope.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### Importação em HTML puro

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Manrope:wght@400;500;600&family=JetBrains+Mono&display=swap" rel="stylesheet">
```

### Hierarquia tipográfica

| Elemento | Família | Tamanho | Peso | Uso |
|---|---|---|---|---|
| Display (hero) | Serif | 48–64px | 400 | Título principal de landing page |
| H1 | Serif | 40–48px | 400 | Título de página |
| H2 | Serif | 28–32px | 400 | Cabeçalho de seção |
| H3 | Sans | 18–20px | 500 | Subtítulo, label de bloco |
| Body large | Sans | 18px | 400 | Intro de seção, parágrafo de destaque |
| Body | Sans | 16px | 400 | Texto padrão |
| Body small | Sans | 14px | 400 | Texto secundário, label de form |
| Caption | Sans | 12–13px | 400 | Notas de rodapé, metadados |
| Tagline editorial | Serif italic | 14–16px | 400 | Subtítulos editoriais, descrições poéticas |

### Letter-spacing

- Headings serif: `0.01em` a `0.02em` (sutil — serifas já têm contraste suficiente)
- Wordmark (ACAM em logo): `0.08em` a `0.1em` (para evocar inscrição clássica)
- Sans body: padrão (`normal`)
- Sans labels em caps (raros): `0.05em` a `0.1em`

### Sentence case sempre

ACAM usa sentence case em quase tudo: títulos, headings, botões, labels. **Nunca Title Case.** A única exceção é o wordmark "ACAM" propriamente dito (acrônimo) e abreviações como APP, MA, RCA quando aparecem em texto técnico.

---

## 6. Componentes UI

Todos os componentes assumem que `acam-tokens.css` está importado.

### 6.1 Botão primário (CTA principal)

```html
<button class="btn-primary">Calcular compensação</button>
```

Estilização (já incluída em `acam-tokens.css`):
```css
.btn-primary {
  padding: 0.75rem 1.5rem;
  font-family: var(--font-sans);
  font-weight: 500;
  background: var(--acam-verde-floresta);
  color: var(--acam-creme);
  border-radius: 0.5rem;
}
```

Tailwind equivalente:
```html
<button class="px-6 py-3 bg-verde-floresta text-creme rounded-md font-medium hover:bg-verde-medio transition">
  Calcular compensação
</button>
```

### 6.2 Botão secundário

```html
<button class="btn-secondary">Saiba mais</button>
```

Tailwind:
```html
<button class="px-6 py-3 border border-verde-floresta text-verde-floresta rounded-md font-medium hover:bg-verde-floresta hover:text-creme transition">
  Saiba mais
</button>
```

### 6.3 Botão cobre (CTA premium, raro)

Use somente para ações premium específicas — upgrade de plano, ação destacada que merece distinção. **Não é padrão** — o padrão é `btn-primary` em verde.

```html
<button class="btn-copper">Plano Premium</button>
```

### 6.4 Card

```html
<div class="card">
  <h3>Compensação minerária</h3>
  <p>Cálculo conforme DN COPAM 217/2017 e Decreto Estadual 47.749/2019.</p>
</div>
```

Tailwind:
```html
<div class="bg-creme-elevado border border-creme-recuado rounded-lg p-6 shadow-sm">
  <h3 class="text-xl font-medium mb-3">Compensação minerária</h3>
  <p class="text-base">Cálculo conforme DN COPAM 217/2017...</p>
</div>
```

### 6.5 Input de formulário

```html
<label for="email">E-mail</label>
<input type="email" id="email" class="form-input" placeholder="seu@email.com">
```

### 6.6 Badge de status

```html
<span class="badge badge-success">Ativo</span>
<span class="badge badge-warning">Pendente</span>
<span class="badge badge-danger">Vencido</span>
<span class="badge badge-neutral">Rascunho</span>
```

### 6.7 Separador editorial com ponto cobre

Para usar entre seções de uma landing page, abaixo de hero, antes de mudança de tema:

```html
<div class="divider-copper-dot">
  <div class="divider-copper-dot-mark"></div>
</div>
```

### 6.8 Wordmark em texto

Para usar "ACAM" como wordmark dentro de texto contínuo (em headers, parágrafos editoriais):

```html
<span class="wordmark">ACAM</span>
```

### 6.9 Tagline editorial

Para subtítulos poéticos abaixo de H1:

```html
<h1>Compensação ambiental técnica</h1>
<p class="tagline-editorial">Para quem sabe que não basta calcular — precisa documentar.</p>
```

---

## 7. Aplicações práticas

### 7.1 Landing page hero

Estrutura típica para abertura de `acam.com.br`:

```html
<section class="hero">
  <img src="/acam-logo-vertical.svg" alt="ACAM" width="320">
  <h1>Compensação ambiental, calculada e documentada.</h1>
  <p class="tagline-editorial">
    Para mineração, conservação, Mata Atlântica e APP — fundamentação jurídica e cálculo metodológico em uma plataforma só.
  </p>
  <div class="divider-copper-dot">
    <div class="divider-copper-dot-mark"></div>
  </div>
  <button class="btn-primary">Acessar a plataforma</button>
  <button class="btn-secondary">Ver documentação</button>
</section>
```

### 7.2 Navbar do app

```html
<nav class="navbar">
  <img src="/acam-logo-horizontal.svg" alt="ACAM" height="40">
  <ul>
    <li><a href="/calculadora">Calculadora</a></li>
    <li><a href="/historico">Histórico</a></li>
    <li><a href="/conta">Conta</a></li>
  </ul>
</nav>
```

### 7.3 Documento PDF (cabeçalho)

Em relatórios PDF gerados pelo backend (parecer técnico, cálculo de compensação, certificado), usar a marca horizontal no topo da página, com o número do documento e a data ao lado. Rodapé com a marca monocromática reduzida.

### 7.4 Favicon

```html
<link rel="icon" type="image/svg+xml" href="/acam-simbolo-favicon.svg">
<link rel="apple-touch-icon" href="/acam-simbolo.svg">
```

### 7.5 Assinatura de e-mail

Cabeçalho do e-mail (HTML) com a marca horizontal a 180px de largura. Corpo em sans (Manrope). Assinatura final com wordmark + cargo + escritório + telefone.

### 7.6 Conta do Mercado Pago / pagamento

Quando o ACAM redireciona para checkout do Mercado Pago, a tela de confirmação retornada deve carregar a marca horizontal no header e botão primário "Voltar ao ACAM" em verde floresta.

---

## 8. O que não fazer

**Não esticar nem distorcer a marca.** Use sempre proporções originais. Para redimensionar, mantenha aspect ratio (`object-fit: contain` em CSS).

**Não trocar cores da marca por outras.** A marca não tem versão em azul, vermelho, roxo, dourado. Nem para dia das mães, nem para Black Friday, nem para campanhas pontuais. Variantes oficiais são: padrão, dark mode, monocromática.

**Não adicionar gradientes, sombras, brilhos ou outros efeitos decorativos.** O design é flat por princípio — qualquer efeito extra quebra a coerência institucional.

**Não rotacionar a marca.** Nem 90° para sidebars verticais, nem 45° para "estilizar". Se precisar de marca em formato diferente, use a variante apropriada (símbolo isolado, por exemplo).

**Não substituir a tipografia da marca por outra.** Cormorant Garamond no wordmark. Não tente Playfair, Times, Garamond Premier, Adobe Garamond etc. — a Cormorant tem características de proporção que outras serifas não têm e que a marca aproveita.

**Não usar a marca em fundos de imagem complexos** sem aplicar uma camada sólida (cobertor de creme ou verde floresta com leve transparência). Marca sobre fotografia bagunçada perde leitura imediatamente.

**Não usar branco puro como fundo principal.** Use `#f5f0e8` (creme). Branco vira a marca em "mais um SaaS frio".

**Não usar o cobre como cor de área grande.** Cobre é acento. Cobre em block grande satura visualmente e desliga o efeito do acento.

**Não usar a tagline "Compensação ambiental" sem o wordmark.** A tagline isolada perde sentido. Sempre acompanha o wordmark, ou está em contexto onde o wordmark já apareceu.

---

## 9. Recursos do kit

Arquivos incluídos neste kit:

| Arquivo | Conteúdo |
|---|---|
| `acam-manual-marca.md` | Este documento |
| `acam-logo-vertical.svg` | Marca vertical (uso principal) |
| `acam-logo-horizontal.svg` | Marca horizontal (header/navbar) |
| `acam-simbolo.svg` | Símbolo isolado 200×200 com curvas de nível |
| `acam-simbolo-favicon.svg` | Símbolo simplificado para favicon |
| `acam-tokens.css` | Variáveis CSS de cor, tipografia, espaçamento |
| `acam-preview.html` | Página HTML interativa de preview do sistema |

Para implementar em projeto Next.js novo:

1. Copie todos os SVGs para `public/`
2. Copie `acam-tokens.css` para `app/styles/` ou `styles/`
3. Importe os tokens em `app/globals.css`: `@import './styles/acam-tokens.css';`
4. Configure Google Fonts no `layout.tsx` conforme exemplo da seção 5
5. Ajuste `tailwind.config.js` conforme seção 4 (opcional — funciona sem Tailwind também)
6. Configure favicon: `<link rel="icon" type="image/svg+xml" href="/acam-simbolo-favicon.svg" />`

Para conferir tudo renderizando em conjunto, abra `acam-preview.html` no navegador.

---

*Manual versionado. Atualizações futuras devem manter compatibilidade com tokens de cor existentes (a paleta primária Verde Floresta + Cobre + Creme é fixa).*

*Vieira Castro Advogados — OAB/MG 76.351*
