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

  if (!membro) return NextResponse.json({ erro: 'sem_grupo' }, { status: 403 })

  const [proximosRes, membrosRes, pontosRes, palpitesCountRes] = await Promise.all([
    supabase
      .from('matches')
      .select('id, time_casa, time_fora, data_hora, fase, grupo')
      .eq('encerrado', false)
      .order('data_hora', { ascending: true })
      .limit(4),

    supabase
      .from('group_members')
      .select('user_id, users(nome)')
      .eq('group_id', membro.group_id),

    supabase
      .from('predictions')
      .select('user_id, pontos')
      .eq('group_id', membro.group_id)
      .not('pontos', 'is', null),

    supabase
      .from('predictions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.id)
      .eq('group_id', membro.group_id),
  ])

  const totais: Record<string, number> = {}
  for (const p of pontosRes.data ?? []) {
    totais[p.user_id] = (totais[p.user_id] ?? 0) + (p.pontos ?? 0)
  }

  const ranking = (membrosRes.data ?? [])
    .map((m: any) => ({
      user_id: m.user_id,
      nome: m.users?.nome ?? 'Desconhecido',
      pontos: totais[m.user_id] ?? 0,
      voce: m.user_id === session.id,
    }))
    .sort((a, b) => b.pontos - a.pontos)

  const posicao = ranking.findIndex((r) => r.voce) + 1

  return NextResponse.json({
    proximos: proximosRes.data ?? [],
    ranking,
    stats: {
      nome: session.nome,
      posicao,
      pontos: totais[session.id] ?? 0,
      total_palpites: palpitesCountRes.count ?? 0,
    },
  })
}
