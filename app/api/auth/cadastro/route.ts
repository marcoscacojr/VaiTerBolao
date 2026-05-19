import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashSenha, gerarToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { nome, email, senha } = await request.json()

  if (!nome || !email || !senha) {
    return NextResponse.json({ erro: 'Preencha todos os campos.' }, { status: 400 })
  }

  const { data: existente } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existente) {
    return NextResponse.json({ erro: 'E-mail já cadastrado.' }, { status: 409 })
  }

  const senha_hash = await hashSenha(senha)

  const { data: user, error } = await supabase
    .from('users')
    .insert({ nome, email, senha_hash })
    .select('id, nome, email')
    .single()

  if (error || !user) {
    return NextResponse.json({ erro: 'Erro ao criar conta.' }, { status: 500 })
  }

  const token = gerarToken({ id: user.id, email: user.email, nome: user.nome })

  // Novo usuário nunca tem grupo ainda
  const response = NextResponse.json({
    usuario: { id: user.id, nome: user.nome, email: user.email },
    temGrupo: false,
  })
  response.cookies.set('token', token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' })
  return response
}
