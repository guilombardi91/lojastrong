import type { Uf } from './enums'

// Tabela própria de frete, por região e peso. É o suficiente para operar a
// loja hoje e mantém o cálculo previsível; trocar por uma cotação real
// (Correios, Melhor Envio, Frete Rápido) significa reimplementar apenas
// `quoteShipping`, que é o único ponto que o checkout consome.

export const FREE_SHIPPING_THRESHOLD = 29900 // R$ 299,00

type Region = 'SUDESTE' | 'SUL' | 'CENTRO_OESTE' | 'NORDESTE' | 'NORTE'

const REGION_BY_UF: Record<string, Region> = {
  SP: 'SUDESTE', RJ: 'SUDESTE', MG: 'SUDESTE', ES: 'SUDESTE',
  PR: 'SUL', SC: 'SUL', RS: 'SUL',
  DF: 'CENTRO_OESTE', GO: 'CENTRO_OESTE', MT: 'CENTRO_OESTE', MS: 'CENTRO_OESTE',
  BA: 'NORDESTE', SE: 'NORDESTE', AL: 'NORDESTE', PE: 'NORDESTE', PB: 'NORDESTE',
  RN: 'NORDESTE', CE: 'NORDESTE', PI: 'NORDESTE', MA: 'NORDESTE',
  AM: 'NORTE', PA: 'NORTE', AC: 'NORTE', RO: 'NORTE', RR: 'NORTE', AP: 'NORTE', TO: 'NORTE',
}

const TABLE: Record<Region, { base: number; days: number }> = {
  SUDESTE: { base: 1990, days: 4 },
  SUL: { base: 2490, days: 6 },
  CENTRO_OESTE: { base: 2790, days: 7 },
  NORDESTE: { base: 3290, days: 9 },
  NORTE: { base: 3890, days: 12 },
}

export type ShippingOption = {
  id: 'PADRAO' | 'EXPRESSA'
  name: string
  price: number
  days: number
  free: boolean
}

/**
 * Cotação para um destino.
 *
 * @param uf         estado de destino
 * @param weightGrams peso somado dos itens
 * @param subtotal   subtotal em centavos, para aplicar o frete grátis
 */
export function quoteShipping(uf: string, weightGrams: number, subtotal: number): ShippingOption[] {
  const region = REGION_BY_UF[uf?.toUpperCase()] ?? 'SUDESTE'
  const { base, days } = TABLE[region]

  // Cada 500 g acima do primeiro quilo acrescenta R$ 4,50.
  const extraWeight = Math.max(0, weightGrams - 1000)
  const weightFee = Math.ceil(extraWeight / 500) * 450

  const standard = base + weightFee
  const express = Math.round(standard * 1.75)
  const freeStandard = subtotal >= FREE_SHIPPING_THRESHOLD

  return [
    {
      id: 'PADRAO',
      name: 'Entrega padrão',
      price: freeStandard ? 0 : standard,
      days,
      free: freeStandard,
    },
    {
      id: 'EXPRESSA',
      name: 'Entrega expressa',
      price: express,
      days: Math.max(1, Math.ceil(days / 2)),
      free: false,
    },
  ]
}

/** Aceita "01310-100" ou "01310100" e devolve só os dígitos. */
export function normalizeZip(zip: string): string {
  return zip.replace(/\D/g, '').slice(0, 8)
}

export function formatZip(zip: string): string {
  const digits = normalizeZip(zip)
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

export function isValidZip(zip: string): boolean {
  return normalizeZip(zip).length === 8
}

/** Estado provável a partir da faixa de CEP, para pré-cotar antes do endereço completo. */
export function ufFromZip(zip: string): Uf | null {
  const n = Number(normalizeZip(zip).slice(0, 5))
  if (!Number.isFinite(n) || n === 0) return null

  const ranges: Array<[number, number, Uf]> = [
    [1000, 19999, 'SP'], [20000, 28999, 'RJ'], [29000, 29999, 'ES'],
    [30000, 39999, 'MG'], [40000, 48999, 'BA'], [49000, 49999, 'SE'],
    [50000, 56999, 'PE'], [57000, 57999, 'AL'], [58000, 58999, 'PB'],
    [59000, 59999, 'RN'], [60000, 63999, 'CE'], [64000, 64999, 'PI'],
    [65000, 65999, 'MA'], [66000, 68899, 'PA'], [68900, 68999, 'AP'],
    [69000, 69299, 'AM'], [69300, 69399, 'RR'], [69400, 69899, 'AM'],
    [69900, 69999, 'AC'], [70000, 73699, 'DF'], [72800, 72999, 'GO'],
    [73700, 76799, 'GO'], [76800, 76999, 'RO'], [77000, 77999, 'TO'],
    [78000, 78899, 'MT'], [79000, 79999, 'MS'], [80000, 87999, 'PR'],
    [88000, 89999, 'SC'], [90000, 99999, 'RS'],
  ]

  for (const [start, end, uf] of ranges) {
    if (n >= start && n <= end) return uf
  }
  return null
}
