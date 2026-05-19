'use client'

import { useEffect, useState } from 'react'

type Palpite = { palpite_casa: number; palpite_fora: number; pontos: number | null } | null
type Partida = {
  id: string; fase: string; grupo: string | null
  time_casa: string; time_fora: string; data_hora: string
  placar_casa: number | null; placar_fora: number | null
  encerrado: boolean; palpite: Palpite
}

function estaAberto(data_hora: string) {
  return Date.now() < new Date(data_hora).getTime() - 30 * 60 * 1000
}

function formatarData(data_hora: string) {
  return new Date(data_hora).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function CartaoPalpite({ partida }: { partida: Partida }) {
  const aberto = estaAberto(partida.data_hora)
  const [casa, setCasa] = useState(partida.palpite?.palpite_casa?.toString() ?? '')
  const [fora, setFora] = useState(partida.palpite?.palpite_fora?.toString() ?? '')
  const [salvando, setSalvando] = useState(false)
  const [feedback, setFeedback] = useState<'ok' | 'erro' | null>(null)

  async function salvar() {
    if (casa === '' || fora === '') return
    setSalvando(true)
    setFeedback(null)
    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: partida.id, palpite_casa: casa, palpite_fora: fora }),
    })
    setSalvando(false)
    setFeedback(res.ok ? 'ok' : 'erro')
    setTimeout(() => setFeedback(null), 2500)
  }

  const temPalpite = partida.palpite !== null

  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-3"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      {/* Cabeçalho */}
      <div className="flex justify-between items-center text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>{partida.fase}{partida.grupo ? ` · Grupo ${partida.grupo}` : ''}</span>
        <span>{formatarData(partida.data_hora)}</span>
      </div>

      {/* Times e placar/inputs */}
      <div className="flex items-center gap-3">
        <span className="font-semibold text-sm flex-1 text-right" style={{ color: 'var(--text)' }}>
          {partida.time_casa}
        </span>

        {partida.encerrado ? (
          <span className="text-xl font-bold w-20 text-center tabular-nums" style={{ color: 'var(--text)' }}>
            {partida.placar_casa} × {partida.placar_fora}
          </span>
        ) : (
          <div className="flex items-center gap-1.5 w-24 justify-center">
            <input
              type="number" min={0} max={99} value={casa}
              onChange={(e) => setCasa(e.target.value)}
              disabled={!aberto}
              className="w-10 h-10 text-center border rounded-xl text-base font-bold disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <span className="font-bold text-lg" style={{ color: 'var(--text-muted)' }}>×</span>
            <input
              type="number" min={0} max={99} value={fora}
              onChange={(e) => setFora(e.target.value)}
              disabled={!aberto}
              className="w-10 h-10 text-center border rounded-xl text-base font-bold disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
        )}

        <span className="font-semibold text-sm flex-1" style={{ color: 'var(--text)' }}>
          {partida.time_fora}
        </span>
      </div>

      {/* Rodapé */}
      {partida.encerrado && partida.palpite && (
        <div className="flex justify-between items-center pt-2 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <span>Palpite: {partida.palpite.palpite_casa} × {partida.palpite.palpite_fora}</span>
          <span className={`font-bold ${partida.palpite.pontos ? 'text-green-600 dark:text-green-400' : ''}`}>
            {partida.palpite.pontos ?? 0} pts
          </span>
        </div>
      )}

      {!partida.encerrado && aberto && (
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <button
              onClick={salvar}
              disabled={salvando || casa === '' || fora === ''}
              className="text-sm px-4 py-1.5 rounded-lg font-semibold text-white disabled:opacity-40 transition-colors"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {salvando ? 'Salvando...' : temPalpite ? 'Atualizar' : 'Salvar'}
            </button>
            {feedback === 'ok' && <span className="text-xs font-medium text-green-600 dark:text-green-400">✓ Salvo!</span>}
            {feedback === 'erro' && <span className="text-xs font-medium text-red-500">Erro ao salvar</span>}
          </div>
          {temPalpite && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Palpite atual: {partida.palpite!.palpite_casa} × {partida.palpite!.palpite_fora}
            </span>
          )}
        </div>
      )}

      {!partida.encerrado && !aberto && (
        <p className="text-xs pt-1" style={{ color: 'var(--text-muted)' }}>🔒 Palpites encerrados.</p>
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
      .then((data) => { if (data.erro) { setErro(data.erro); return }; setPartidas(data.partidas) })
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) return <div className="min-h-screen flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
  if (erro) return <div className="min-h-screen flex items-center justify-center text-sm text-red-500">{erro}</div>

  const abertas = partidas.filter((p) => !p.encerrado)
  const encerradas = partidas.filter((p) => p.encerrado)

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Palpites</h1>

      {partidas.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum jogo cadastrado ainda.</p>
      )}

      {abertas.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Próximos jogos
          </h2>
          {abertas.map((p) => <CartaoPalpite key={p.id} partida={p} />)}
        </section>
      )}

      {encerradas.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Encerrados
          </h2>
          {encerradas.map((p) => <CartaoPalpite key={p.id} partida={p} />)}
        </section>
      )}
    </div>
  )
}
