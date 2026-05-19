'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function GrupoPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [aba, setAba] = useState<'entrar' | 'criar'>('entrar')
  const [nome, setNome] = useState('')
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((data) => { if (data.is_admin) setIsAdmin(true) })
  }, [])

  async function handleEntrar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const res = await fetch('/api/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo }),
    })
    const data = await res.json()
    setCarregando(false)
    if (!res.ok) { setErro(data.erro); return }
    router.push('/')
  }

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    })
    const data = await res.json()
    setCarregando(false)
    if (!res.ok) { setErro(data.erro); return }
    router.push('/')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div
        className="w-full max-w-sm rounded-3xl border p-8 shadow-sm"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👥</div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Seu grupo</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {isAdmin ? 'Entre em um grupo ou crie o seu' : 'Entre no grupo com o código recebido'}
          </p>
        </div>

        {/* Tabs — aba de criar só aparece para admin */}
        {isAdmin && (
          <div className="flex rounded-xl overflow-hidden border mb-6" style={{ borderColor: 'var(--border)' }}>
            {(['entrar', 'criar'] as const).map((a) => (
              <button
                key={a}
                onClick={() => { setAba(a); setErro('') }}
                className="flex-1 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: aba === a ? 'var(--accent)' : 'transparent',
                  color: aba === a ? '#fff' : 'var(--text-muted)',
                }}
              >
                {a === 'entrar' ? 'Entrar no grupo' : 'Criar grupo'}
              </button>
            ))}
          </div>
        )}

        {aba === 'entrar' || !isAdmin ? (
          <form onSubmit={handleEntrar} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Código do grupo</label>
              <input
                type="text"
                placeholder="AB12CD"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                required
                maxLength={6}
                className="border rounded-xl px-4 py-3 uppercase tracking-[0.3em] text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
            {erro && <p className="text-sm text-red-500 dark:text-red-400">{erro}</p>}
            <button
              type="submit"
              disabled={carregando}
              className="py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCriar} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Nome do grupo</label>
              <input
                type="text"
                placeholder="Ex: Bolão do Trabalho"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                maxLength={80}
                className="border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
            {erro && <p className="text-sm text-red-500 dark:text-red-400">{erro}</p>}
            <button
              type="submit"
              disabled={carregando}
              className="py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {carregando ? 'Criando...' : 'Criar grupo'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
