// Repara texto UTF-8 que foi lido como Windows-1252 e regravado como UTF-8:
// cada letra acentuada vira dois ou três caracteres estranhos. Também remove
// BOM. (Os exemplos ficam de fora deste comentário de propósito — o script
// consertaria o próprio texto ao rodar sobre si mesmo.)
//
//   node scripts/corrigir-acentos.mjs [--aplicar]
//
// Dois cuidados que a versão ingênua não tem:
//
// 1. A conversão é feita por TRECHO. Quando parte do arquivo já está correta e
//    parte está danificada, reinterpretar tudo destruiria a parte sã.
// 2. O mapa é o do Windows-1252, não o do Latin-1: os bytes 0x80–0x9F viram
//    aspas curvas, travessão e afins, que estão fora da faixa 0x80–0xBF e
//    escapariam de um detector baseado só em Latin-1.

import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const APLICAR = process.argv.includes('--aplicar')
const RAIZ = ['src', 'prisma', 'scripts']
const EXTENSOES = /\.(tsx?|css|mjs|md)$/

const BOM = 0xfeff

// Windows-1252: os únicos bytes cujo caractere não coincide com o code point.
const CP1252 = new Map([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84],
  [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88],
  [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c],
  [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93],
  [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b],
  [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f],
])

/** Byte que o Windows-1252 usaria para este caractere, ou null. */
function paraByte(code) {
  if (code < 0x100) return code
  return CP1252.get(code) ?? null
}

const decodificador = new TextDecoder('utf-8', { fatal: true })

/**
 * Reconstrói o texto, trocando cada sequência de caracteres que forma um
 * caractere UTF-8 válido pelo caractere original.
 */
function reparar(texto) {
  const entrada = texto.charCodeAt(0) === BOM ? texto.slice(1) : texto
  let saida = ''
  let i = 0

  while (i < entrada.length) {
    const byte = paraByte(entrada.charCodeAt(i))

    // Só um byte inicial de sequência multibyte pode começar um dano.
    if (byte === null || byte < 0xc2 || byte > 0xf4) {
      saida += entrada[i++]
      continue
    }

    const esperado = byte < 0xe0 ? 2 : byte < 0xf0 ? 3 : 4
    const bytes = [byte]

    for (let n = 1; n < esperado; n++) {
      const seguinte = paraByte(entrada.charCodeAt(i + n) || 0)
      if (seguinte === null || seguinte < 0x80 || seguinte > 0xbf) break
      bytes.push(seguinte)
    }

    if (bytes.length !== esperado) {
      saida += entrada[i++]
      continue
    }

    try {
      saida += decodificador.decode(new Uint8Array(bytes))
      i += esperado
    } catch {
      // Não era uma sequência UTF-8: o caractere é legítimo.
      saida += entrada[i++]
    }
  }

  return saida
}

async function* arquivos(dir) {
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const alvo = path.join(dir, entrada.name)
    if (entrada.isDirectory()) yield* arquivos(alvo)
    else if (EXTENSOES.test(entrada.name)) yield alvo
  }
}

let afetados = 0

for (const raiz of RAIZ) {
  for await (const arquivo of arquivos(raiz)) {
    const original = await readFile(arquivo, 'utf8')

    // Reaplica enquanto houver o que desfazer (arquivos que passaram duas
    // vezes pelo problema), com teto para não entrar em laço.
    let texto = original
    for (let volta = 0; volta < 3; volta++) {
      const proximo = reparar(texto)
      if (proximo === texto) break
      texto = proximo
    }

    if (texto !== original) {
      afetados++
      console.log(`  ${arquivo}`)
      if (APLICAR) await writeFile(arquivo, texto, 'utf8')
    }
  }
}

console.log(
  afetados === 0
    ? 'Nenhum arquivo com acentuação corrompida.'
    : `${afetados} arquivos ${APLICAR ? 'corrigidos' : 'a corrigir (rode com --aplicar)'}.`,
)
