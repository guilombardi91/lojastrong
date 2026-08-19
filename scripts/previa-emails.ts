import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  buildBackInStockEmail,
  buildPasswordResetEmail,
  buildVerificationEmail,
} from '../src/lib/emails'

// Grava os e-mails transacionais como arquivos HTML, sem enviar nada.
// Serve para revisar o texto e o layout no navegador antes de subir.
//
//   npx tsx scripts/previa-emails.ts        (ou: npm run emails:previa)
//
// Para conferir o pior caso — o Outlook do Microsoft 365, que renderiza com o
// motor do Word — não basta o navegador: mande um dos arquivos para uma conta
// de teste e abra por lá.

const OUT = path.join(process.cwd(), 'capturas', 'emails')

const amostras = [
  {
    arquivo: 'confirmacao-cadastro.html',
    email: buildVerificationEmail({
      name: 'Ana Ribeiro',
      token: 'token-de-exemplo-nao-funciona',
    }),
  },
  {
    arquivo: 'esqueci-senha.html',
    email: buildPasswordResetEmail({
      name: 'Ana Ribeiro',
      token: 'token-de-exemplo-nao-funciona',
    }),
  },
  {
    arquivo: 'voltou-ao-estoque.html',
    email: buildBackInStockEmail({
      productName: 'Camisa Polo Strong',
      variantLabel: 'M · Azul-marinho',
      price: 'R$ 189,90',
      // Vale trocar por uma URL de imagem real para ver o cartão completo.
      imageUrl: null,
      productUrl: 'http://localhost:3000/produtos/camisa-polo-strong',
    }),
  },
]

async function main() {
  await mkdir(OUT, { recursive: true })

  for (const { arquivo, email } of amostras) {
    await writeFile(path.join(OUT, arquivo), email.html, 'utf8')
    await writeFile(
      path.join(OUT, arquivo.replace('.html', '.txt')),
      `Assunto: ${email.subject}\n\n${email.text}\n`,
      'utf8',
    )
    console.log(`✓ ${arquivo}  —  ${email.subject}`)
  }

  console.log(`\nArquivos em ${OUT}`)
}

main()
