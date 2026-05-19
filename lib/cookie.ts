import { NextResponse } from 'next/server'

const isProd = process.env.NODE_ENV === 'production'

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  })
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set('token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 0,
    path: '/',
  })
}
