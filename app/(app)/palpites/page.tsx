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
  placar_casa: number | null
  placar_fora: number | null
  encerrado: boolean
  palpite: Palpite
}

function estaAberto(data_hora: string): boolean {
  return Date.now() < new Date(data_hora).getTime() - 30 * 60 * 1000
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

function CartaoPalpite({ partida }: { partida: Partida }) {
  const aberto = estaAberto(partida.data_hora)
  const [casa, setCasa] = useState(partida.palpite?.palpite_casa?.toString() ?? '')
  const [fora, setFora] = useState(partida.palpite?.palpite_fora?.toString() ?? '')
  const [salvando, setSalvando] = useState(false)
  const [feedback, setFeedback] = useState('')

  async function salvar() {
    if (casa === '' || fora === '') return
    setSalvando(true)
    setFeedback('')

    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: partida.id, palpite_casa: casa, palpite_fora: fora }),
    })

    setSalvando(false)
    setFeedback(res.ok ? 'Salvo!' : 'Erro ao salvar.')
    setTimeout(() => setFeedback(''), 2000)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>{partida.fase}{partida.grupo ? ` — Grupo ${partida.grupo}` : ''}</span>
        <span>{formatarData(partida.data_hora)}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-sm flex-1 text-right">{partida.time_casa}</span>

        {partida.encerrado ? (
          <span className="text-lg font-bold text-gray-700 w-16 text-center">
            {partida.placar_casa} × {partida.placar_fora}
          </span>
        ) : (
          <div className="flex items-center gap-1 w-24 justify-center">
            <input
              type="number"
              min={0}
              max={99}
              value={casa}
              onChange={(e) => setCasa(e.target.value)}
              disabled={!aberto}
              className="w-9 h-9 text-center border rounded-lg text-sm font-bold disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <span className="text-gray-400 font-bold">×</span>
            <input
              type="number"
              min={0}
              max={99}
              value={fora}
              onChange={(e) => setFora(e.target.value)}
              disabled={!aberto}
              className="w-9 h-9 text-center border rounded-lg text-sm font-bold disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        )}

        <span className="font-semibold text-sm flex-1">{partida.time_fora}</span>
      </div>

      {partida.encerrado && partida.palpite && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">
            Seu palpite: {partida.palpite.palpite_casa} × {partida.palpite.palpite_fora}
          </span>
          <span className={`font-bold ${partida.palpite.pontos ? 'text-green-600' : 'text-gray-400'}`}>
            {partida.palpite.pontos ?? 0} pts
          </span>
        </div>
      )}

      {!partida.encerrado && aberto && (
        <div className="flex items-center justify-between">
          <button
            onClick={salvar}
            disabled={salvando || casa === '' || fora === ''}
            className="bg-green-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-40"
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
          {feedback && (
            <span className={`text-xs ${feedback === 'Salvo!' ? 'text-green-600' : 'text-red-500'}`}>
              {feedback}
            </span>
          )}
        </div>
      )}

      {!partida.encerrado && !aberto && (
        <p className="text-xs text-gray-400">Palpites encerrados.</p>
      )}
    </div>
  )
}

export default function PalpitesPage() {
  const [partidas, setPartidas] = useState<Partida[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch('/api/matches')
      .then((r) => r.json())
      .then((data) => {
        if (data.erro) { setErro(data.erro); return }
        setPartidas(data.partidas)
      })
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) return <div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>
  if (erro) return <div className="min-h-screen flex items-center justify-center text-red-500">{erro}</div>

  const abertas = partidas.filter((p) => !p.encerrado)
  const encerradas = partidas.filter((p) => p.encerrado)

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
      <h1 className="text-xl font-bold">Palpites</h1>

      {abertas.length === 0 && encerradas.length === 0 && (
        <p className="text-gray-400 text-sm">Nenhum jogo cadastrado ainda.</p>
      )}

      {abertas.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Próximos jogos</h2>
          {abertas.map((p) => <CartaoPalpite key={p.id} partida={p} />)}
        </section>
      )}

      {encerradas.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Encerrados</h2>
          {encerradas.map((p) => <CartaoPalpite key={p.id} partida={p} />)}
        </section>
      )}
    </div>
  )
}
