import { NextResponse } from 'next/server'
import { isValidZip, normalizeZip, quoteShipping, ufFromZip } from '@/lib/shipping'

/**
 * Cotação de frete para a vitrine e o carrinho.
 *
 * GET /api/frete?cep=01310100&peso=780&subtotal=24990
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const zip = normalizeZip(url.searchParams.get('cep') ?? '')

  if (!isValidZip(zip)) {
    return NextResponse.json({ error: 'Informe um CEP com 8 dígitos.' }, { status: 400 })
  }

  const uf = ufFromZip(zip)
  if (!uf) {
    return NextResponse.json({ error: 'Não atendemos esta faixa de CEP.' }, { status: 422 })
  }

  const weight = Math.max(1, Number(url.searchParams.get('peso')) || 300)
  const subtotal = Math.max(0, Number(url.searchParams.get('subtotal')) || 0)

  return NextResponse.json({
    uf,
    options: quoteShipping(uf, weight, subtotal),
  })
}
