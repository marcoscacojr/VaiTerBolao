'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const nav = [
  { href: '/palpites', label: 'Palpites', icon: '⚽' },
  { href: '/resultados', label: 'Resultados', icon: '📋' },
  { href: '/ranking', label: 'Ranking', icon: '🏆' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-green-700 text-white px-4 py-3 flex justify-between items-center">
        <span className="font-bold text-lg">Bolão Copa 2026</span>
        <button onClick={logout} className="text-sm text-green-200 hover:text-white">
          Sair
        </button>
      </header>

      <main className="flex-1 pb-20">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex">
        {nav.map((item) => {
          const ativa = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${
                ativa ? 'text-green-600 font-semibold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
