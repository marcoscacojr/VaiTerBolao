'use client'

import { useEffect, useState } from 'react'

type Palpite = { palpite_casa: number; palpite_fora: number; pontos: number | null } | null
type Partida = {
  id: string; fase: string; grupo: string | null
  time_casa: string; time_fora: string; data_hora: string
  placar_casa: number; placar_fora: number; encerrado: boolean; palpite: Palpite
}

function BadgePontos({ pontos }: { pontos: number | null }) {
  if (pontos === 10) return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400">Placar exato · 10 pts</span>
  if (pontos === 5)  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">Vencedor certo · 5 pts</span>
  if (pontos === 3)  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-400">Empate certo · 3 pts</span>
  if (pontos === 0)  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">Errou · 0 pts</span>
  return null
}

function formatarData(data_hora: string) {
  return new Date(data_hora).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
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

  if (carregando) return <div className="min-h-screen flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
  if (erro) return <div className="min-h-screen flex items-center justify-center text-sm text-red-500">{erro}</div>

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Resultados</h1>

      {partidas.length === 0 ? (
        <div
          className="rounded-2xl border p-6 text-center text-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          Nenhum jogo encerrado ainda.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {partidas.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border p-4 flex flex-col gap-3"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>{p.fase}{p.grupo ? ` · Grupo ${p.grupo}` : ''}</span>
                <span>{formatarData(p.data_hora)}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm flex-1 text-right" style={{ color: 'var(--text)' }}>{p.time_casa}</span>
                <span
                  className="text-2xl font-bold w-24 text-center tabular-nums"
                  style={{ color: 'var(--text)' }}
                >
                  {p.placar_casa} × {p.placar_fora}
                </span>
                <span className="font-semibold text-sm flex-1" style={{ color: 'var(--text)' }}>{p.time_fora}</span>
              </div>

              <div
                className="flex items-center justify-between pt-2 border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                {p.palpite ? (
                  <>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Palpite: {p.palpite.palpite_casa} × {p.palpite.palpite_fora}
                    </span>
                    <BadgePontos pontos={p.palpite.pontos} />
                  </>
                ) : (
                  <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Sem palpite neste jogo.</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
