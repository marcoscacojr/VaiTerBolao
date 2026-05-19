import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verificarSenha, gerarToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { email, senha } = await request.json()

  if (!email || !senha) {
    return NextResponse.json({ erro: 'Preencha todos os campos.' }, { status: 400 })
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, nome, email, senha_hash')
    .eq('email', email)
    .single()

  if (!user) {
    return NextResponse.json({ erro: 'E-mail ou senha incorretos.' }, { status: 401 })
  }

  const senhaCorreta = await verificarSenha(senha, user.senha_hash)
  if (!senhaCorreta) {
    return NextResponse.json({ erro: 'E-mail ou senha incorretos.' }, { status: 401 })
  }

  const token = gerarToken({ id: user.id, email: user.email, nome: user.nome })

  const { data: grupo } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .single()

  const response = NextResponse.json({
    usuario: { id: user.id, nome: user.nome, email: user.email },
    temGrupo: !!grupo,
  })
  response.cookies.set('token', token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' })
  return response
}
