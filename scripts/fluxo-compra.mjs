// Teste de fumaça do fluxo de compra, ponta a ponta, num navegador real.
//
// Percorre: criar conta → escolher produto → carrinho → cupom → checkout →
// pagamento simulado → pedido pago. Falha em qualquer etapa encerra com
// código 1, então serve como verificação antes de publicar.
//
//   npm run dev            (em outro terminal)
//   node scripts/fluxo-compra.mjs

import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const email = `teste.${Date.now()}@exemplo.com`
const SENHA = 'Teste@2026'

const steps = []
function ok(label, detail = '') {
  steps.push(`  OK   ${label}${detail ? ` — ${detail}` : ''}`)
}

const browser = await chromium.launch()
const page = await browser.newContext({ locale: 'pt-BR' }).then((c) => c.newPage())

const problems = []
page.on('pageerror', (error) => problems.push(`erro de página: ${error.message}`))
page.on('response', (response) => {
  if (response.status() >= 500) problems.push(`${response.status()} em ${response.url()}`)
})

try {
  // ---------------------------------------------------------- criar conta
  await page.goto(`${BASE}/criar-conta`, { waitUntil: 'networkidle' })
  await page.fill('#name', 'Cliente de Teste')
  await page.fill('#email', email)
  await page.fill('#password', SENHA)
  await page.fill('#confirm', SENHA)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/conta', { timeout: 30000 })
  ok('conta criada', email)

  // ------------------------------------------------------------- produto
  await page.goto(`${BASE}/produtos/moletom-strong-campus`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'G', exact: true }).click()
  await page.getByRole('button', { name: /Adicionar ao carrinho/i }).click()
  await page.waitForSelector('text=Item adicionado ao carrinho', { timeout: 20000 })
  ok('item adicionado ao carrinho')

  // ------------------------------------------------------------ carrinho
  await page.goto(`${BASE}/carrinho`, { waitUntil: 'networkidle' })
  await page.fill('#cupom', 'BEMVINDO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await page.waitForSelector('text=BEMVINDO10', { timeout: 20000 })
  ok('cupom aplicado')

  // ------------------------------------------------------------ checkout
  await page.goto(`${BASE}/checkout`, { waitUntil: 'networkidle' })
  await page.fill('#zip', '01310100')
  await page.waitForFunction(
    () => (document.querySelector('#city')).value.length > 0,
    null,
    { timeout: 20000 },
  )
  await page.fill('#number', '1578')
  await page.waitForSelector('input[name="shippingId"]', { timeout: 20000 })
  await page.check('input[value="PADRAO"]')
  await page.check('input[value="PIX"]')

  const cidade = await page.inputValue('#city')
  ok('endereço preenchido pelo CEP', cidade)

  await page.getByRole('button', { name: /Pagar e finalizar/i }).click()
  await page.waitForURL('**/checkout/simulacao/**', { timeout: 45000 })
  ok('pedido criado, pagamento aberto')

  // ----------------------------------------------------------- pagamento
  await page.getByRole('button', { name: /Aprovar pagamento/i }).click()
  await page.waitForURL('**/pedido/**', { timeout: 30000 })
  await page.waitForSelector('text=Pagamento confirmado', { timeout: 20000 })

  const numero = await page.locator('h1').first().innerText()
  ok('pagamento aprovado', numero.replace('Pedido ', ''))

  // ------------------------------------------------------- pós-condições
  await page.goto(`${BASE}/conta/pedidos`, { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Pagamento aprovado', { timeout: 20000 })
  ok('pedido listado na área do cliente')

  await page.goto(`${BASE}/carrinho`, { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Seu carrinho está vazio', { timeout: 20000 })
  ok('carrinho esvaziado após a compra')

  console.log('\nFluxo de compra completo:\n')
  console.log(steps.join('\n'))

  if (problems.length > 0) {
    console.log('\nAvisos:')
    for (const problem of [...new Set(problems)]) console.log(' ', problem)
  }
} catch (error) {
  console.log('\nFluxo interrompido:\n')
  console.log(steps.join('\n'))
  console.error(`\n  FALHOU  ${error.message}`)
  if (problems.length > 0) {
    console.error('\nProblemas registrados:')
    for (const problem of [...new Set(problems)]) console.error(' ', problem)
  }
  await page.screenshot({ path: 'falha-fluxo-compra.png', fullPage: true })
  console.error('\nCaptura do momento da falha: falha-fluxo-compra.png')
  await browser.close()
  process.exit(1)
}

await browser.close()
