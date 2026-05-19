import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const { data: membro } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', session.id)
    .single()

  if (!membro) return NextResponse.json({ erro: 'Você não pertence a nenhum grupo.' }, { status: 403 })

  // Busca todos os membros do grupo com seus pontos totais
  const { data: membros } = await supabase
    .from('group_members')
    .select('user_id, users(nome)')
    .eq('group_id', membro.group_id)

  const { data: pontos } = await supabase
    .from('predictions')
    .select('user_id, pontos')
    .eq('group_id', membro.group_id)
    .not('pontos', 'is', null)

  const totais: Record<string, number> = {}
  for (const p of pontos ?? []) {
    totais[p.user_id] = (totais[p.user_id] ?? 0) + (p.pontos ?? 0)
  }

  const ranking = (membros ?? [])
    .map((m: any) => ({
      user_id: m.user_id,
      nome: m.users?.nome ?? 'Desconhecido',
      pontos: totais[m.user_id] ?? 0,
      voce: m.user_id === session.id,
    }))
    .sort((a, b) => b.pontos - a.pontos)

  return NextResponse.json({ ranking })
}
