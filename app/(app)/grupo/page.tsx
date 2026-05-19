'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GrupoPage() {
  const router = useRouter()
  const [aba, setAba] = useState<'criar' | 'entrar'>('entrar')
  const [nome, setNome] = useState('')
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

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
    router.push('/palpites')
  }

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
    router.push('/palpites')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Bolão Copa 2026</h1>

        <div className="flex rounded-lg overflow-hidden border mb-6">
          <button
            onClick={() => { setAba('entrar'); setErro('') }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${aba === 'entrar' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Entrar no grupo
          </button>
          <button
            onClick={() => { setAba('criar'); setErro('') }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${aba === 'criar' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Criar grupo
          </button>
        </div>

        {aba === 'entrar' ? (
          <form onSubmit={handleEntrar} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Código do grupo (ex: AB12CD)"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              required
              maxLength={6}
              className="border rounded-lg px-4 py-2 uppercase tracking-widest text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {erro && <p className="text-red-500 text-sm">{erro}</p>}
            <button
              type="submit"
              disabled={carregando}
              className="bg-green-600 text-white rounded-lg py-2 font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCriar} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Nome do grupo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {erro && <p className="text-red-500 text-sm">{erro}</p>}
            <button
              type="submit"
              disabled={carregando}
              className="bg-green-600 text-white rounded-lg py-2 font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {carregando ? 'Criando...' : 'Criar grupo'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
