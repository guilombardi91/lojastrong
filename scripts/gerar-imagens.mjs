// Gera os mockups vetoriais dos produtos em public/produtos.
//
// A loja precisa de imagens consistentes antes de existirem fotos de estúdio.
// Em vez de placeholders cinza, cada categoria tem um desenho próprio que
// respeita a paleta da marca e aceita a cor da variante — assim a vitrine já
// comunica a diferença entre uma caneca azul e uma âmbar.
//
// A estampa é tipográfica de propósito: reproduzir o laço do logotipo em
// vetor aproximado deformaria a marca. Quando as fotos reais chegarem, elas
// trazem a assinatura correta aplicada na peça.
//
// Uso: node scripts/gerar-imagens.mjs
// Substituir por fotos reais depois é só trocar os arquivos e as URLs no seed.

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const OUT = path.join(process.cwd(), 'public', 'produtos')

const INK = '#031c33'
const AMBER = '#fab644'
const PAPER = '#f1f5f9'

/** Escurece ou clareia um hex para criar sombra e luz sem depender de filtros. */
function shade(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16)
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))
  const r = clamp(((n >> 16) & 255) + amount)
  const g = clamp(((n >> 8) & 255) + amount)
  const b = clamp((n & 255) + amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/** Contraste do texto aplicado sobre a peça. */
function ink(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  const luminance = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return luminance > 0.62 ? INK : '#ffffff'
}

/**
 * Estampa da escola aplicada na peça: o nome em caixa alta sobre um traço
 * âmbar, a mesma relação de cor da assinatura oficial.
 */
function monogram(x, y, size, color, opacity = 1) {
  const rule = size * 0.62

  return `
    <g transform="translate(${x} ${y})" opacity="${opacity}">
      <rect x="${-rule}" y="${-size * 0.66}" width="${rule * 2}" height="${size * 0.07}"
            fill="${AMBER}" rx="${size * 0.04}"/>
      <text x="0" y="0" text-anchor="middle" dominant-baseline="central"
            font-family="Helvetica, Arial, sans-serif" font-weight="700"
            font-size="${size * 0.44}" fill="${color}" letter-spacing="${size * 0.09}">STRONG</text>
      <text x="0" y="${size * 0.4}" text-anchor="middle" dominant-baseline="central"
            font-family="Helvetica, Arial, sans-serif" font-weight="500"
            font-size="${size * 0.16}" fill="${color}" letter-spacing="${size * 0.06}"
            opacity="0.85">BUSINESS SCHOOL</text>
    </g>`
}

/**
 * Fundo transparente de propósito: a mesma peça aparece sobre o papel claro do
 * catálogo e sobre o azul profundo do herói. Quem define o fundo é a página.
 */
function wrap(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img">
  <ellipse cx="400" cy="686" rx="235" ry="26" fill="${INK}" opacity="0.14"/>
${body}
</svg>
`
}

// ------------------------------------------------------------------ desenhos

function mug(color) {
  const dark = shade(color, -34)
  const light = shade(color, 26)
  const text = ink(color)
  return wrap(`
  <defs>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${dark}"/>
      <stop offset="0.24" stop-color="${color}"/>
      <stop offset="0.62" stop-color="${light}"/>
      <stop offset="1" stop-color="${dark}"/>
    </linearGradient>
  </defs>
  <!-- alça -->
  <path d="M556 300 q104 0 104 92 t-104 92" fill="none" stroke="${dark}" stroke-width="42" stroke-linecap="round"/>
  <path d="M556 300 q104 0 104 92 t-104 92" fill="none" stroke="${color}" stroke-width="24" stroke-linecap="round"/>
  <!-- corpo -->
  <path d="M212 258 h348 v300 q0 76 -74 76 h-200 q-74 0 -74 -76 z" fill="url(#body)"/>
  <!-- boca -->
  <ellipse cx="386" cy="258" rx="174" ry="40" fill="${dark}"/>
  <ellipse cx="386" cy="258" rx="152" ry="31" fill="${shade(color, -60)}"/>
  <ellipse cx="386" cy="262" rx="152" ry="27" fill="${PAPER}" opacity="0.14"/>
  <!-- reflexo -->
  <rect x="250" y="288" width="26" height="290" rx="13" fill="#fff" opacity="0.17"/>
  ${monogram(386, 420, 108, text, 0.94)}`)
}

function tee(color) {
  const dark = shade(color, -30)
  const text = ink(color)
  return wrap(`
  <defs>
    <linearGradient id="fabric" x1="0" y1="0" x2="1" y2="0.4">
      <stop offset="0" stop-color="${shade(color, -16)}"/>
      <stop offset="0.45" stop-color="${shade(color, 14)}"/>
      <stop offset="1" stop-color="${dark}"/>
    </linearGradient>
  </defs>
  <path d="M300 168 l-124 58 -46 148 78 30 26 -56 v306 q0 16 16 16 h300 q16 0 16 -16 v-306 l26 56 78 -30 -46 -148 -124 -58 z"
        fill="url(#fabric)" stroke="${dark}" stroke-width="3"/>
  <!-- gola -->
  <path d="M300 168 q100 74 200 0 q-44 -22 -100 -22 t-100 22 z" fill="${shade(color, -46)}"/>
  <path d="M300 168 q100 74 200 0" fill="none" stroke="${shade(color, -60)}" stroke-width="7"/>
  <!-- costuras das mangas -->
  <path d="M254 348 l-24 -8" stroke="${dark}" stroke-width="4" opacity="0.6"/>
  <path d="M546 348 l24 -8" stroke="${dark}" stroke-width="4" opacity="0.6"/>
  ${monogram(400, 372, 92, text, 0.95)}`)
}

function hoodie(color) {
  const dark = shade(color, -32)
  const cuff = shade(color, -46)
  const text = ink(color)
  return wrap(`
  <defs>
    <linearGradient id="fleece" x1="0" y1="0" x2="1" y2="0.4">
      <stop offset="0" stop-color="${shade(color, -18)}"/>
      <stop offset="0.45" stop-color="${shade(color, 12)}"/>
      <stop offset="1" stop-color="${dark}"/>
    </linearGradient>
  </defs>
  <!-- capuz, atrás dos ombros -->
  <path d="M300 232 q100 -84 200 0 q32 42 20 88 q-120 -50 -240 0 q-12 -46 20 -88 z" fill="${shade(color, -40)}"/>
  <!-- mangas compridas, com punho na ponta -->
  <path d="M272 252 L182 292 L146 498 L236 518 L292 336 Z" fill="${shade(color, -8)}"/>
  <path d="M528 252 L618 292 L654 498 L564 518 L508 336 Z" fill="${dark}"/>
  <path d="M146 498 L236 518 L228 560 L138 540 Z" fill="${cuff}"/>
  <path d="M654 498 L564 518 L572 560 L662 540 Z" fill="${cuff}"/>
  <!-- corpo -->
  <path d="M272 252 q128 -54 256 0 v344 q0 24 -24 24 h-208 q-24 0 -24 -24 z"
        fill="url(#fleece)" stroke="${dark}" stroke-width="3"/>
  <!-- abertura do capuz -->
  <path d="M302 248 q98 90 196 0 q-50 -30 -98 -30 t-98 30 z" fill="${shade(color, -54)}"/>
  <!-- cordão -->
  <path d="M368 276 q8 62 -8 96" stroke="${PAPER}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M434 276 q-8 62 8 96" stroke="${PAPER}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <circle cx="358" cy="378" r="8" fill="${PAPER}"/>
  <circle cx="444" cy="378" r="8" fill="${PAPER}"/>
  <!-- bolso canguru -->
  <path d="M300 486 h200 v88 h-200 z" fill="${shade(color, -12)}" opacity="0.55"/>
  <path d="M300 486 q100 22 200 0" fill="none" stroke="${dark}" stroke-width="5"/>
  <!-- barra -->
  <rect x="268" y="596" width="264" height="32" rx="8" fill="${cuff}"/>
  ${monogram(400, 400, 76, text, 0.95)}`)
}

function pen(color) {
  const dark = shade(color, -40)
  const light = shade(color, 32)
  return wrap(`
  <defs>
    <linearGradient id="barrel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${dark}"/>
      <stop offset="0.3" stop-color="${light}"/>
      <stop offset="0.62" stop-color="${color}"/>
      <stop offset="1" stop-color="${dark}"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8b96a3"/>
      <stop offset="0.35" stop-color="#e8edf2"/>
      <stop offset="0.7" stop-color="#aab4c0"/>
      <stop offset="1" stop-color="#6e7884"/>
    </linearGradient>
  </defs>
  <g transform="rotate(-18 400 400)">
    <!-- ponta -->
    <path d="M372 636 l28 74 28 -74 z" fill="#4c5763"/>
    <path d="M394 692 l6 18 6 -18 z" fill="${INK}"/>
    <!-- cone -->
    <path d="M360 556 h80 l-12 82 h-56 z" fill="url(#metal)"/>
    <!-- corpo -->
    <rect x="356" y="196" width="88" height="364" rx="12" fill="url(#barrel)"/>
    <!-- anel -->
    <rect x="352" y="264" width="96" height="22" rx="6" fill="url(#metal)"/>
    <!-- tampa -->
    <path d="M352 118 q0 -26 26 -26 h44 q26 0 26 26 v104 h-96 z" fill="${dark}"/>
    <!-- clipe -->
    <path d="M440 118 q22 0 22 24 v96 q0 12 -12 12 t-12 -12 v-84" fill="none" stroke="url(#metal)" stroke-width="14" stroke-linecap="round"/>
    <!-- gravação -->
    <text x="400" y="400" text-anchor="middle" transform="rotate(90 400 400)"
          font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="34"
          letter-spacing="9" fill="${ink(color)}" opacity="0.9">STRONG</text>
  </g>`)
}

function notebook(color) {
  const dark = shade(color, -34)
  const text = ink(color)
  return wrap(`
  <defs>
    <linearGradient id="cover" x1="0" y1="0" x2="1" y2="0.25">
      <stop offset="0" stop-color="${shade(color, -14)}"/>
      <stop offset="0.5" stop-color="${shade(color, 12)}"/>
      <stop offset="1" stop-color="${dark}"/>
    </linearGradient>
  </defs>
  <!-- miolo -->
  <rect x="238" y="146" width="352" height="492" rx="10" fill="#ffffff"/>
  <rect x="244" y="152" width="346" height="480" rx="8" fill="#e9eef4"/>
  <!-- capa -->
  <rect x="222" y="134" width="356" height="500" rx="14" fill="url(#cover)"/>
  <!-- lombada -->
  <rect x="222" y="134" width="34" height="500" rx="14" fill="${shade(color, -52)}"/>
  <rect x="252" y="134" width="6" height="500" fill="${shade(color, -60)}" opacity="0.5"/>
  <!-- elástico -->
  <rect x="520" y="134" width="16" height="500" fill="${INK}" opacity="0.55"/>
  <!-- pauta impressa na capa, o traço que dá nome à linha -->
  <g opacity="0.22">
    ${Array.from({ length: 7 }, (_, i) => `<rect x="300" y="${452 + i * 24}" width="180" height="2" fill="${text}"/>`).join('\n    ')}
  </g>
  <rect x="300" y="440" width="2" height="180" fill="${AMBER}" opacity="0.8"/>
  ${monogram(392, 300, 96, text, 0.95)}`)
}

function bottle(color) {
  const dark = shade(color, -36)
  const light = shade(color, 28)
  return wrap(`
  <defs>
    <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${dark}"/>
      <stop offset="0.26" stop-color="${light}"/>
      <stop offset="0.6" stop-color="${color}"/>
      <stop offset="1" stop-color="${dark}"/>
    </linearGradient>
  </defs>
  <!-- bico e tampa -->
  <rect x="374" y="96" width="52" height="22" rx="10" fill="${shade(color, -50)}"/>
  <rect x="362" y="114" width="76" height="58" rx="12" fill="${shade(color, -58)}"/>
  <rect x="358" y="166" width="84" height="14" rx="5" fill="${shade(color, -40)}"/>
  <!-- ombro cônico -->
  <path d="M370 178 h60 l54 50 h-168 z" fill="${shade(color, -22)}"/>
  <!-- corpo esbelto -->
  <path d="M316 224 q84 -14 168 0 v354 q0 64 -64 64 h-40 q-64 0 -64 -64 z" fill="url(#steel)"/>
  <rect x="338" y="256" width="20" height="330" rx="10" fill="#fff" opacity="0.18"/>
  ${monogram(400, 420, 84, ink(color), 0.94)}`)
}

function backpack(color) {
  const dark = shade(color, -34)
  const text = ink(color)
  return wrap(`
  <defs>
    <linearGradient id="canvas" x1="0" y1="0" x2="1" y2="0.3">
      <stop offset="0" stop-color="${shade(color, -16)}"/>
      <stop offset="0.5" stop-color="${shade(color, 12)}"/>
      <stop offset="1" stop-color="${dark}"/>
    </linearGradient>
  </defs>
  <!-- alças, por fora do corpo para ficarem visíveis -->
  <path d="M344 200 q-96 96 -78 320" fill="none" stroke="${shade(color, -52)}" stroke-width="26" stroke-linecap="round"/>
  <path d="M456 200 q96 96 78 320" fill="none" stroke="${shade(color, -52)}" stroke-width="26" stroke-linecap="round"/>
  <!-- alça de mão -->
  <path d="M368 156 q32 -26 64 0" fill="none" stroke="${shade(color, -58)}" stroke-width="16" stroke-linecap="round"/>
  <!-- corpo -->
  <path d="M400 166 q-124 0 -124 138 v250 q0 58 58 58 h132 q58 0 58 -58 v-250 q0 -138 -124 -138 z" fill="url(#canvas)"/>
  <!-- tampa -->
  <path d="M400 166 q-124 0 -124 138 v54 q124 -42 248 0 v-54 q0 -138 -124 -138 z" fill="${shade(color, -26)}"/>
  <path d="M276 358 q124 -42 248 0" fill="none" stroke="${AMBER}" stroke-width="6"/>
  <!-- fivelas -->
  <rect x="340" y="368" width="30" height="44" rx="6" fill="${shade(color, -58)}"/>
  <rect x="430" y="368" width="30" height="44" rx="6" fill="${shade(color, -58)}"/>
  <!-- bolso frontal -->
  <path d="M320 440 h160 v112 q0 18 -18 18 h-124 q-18 0 -18 -18 z" fill="${shade(color, -10)}" opacity="0.8"/>
  <path d="M320 440 h160" stroke="${shade(color, -58)}" stroke-width="5"/>
  ${monogram(400, 296, 72, text, 0.92)}`)
}

function cap(color) {
  const dark = shade(color, -34)
  return wrap(`
  <defs>
    <linearGradient id="crown" x1="0" y1="0" x2="1" y2="0.3">
      <stop offset="0" stop-color="${shade(color, -16)}"/>
      <stop offset="0.5" stop-color="${shade(color, 14)}"/>
      <stop offset="1" stop-color="${dark}"/>
    </linearGradient>
  </defs>
  <!-- aba curva, projetada à frente -->
  <path d="M196 458 q204 100 408 0 q20 86 -92 118 q-112 32 -224 0 q-112 -32 -92 -118 z" fill="${shade(color, -50)}"/>
  <path d="M214 486 q186 82 372 0" fill="none" stroke="${shade(color, -64)}" stroke-width="5" opacity="0.7"/>
  <!-- copa -->
  <path d="M400 196 q-180 0 -180 200 q0 34 12 62 q168 60 336 0 q12 -28 12 -62 q0 -200 -180 -200 z" fill="url(#crown)"/>
  <!-- friso da base -->
  <path d="M232 458 q168 60 336 0" fill="none" stroke="${shade(color, -58)}" stroke-width="10"/>
  <!-- gomos -->
  <path d="M400 196 v250" stroke="${dark}" stroke-width="4" opacity="0.4"/>
  <path d="M306 224 q-26 112 -18 220" stroke="${dark}" stroke-width="4" opacity="0.28" fill="none"/>
  <path d="M494 224 q26 112 18 220" stroke="${dark}" stroke-width="4" opacity="0.28" fill="none"/>
  <circle cx="400" cy="204" r="12" fill="${shade(color, -56)}"/>
  ${monogram(400, 356, 74, ink(color), 0.95)}`)
}

const DRAWINGS = { mug, tee, hoodie, pen, notebook, bottle, backpack, cap }

// Cores comerciais da linha. Azul e âmbar vêm do logotipo; as demais são
// neutras que convivem com a marca sem competir com ela.
const AZUL = '#074784'
const AZUL_ESCURO = '#052f57'
const AMBAR = '#fab644'
const BRANCA = '#f4f7fa'
const GRAFITE = '#39424d'
const ACO = '#b9c3ce'

// Cada arquivo é um par tipo + cor. O seed referencia estes nomes.
const FILES = [
  ['caneca-azul', 'mug', AZUL],
  ['caneca-ambar', 'mug', AMBAR],
  ['caneca-branca', 'mug', BRANCA],
  ['camiseta-azul', 'tee', AZUL],
  ['camiseta-branca', 'tee', BRANCA],
  ['camiseta-ambar', 'tee', AMBAR],
  ['camiseta-grafite', 'tee', GRAFITE],
  ['moletom-azul', 'hoodie', AZUL_ESCURO],
  ['moletom-grafite', 'hoodie', GRAFITE],
  ['moletom-ambar', 'hoodie', AMBAR],
  ['caneta-azul', 'pen', AZUL],
  ['caneta-ambar', 'pen', AMBAR],
  ['caderno-azul', 'notebook', AZUL],
  ['caderno-ambar', 'notebook', AMBAR],
  ['caderno-grafite', 'notebook', GRAFITE],
  ['garrafa-azul', 'bottle', AZUL],
  ['garrafa-aco', 'bottle', ACO],
  ['mochila-azul', 'backpack', AZUL_ESCURO],
  ['mochila-grafite', 'backpack', GRAFITE],
  ['bone-azul', 'cap', AZUL],
]

await mkdir(OUT, { recursive: true })

for (const [name, kind, color] of FILES) {
  await writeFile(path.join(OUT, `${name}.svg`), DRAWINGS[kind](color), 'utf8')
}

console.log(`${FILES.length} imagens geradas em public/produtos`)
