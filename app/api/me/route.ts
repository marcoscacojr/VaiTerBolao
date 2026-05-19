import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  return NextResponse.json({
    id: session.id,
    nome: session.nome,
    email: session.email,
    is_admin: !!ADMIN_EMAIL && session.email === ADMIN_EMAIL,
  })
}
