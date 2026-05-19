'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'

const nav = [
  { href: '/',           label: 'Home',      icon: '🏠' },
  { href: '/palpites',   label: 'Palpites',  icon: '⚽' },
  { href: '/resultados', label: 'Resultados',icon: '📋' },
  { href: '/ranking',    label: 'Ranking',   icon: '🏆' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggle } = useTheme()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <header className="bg-green-700 dark:bg-green-900 text-white px-4 py-3 flex justify-between items-center shadow-md">
        <span className="font-bold text-lg tracking-tight">Bolão Copa 2026 🌍</span>
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="text-white/80 hover:text-white text-xl leading-none"
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={logout}
            className="text-sm text-green-200 hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 pb-24">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 border-t flex" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {nav.map((item) => {
          const ativa = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-3 text-xs gap-0.5 transition-colors font-medium ${
                ativa
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
