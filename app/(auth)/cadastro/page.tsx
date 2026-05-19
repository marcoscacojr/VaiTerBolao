'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CadastroPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const res = await fetch('/api/auth/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha }),
    })

    const data = await res.json()
    setCarregando(false)

    if (!res.ok) { setErro(data.erro); return }
    router.push('/grupo')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div
        className="w-full max-w-sm rounded-3xl border p-8 shadow-sm"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🌍</div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Criar conta</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Entre no Bolão Copa 2026</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { label: 'Nome', type: 'text', value: nome, set: setNome, placeholder: 'Seu nome completo' },
            { label: 'E-mail', type: 'email', value: email, set: setEmail, placeholder: 'seu@email.com' },
            { label: 'Senha', type: 'password', value: senha, set: setSenha, placeholder: '••••••••' },
          ].map(({ label, type, value, set, placeholder }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => set(e.target.value)}
                required
                minLength={type === 'password' ? 6 : undefined}
                className="border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
          ))}

          {erro && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
              <p className="text-red-600 dark:text-red-400 text-sm">{erro}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="mt-1 py-2.5 rounded-xl font-semibold text-white text-sm transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {carregando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          Já tem conta?{' '}
          <Link href="/login" className="font-semibold text-green-600 dark:text-green-400 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
