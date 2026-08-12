// Utilitário de conferência: junta todos os SVGs de public/produtos numa
// única folha de contato PNG para revisão visual rápida.
// Uso: node scripts/folha-contato.mjs <arquivo-de-saida.png>

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const DIR = path.join(process.cwd(), 'public', 'produtos')
const OUT = process.argv[2] ?? 'folha-contato.png'

const CELL = 210
const COLS = 5

const files = (await readdir(DIR)).filter((f) => f.endsWith('.svg')).sort()
const rows = Math.ceil(files.length / COLS)

const tiles = await Promise.all(
  files.map(async (file, index) => ({
    input: await sharp(await readFile(path.join(DIR, file)))
      .resize(CELL, CELL)
      .png()
      .toBuffer(),
    left: (index % COLS) * CELL,
    top: Math.floor(index / COLS) * CELL,
  })),
)

await sharp({
  create: {
    width: COLS * CELL,
    height: rows * CELL,
    channels: 4,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
})
  .composite(tiles)
  .png()
  .toFile(OUT)

console.log(`${files.length} imagens em ${OUT}`)
console.log(files.join('  '))
