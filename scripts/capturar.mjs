// Captura telas da loja para conferência visual.
// Uso: node scripts/capturar.mjs <pasta-de-saida> [rota1 rota2 ...]

import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const outDir = process.argv[2] ?? 'capturas'
const routes = process.argv.slice(3)

if (routes.length === 0) {
  console.error('Informe ao menos uma rota. Ex.: node scripts/capturar.mjs saida / /produtos')
  process.exit(1)
}

await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
// VIEWPORT=390x844 captura no formato de celular.
const [width, height] = (process.env.VIEWPORT ?? '1440x1000').split('x').map(Number)

const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  locale: 'pt-BR',
  isMobile: width < 768,
  hasTouch: width < 768,
})

const page = await context.newPage()

// Login opcional, para capturar as áreas autenticadas.
if (process.env.LOGIN_EMAIL && process.env.LOGIN_SENHA) {
  await page.goto(`${BASE}/entrar`, { waitUntil: 'networkidle' })
  await page.fill('#email', process.env.LOGIN_EMAIL)
  await page.fill('#password', process.env.LOGIN_SENHA)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.startsWith('/entrar'), { timeout: 30000 })
  console.log(`sessão iniciada como ${process.env.LOGIN_EMAIL}`)
}
const errors = []
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`[console] ${message.text()}`)
})
page.on('pageerror', (error) => errors.push(`[página] ${error.message}`))

for (const route of routes) {
  const name = route === '/' ? 'home' : route.replace(/^\//, '').replace(/[/?=&]/g, '_')
  const response = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 60000 })

  // As fontes precisam estar carregadas antes do print, senão a captura sai
  // com a fallback e a revisão tipográfica fica inútil.
  await page.evaluate(() => document.fonts.ready)

  // Percorre a página até o fim para que as seções reveladas por rolagem
  // estejam visíveis na captura, e volta ao topo.
  //
  // `behavior: 'instant'` é obrigatório: o site usa scroll-behavior smooth, e
  // com rolagem animada o laço termina antes de a página chegar ao fim.
  await page.evaluate(async () => {
    const passo = window.innerHeight * 0.75
    const espera = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

    for (let y = 0; y < document.documentElement.scrollHeight; y += passo) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await espera(140)
    }

    window.scrollTo({ top: 0, behavior: 'instant' })
    await espera(200)
  })
  await page.waitForTimeout(900)

  const file = path.join(outDir, `${name}.png`)
  await page.screenshot({ path: file, fullPage: process.env.FULL_PAGE === '1' })
  console.log(`${response?.status()} ${route} -> ${file}`)
}

await browser.close()

if (errors.length > 0) {
  console.log('\nErros no navegador:')
  for (const error of [...new Set(errors)]) console.log(' ', error)
}
