import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'

// POST /api/predictions — salva ou atualiza palpite
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const { match_id, palpite_casa, palpite_fora } = await request.json()

  if (match_id == null || palpite_casa == null || palpite_fora == null) {
    return NextResponse.json({ erro: 'Dados incompletos.' }, { status: 400 })
  }

  const casa = Number(palpite_casa)
  const fora = Number(palpite_fora)

  if (
    !Number.isInteger(casa) || !Number.isInteger(fora) ||
    casa < 0 || fora < 0 || casa > 99 || fora > 99
  ) {
    return NextResponse.json({ erro: 'Placar inválido.' }, { status: 400 })
  }

  const { data: partida } = await supabase
    .from('matches')
    .select('data_hora, encerrado')
    .eq('id', match_id)
    .single()

  if (!partida) return NextResponse.json({ erro: 'Jogo não encontrado.' }, { status: 404 })
  if (partida.encerrado) return NextResponse.json({ erro: 'Este jogo já encerrou.' }, { status: 400 })

  const fechamento = new Date(partida.data_hora).getTime() - 30 * 60 * 1000
  if (Date.now() >= fechamento) {
    return NextResponse.json({ erro: 'Palpites encerrados para este jogo.' }, { status: 400 })
  }

  const { data: membro } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', session.id)
    .single()

  if (!membro) return NextResponse.json({ erro: 'Você não pertence a nenhum grupo.' }, { status: 403 })

  const { error } = await supabase
    .from('predictions')
    .upsert(
      { user_id: session.id, match_id, group_id: membro.group_id, palpite_casa: casa, palpite_fora: fora },
      { onConflict: 'user_id,match_id,group_id' }
    )

  if (error) return NextResponse.json({ erro: 'Erro ao salvar palpite.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
