import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'

// POST /api/groups/join — entra em grupo por código
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const { codigo } = await request.json()
  if (!codigo?.trim()) return NextResponse.json({ erro: 'Código é obrigatório.' }, { status: 400 })

  // Verifica se já está em algum grupo
  const { data: membro } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', session.id)
    .single()

  if (membro) return NextResponse.json({ erro: 'Você já pertence a um grupo.' }, { status: 409 })

  const { data: grupo } = await supabase
    .from('groups')
    .select('id, nome, codigo')
    .eq('codigo', codigo.trim().toUpperCase())
    .single()

  if (!grupo) return NextResponse.json({ erro: 'Código inválido.' }, { status: 404 })

  await supabase.from('group_members').insert({ group_id: grupo.id, user_id: session.id })

  return NextResponse.json({ grupo })
}
