import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashSenha, gerarToken } from '@/lib/auth'
import { setAuthCookie } from '@/lib/cookie'

export async function POST(request: NextRequest) {
  const { nome, email, senha } = await request.json()

  if (!nome || !email || !senha) {
    return NextResponse.json({ erro: 'Preencha todos os campos.' }, { status: 400 })
  }

  if (typeof nome !== 'string' || typeof email !== 'string' || typeof senha !== 'string') {
    return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 })
  }

  const nomeTrimmed = nome.trim()
  const emailTrimmed = email.trim().toLowerCase()

  if (nomeTrimmed.length < 2 || nomeTrimmed.length > 80) {
    return NextResponse.json({ erro: 'Nome deve ter entre 2 e 80 caracteres.' }, { status: 400 })
  }

  if (emailTrimmed.length > 200) {
    return NextResponse.json({ erro: 'E-mail inválido.' }, { status: 400 })
  }

  if (senha.length < 6 || senha.length > 128) {
    return NextResponse.json({ erro: 'Senha deve ter entre 6 e 128 caracteres.' }, { status: 400 })
  }

  const { data: existente } = await supabase
    .from('users')
    .select('id')
    .eq('email', emailTrimmed)
    .single()

  if (existente) {
    return NextResponse.json({ erro: 'E-mail já cadastrado.' }, { status: 409 })
  }

  const senha_hash = await hashSenha(senha)

  const { data: user, error } = await supabase
    .from('users')
    .insert({ nome: nomeTrimmed, email: emailTrimmed, senha_hash })
    .select('id, nome, email')
    .single()

  if (error || !user) {
    return NextResponse.json({ erro: 'Erro ao criar conta.' }, { status: 500 })
  }

  const token = gerarToken({ id: user.id, email: user.email, nome: user.nome })

  const response = NextResponse.json({
    usuario: { id: user.id, nome: user.nome, email: user.email },
    temGrupo: false,
  })
  setAuthCookie(response, token)
  return response
}
