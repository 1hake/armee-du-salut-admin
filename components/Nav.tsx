'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/', label: 'Salles' },
  { href: '/equipe', label: 'Planning equipe' },
  { href: '/partenaires', label: 'Partenaires' },
  { href: '/stats', label: 'Statistiques' },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-border/60">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 h-12 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L4 6v5.5c0 .8.7 1.5 1.5 1.5h5c.8 0 1.5-.7 1.5-1.5V6L8 2z" fill="white" opacity="0.9"/>
              <path d="M7.25 5.5v2.25H5.5v1.5h1.75V11.5h1.5V9.25H10.5v-1.5H8.75V5.5h-1.5z" fill="#DC2626"/>
            </svg>
          </div>
          <span className="text-[13px] font-semibold tracking-tight hidden sm:inline">Armée du Salut</span>
        </Link>

        {/* Segmented control */}
        <div className="inline-flex bg-bg rounded-lg p-0.5 gap-0.5">
          {TABS.map((tab) => {
            const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-all ${
                  isActive
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
