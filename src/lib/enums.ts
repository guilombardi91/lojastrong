// O schema usa String em vez do tipo enum do Postgres, e a validação vive aqui:
// acrescentar um status novo não exige migration. Manter os valores como const
// assertions dá autocomplete e checagem em tempo de compilação.

export const ROLES = ['CUSTOMER', 'ADMIN'] as const
export type Role = (typeof ROLES)[number]

export const ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'PACKING',
  'SHIPPED',
  'DELIVERED',
  'CANCELED',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Aguardando pagamento',
  PAID: 'Pagamento aprovado',
  PACKING: 'Em separação',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado',
}

/// Ordem em que o pedido avança na esteira. CANCELED fica fora: é uma saída,
/// não uma etapa.
export const ORDER_PIPELINE: OrderStatus[] = [
  'PENDING',
  'PAID',
  'PACKING',
  'SHIPPED',
  'DELIVERED',
]

export const PAYMENT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'REFUNDED'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'Aguardando',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
  REFUNDED: 'Estornado',
}

export const PAYMENT_METHODS = ['PIX', 'BOLETO', 'CREDIT_CARD'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  PIX: 'Pix',
  BOLETO: 'Boleto bancário',
  CREDIT_CARD: 'Cartão de crédito',
}

export const COUPON_TYPES = ['PERCENT', 'FIXED', 'FREE_SHIPPING'] as const
export type CouponType = (typeof COUPON_TYPES)[number]

export const COUPON_TYPE_LABEL: Record<CouponType, string> = {
  PERCENT: 'Percentual',
  FIXED: 'Valor fixo',
  FREE_SHIPPING: 'Frete grátis',
}

export const STOCK_REASONS = ['SALE', 'RESTOCK', 'ADJUSTMENT', 'CANCELLATION'] as const
export type StockReason = (typeof STOCK_REASONS)[number]

export const STOCK_REASON_LABEL: Record<StockReason, string> = {
  SALE: 'Venda',
  RESTOCK: 'Reposição',
  ADJUSTMENT: 'Ajuste manual',
  CANCELLATION: 'Devolução por cancelamento',
}

/**
 * Ordem em que a grade de vestuário é apresentada.
 * Alfabética colocaria GG antes de M; ninguém escolhe tamanho assim.
 */
export const SIZE_ORDER = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG', 'Único'] as const

export function compareSizes(a: string, b: string): number {
  const ia = SIZE_ORDER.indexOf(a as (typeof SIZE_ORDER)[number])
  const ib = SIZE_ORDER.indexOf(b as (typeof SIZE_ORDER)[number])
  // Tamanhos fora da tabela vão para o fim, em ordem alfabética entre si.
  if (ia === -1 && ib === -1) return a.localeCompare(b, 'pt-BR')
  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
}

export const UF = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
] as const
export type Uf = (typeof UF)[number]
