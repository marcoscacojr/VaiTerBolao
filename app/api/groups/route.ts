import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'

function gerarCodigo(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// POST /api/groups — cria grupo
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const { nome } = await request.json()
  if (!nome?.trim()) return NextResponse.json({ erro: 'Nome do grupo é obrigatório.' }, { status: 400 })

  // Verifica se já está em algum grupo
  const { data: membro } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', session.id)
    .single()

  if (membro) return NextResponse.json({ erro: 'Você já pertence a um grupo.' }, { status: 409 })

  const codigo = gerarCodigo()

  const { data: grupo, error } = await supabase
    .from('groups')
    .insert({ nome: nome.trim(), codigo, admin_id: session.id })
    .select('id, nome, codigo')
    .single()

  if (error || !grupo) return NextResponse.json({ erro: 'Erro ao criar grupo.' }, { status: 500 })

  await supabase.from('group_members').insert({ group_id: grupo.id, user_id: session.id })

  return NextResponse.json({ grupo })
}
