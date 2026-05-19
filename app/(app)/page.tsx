'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Partida = {
  id: string
  time_casa: string
  time_fora: string
  data_hora: string
  fase: string
  grupo: string | null
}

type Participante = {
  user_id: string
  nome: string
  pontos: number
  voce: boolean
}

type Stats = {
  nome: string
  posicao: number
  pontos: number
  total_palpites: number
}

const medalhas = ['🥇', '🥈', '🥉']

function tempoAteJogo(data_hora: string): string {
  const diff = new Date(data_hora).getTime() - Date.now()
  if (diff <= 0) return 'Em breve'
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(h / 24)
  if (d > 0) return `em ${d}d ${h % 24}h`
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (h > 0) return `em ${h}h ${m}min`
  return `em ${m}min`
}

function formatarDataCurta(data_hora: string): string {
  return new Date(data_hora).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function HomePage() {
  const router = useRouter()
  const [proximos, setProximos] = useState<Partida[]>([])
  const [ranking, setRanking] = useState<Participante[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    fetch('/api/home')
      .then((r) => r.json())
      .then((data) => {
        if (data.erro === 'sem_grupo') { router.push('/grupo'); return }
        if (data.erro) return
        setProximos(data.proximos)
        setRanking(data.ranking)
        setStats(data.stats)
      })
      .finally(() => setCarregando(false))
  }, [router])

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
        Carregando...
      </div>
    )
  }

  const top3 = ranking.slice(0, 3)
  const userIdx = ranking.findIndex((r) => r.voce)
  const userFora = userIdx >= 3

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
      {/* Saudação */}
      {stats && (
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            Olá, {stats.nome.split(' ')[0]}! 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Bem-vindo ao Bolão Copa 2026
          </p>
        </div>
      )}

      {/* Cards de stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Posição', valor: stats.posicao > 0 ? `${stats.posicao}°` : '—' },
            { label: 'Pontos', valor: stats.pontos },
            { label: 'Palpites', valor: stats.total_palpites },
          ].map(({ label, valor }) => (
            <div
              key={label}
              className="rounded-2xl p-4 flex flex-col items-center gap-1 border"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">{valor}</span>
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Próximos jogos */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-sm uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Próximos jogos
          </h2>
          <Link href="/palpites" className="text-xs text-green-600 dark:text-green-400 font-medium hover:underline">
            Ver todos →
          </Link>
        </div>

        {proximos.length === 0 ? (
          <div
            className="rounded-2xl border p-4 text-sm text-center"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Nenhum jogo agendado.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {proximos.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border p-4"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  <span>{p.fase}{p.grupo ? ` · Grupo ${p.grupo}` : ''}</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {tempoAteJogo(p.data_hora)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm flex-1 text-right" style={{ color: 'var(--text)' }}>
                    {p.time_casa}
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800" style={{ color: 'var(--text-muted)' }}>
                    {formatarDataCurta(p.data_hora)}
                  </span>
                  <span className="font-semibold text-sm flex-1" style={{ color: 'var(--text)' }}>
                    {p.time_fora}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Mini ranking */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-sm uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Ranking do grupo
          </h2>
          <Link href="/ranking" className="text-xs text-green-600 dark:text-green-400 font-medium hover:underline">
            Ver completo →
          </Link>
        </div>

        <div
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          {ranking.length === 0 ? (
            <p className="p-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              Nenhum palpite pontuado ainda.
            </p>
          ) : (
            <>
              {top3.map((p, i) => (
                <div
                  key={p.user_id}
                  className={`flex items-center px-4 py-3 gap-3 border-b ${p.voce ? 'bg-green-50 dark:bg-green-950/40' : ''}`}
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span className="text-lg w-7 text-center">{medalhas[i]}</span>
                  <span
                    className={`flex-1 text-sm ${p.voce ? 'font-bold text-green-700 dark:text-green-400' : ''}`}
                    style={!p.voce ? { color: 'var(--text)' } : undefined}
                  >
                    {p.nome}
                    {p.voce && <span className="text-xs font-normal text-green-500 ml-1">(você)</span>}
                  </span>
                  <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{p.pontos} pts</span>
                </div>
              ))}

              {/* Usuário fora do top 3 */}
              {userFora && (
                <>
                  <div className="flex items-center px-4 py-1 gap-3" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-xs w-7 text-center" style={{ color: 'var(--text-muted)' }}>…</span>
                  </div>
                  <div
                    className="flex items-center px-4 py-3 gap-3 bg-green-50 dark:bg-green-950/40"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span className="text-sm font-bold w-7 text-center text-green-600 dark:text-green-400">
                      {userIdx + 1}°
                    </span>
                    <span className="flex-1 text-sm font-bold text-green-700 dark:text-green-400">
                      {ranking[userIdx].nome}
                      <span className="text-xs font-normal text-green-500 ml-1">(você)</span>
                    </span>
                    <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                      {ranking[userIdx].pontos} pts
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
