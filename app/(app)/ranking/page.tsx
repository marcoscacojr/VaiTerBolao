'use client'

import { useEffect, useState } from 'react'

type Participante = {
  user_id: string
  nome: string
  pontos: number
  voce: boolean
}

const medalhas = ['🥇', '🥈', '🥉']

export default function RankingPage() {
  const [ranking, setRanking] = useState<Participante[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch('/api/ranking')
      .then((r) => r.json())
      .then((data) => {
        if (data.erro) { setErro(data.erro); return }
        setRanking(data.ranking)
      })
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) return <div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>
  if (erro) return <div className="min-h-screen flex items-center justify-center text-red-500">{erro}</div>

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
      <h1 className="text-xl font-bold">Ranking</h1>

      {ranking.length === 0 ? (
        <p className="text-gray-400 text-sm">Nenhum palpite pontuado ainda.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {ranking.map((p, i) => (
            <div
              key={p.user_id}
              className={`flex items-center px-4 py-3 gap-3 border-b last:border-b-0 ${p.voce ? 'bg-green-50' : ''}`}
            >
              <span className="w-7 text-center text-lg">
                {medalhas[i] ?? <span className="text-sm font-bold text-gray-400">{i + 1}°</span>}
              </span>
              <span className={`flex-1 text-sm ${p.voce ? 'font-bold text-green-700' : 'text-gray-700'}`}>
                {p.nome} {p.voce && <span className="text-xs font-normal text-green-500">(você)</span>}
              </span>
              <span className="font-bold text-gray-800">{p.pontos} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
