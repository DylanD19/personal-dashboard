'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Trophy,
  Newspaper,
  TrendingUp,
  Calendar,
  CheckSquare2,
  Zap,
  LogOut,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, color: '#8b5cf6' },
  { href: '/sports', label: 'Sports', icon: Trophy, color: '#06b6d4' },
  { href: '/news', label: 'News & Markets', icon: Newspaper, color: '#f59e0b' },
  { href: '/financials', label: 'Financials', icon: TrendingUp, color: '#10b981' },
  { href: '/schedule', label: 'Schedule', icon: Calendar, color: '#818cf8' },
  { href: '/todos', label: 'To-Do', icon: CheckSquare2, color: '#f472b6' },
]

export default function Sidebar() {
  const path = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col z-50">
      <div className="px-5 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50 flex-shrink-0">
            <Zap size={15} className="text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-100 leading-none">Dylan&apos;s Hub</h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">Personal Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon, color }) => {
          const active = path === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                active
                  ? 'bg-white/[0.07] text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon
                size={17}
                style={active ? { color } : undefined}
                className={active ? '' : 'text-zinc-600 group-hover:text-zinc-400 transition-colors'}
              />
              <span>{label}</span>
              {active && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-zinc-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-all"
        >
          <LogOut size={17} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
