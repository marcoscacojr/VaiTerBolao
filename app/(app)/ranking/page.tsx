'use client'

import { useEffect, useState } from 'react'

type Participante = { user_id: string; nome: string; pontos: number; voce: boolean }

const medalhas = ['🥇', '🥈', '🥉']

export default function RankingPage() {
  const [ranking, setRanking] = useState<Participante[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch('/api/ranking')
      .then((r) => r.json())
      .then((data) => { if (data.erro) { setErro(data.erro); return }; setRanking(data.ranking) })
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) return <div className="min-h-screen flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
  if (erro) return <div className="min-h-screen flex items-center justify-center text-sm text-red-500">{erro}</div>

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Ranking do grupo</h1>

      {ranking.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum palpite pontuado ainda.</p>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {ranking.map((p, i) => (
            <div
              key={p.user_id}
              className={`flex items-center px-4 py-3.5 gap-3 border-b last:border-b-0 ${p.voce ? 'bg-green-50 dark:bg-green-950/40' : ''}`}
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="w-7 text-center text-lg">
                {medalhas[i] ?? <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>{i + 1}°</span>}
              </span>
              <span
                className={`flex-1 text-sm ${p.voce ? 'font-bold text-green-700 dark:text-green-400' : ''}`}
                style={!p.voce ? { color: 'var(--text)' } : undefined}
              >
                {p.nome}
                {p.voce && <span className="text-xs font-normal text-green-500 ml-1">(você)</span>}
              </span>
              <div className="text-right">
                <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{p.pontos}</span>
                <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>pts</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
