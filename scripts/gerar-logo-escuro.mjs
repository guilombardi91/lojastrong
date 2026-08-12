// Deriva a versão do logo para fundos claros a partir do arquivo oficial.
//
// O arquivo enviado pela escola é o logo branco (só legível sobre fundo
// escuro). Aqui os pixels brancos do wordmark viram o azul institucional e o
// símbolo âmbar é preservado, de modo que a mesma marca funcione no cabeçalho
// claro da loja.
//
//   node scripts/gerar-logo-escuro.mjs

import sharp from 'sharp'

const ORIGEM = 'public/logo-strong-white.png'
const DESTINO = 'public/logo-strong.png'

const AZUL = { r: 0x07, g: 0x47, b: 0x84 }

const image = sharp(ORIGEM)
const { width, height } = await image.metadata()
const { data } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true })

for (let i = 0; i < data.length; i += 4) {
  const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
  if (a === 0) continue

  // O wordmark é acromático (R≈G≈B); o símbolo é âmbar saturado. Trocar apenas
  // o que não tem saturação preserva a cor da marca.
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max - min < 40) {
    data[i] = AZUL.r
    data[i + 1] = AZUL.g
    data[i + 2] = AZUL.b
  }
}

await sharp(data, { raw: { width, height, channels: 4 } })
  .png()
  .toFile(DESTINO)

console.log(`${DESTINO} gerado a partir de ${ORIGEM} (${width}x${height})`)
