'use client'

import { useEffect, useState } from 'react'

type Palpite = { palpite_casa: number; palpite_fora: number; pontos: number | null } | null

type Partida = {
  id: string
  fase: string
  grupo: string | null
  time_casa: string
  time_fora: string
  data_hora: string
  placar_casa: number
  placar_fora: number
  encerrado: boolean
  palpite: Palpite
}

function badgePontos(pontos: number | null) {
  if (pontos === 10) return <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Placar exato · 10 pts</span>
  if (pontos === 5) return <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Vencedor certo · 5 pts</span>
  if (pontos === 3) return <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Empate certo · 3 pts</span>
  if (pontos === 0) return <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Errou · 0 pts</span>
  return null
}

function formatarData(data_hora: string): string {
  return new Date(data_hora).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ResultadosPage() {
  const [partidas, setPartidas] = useState<Partida[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch('/api/matches')
      .then((r) => r.json())
      .then((data) => {
        if (data.erro) { setErro(data.erro); return }
        setPartidas(data.partidas.filter((p: Partida) => p.encerrado))
      })
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) return <div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>
  if (erro) return <div className="min-h-screen flex items-center justify-center text-red-500">{erro}</div>

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
      <h1 className="text-xl font-bold">Resultados</h1>

      {partidas.length === 0 ? (
        <p className="text-gray-400 text-sm">Nenhum jogo encerrado ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {partidas.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border p-4 flex flex-col gap-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>{p.fase}{p.grupo ? ` — Grupo ${p.grupo}` : ''}</span>
                <span>{formatarData(p.data_hora)}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm flex-1 text-right">{p.time_casa}</span>
                <span className="text-xl font-bold text-gray-800 w-20 text-center">
                  {p.placar_casa} × {p.placar_fora}
                </span>
                <span className="font-semibold text-sm flex-1">{p.time_fora}</span>
              </div>

              {p.palpite ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Seu palpite: {p.palpite.palpite_casa} × {p.palpite.palpite_fora}
                  </span>
                  {badgePontos(p.palpite.pontos)}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Sem palpite para este jogo.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
