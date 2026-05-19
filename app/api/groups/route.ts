import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

function gerarCodigo(): string {
  // 3 bytes aleatórios → 6 caracteres hex maiúsculos
  return randomBytes(3).toString('hex').toUpperCase()
}

// POST /api/groups — cria grupo (apenas admin)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  if (!ADMIN_EMAIL || session.email !== ADMIN_EMAIL) {
    return NextResponse.json({ erro: 'Apenas o administrador pode criar grupos.' }, { status: 403 })
  }

  const { nome } = await request.json()

  if (!nome || typeof nome !== 'string' || !nome.trim()) {
    return NextResponse.json({ erro: 'Nome do grupo é obrigatório.' }, { status: 400 })
  }

  const nomeTrimmed = nome.trim()
  if (nomeTrimmed.length > 80) {
    return NextResponse.json({ erro: 'Nome muito longo.' }, { status: 400 })
  }

  const codigo = gerarCodigo()

  const { data: grupo, error } = await supabase
    .from('groups')
    .insert({ nome: nomeTrimmed, codigo, admin_id: session.id })
    .select('id, nome, codigo')
    .single()

  if (error || !grupo) return NextResponse.json({ erro: 'Erro ao criar grupo.' }, { status: 500 })

  // Admin entra automaticamente no grupo que criou
  await supabase.from('group_members').insert({ group_id: grupo.id, user_id: session.id })

  return NextResponse.json({ grupo })
}
