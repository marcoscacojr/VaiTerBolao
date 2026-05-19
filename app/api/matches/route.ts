import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'

// GET /api/matches — retorna jogos com palpite do usuário (se houver)
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const { data: membro } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', session.id)
    .single()

  if (!membro) return NextResponse.json({ erro: 'Você não pertence a nenhum grupo.' }, { status: 403 })

  const { data: partidas } = await supabase
    .from('matches')
    .select('*')
    .order('data_hora', { ascending: true })

  const { data: palpites } = await supabase
    .from('predictions')
    .select('match_id, palpite_casa, palpite_fora, pontos')
    .eq('user_id', session.id)
    .eq('group_id', membro.group_id)

  const palpiteMap = Object.fromEntries(
    (palpites ?? []).map((p) => [p.match_id, p])
  )

  const partidas_com_palpite = (partidas ?? []).map((partida) => ({
    ...partida,
    palpite: palpiteMap[partida.id] ?? null,
  }))

  return NextResponse.json({ partidas: partidas_com_palpite })
}
