// Dinheiro trafega em centavos (Int) por todo o sistema. A conversão para
// texto acontece só na borda de exibição, e a leitura de formulários acontece
// só na borda de entrada.

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

/** 12990 → "R$ 129,90" */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100)
}

/** 12990 → "129,90" (sem símbolo, para inputs) */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

/**
 * Lê o que o admin digitou e devolve centavos.
 * Aceita "129,90", "129.90", "R$ 1.299,90" e "1299".
 */
export function inputToCents(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '').trim()
  if (!cleaned) return 0

  // Quando há vírgula, ela é o separador decimal e os pontos são de milhar.
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
}

/** Percentual de desconto entre o preço "de" e o preço "por". */
export function discountPercent(compareAt: number, price: number): number {
  if (compareAt <= price) return 0
  return Math.round(((compareAt - price) / compareAt) * 100)
}

/** Divide em parcelas sem juros, respeitando o mínimo de R$ 20 por parcela. */
export function installments(total: number, max = 12, minPerInstallment = 2000) {
  const count = Math.max(1, Math.min(max, Math.floor(total / minPerInstallment)))
  return { count, value: Math.floor(total / count) }
}
