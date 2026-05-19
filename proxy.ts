import { NextRequest, NextResponse } from 'next/server'
import { verificarToken } from '@/lib/auth'

const rotasPublicas = ['/login', '/cadastro']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (rotasPublicas.some((rota) => pathname.startsWith(rota))) {
    return NextResponse.next()
  }

  const token = request.cookies.get('token')?.value

  if (!token || !verificarToken(token)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
