import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, readSession } from '@/lib/session'

// Checagem otimista: evita renderizar a árvore inteira de /admin ou /conta
// para quem nem token tem. A autorização de verdade continua nos layouts e em
// cada Server Action, que consultam o banco — este arquivo é conveniência de
// navegação, nunca a fronteira de segurança.

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value)

  if (!session) {
    const url = new URL('/entrar', request.url)
    url.searchParams.set('destino', `${pathname}${search}`)
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/conta', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/conta/:path*', '/checkout/:path*'],
}
