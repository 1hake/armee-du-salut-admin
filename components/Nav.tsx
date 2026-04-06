'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/server/auth'

interface Tab { href: string; label: string; icon?: React.ReactNode }

const ADMIN_TABS: Tab[] = [
  { href: '/', label: 'Salles' },
  { href: '/equipe/planning', label: "Planning d'equipe" },
  { href: '/equipe', label: 'Creer planning' },
  { href: '/partenaires', label: 'Partenaires' },
  { href: '/stats', label: 'Statistiques' },
  { href: '/admin/users', label: 'Comptes' },
]

const EMPLOYEE_TABS: Tab[] = [
  { href: '/profil', label: 'Mon planning', icon: <IconCalendar /> },
]

interface Props { role: string; username: string }

export function Nav({ role, username }: Props) {
  const pathname = usePathname()
  const isAdmin = role === 'admin'
  const tabs = isAdmin ? ADMIN_TABS : EMPLOYEE_TABS

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    if (href === '/equipe') return pathname === '/equipe'
    return pathname.startsWith(href)
  }

  // Employee gets a simple top header + bottom tab bar on mobile
  if (!isAdmin) {
    return (
      <>
        {/* Top header */}
        <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md safe-top">
          <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-red flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="6.5" y="3" width="3" height="10" rx="0.5" fill="white"/>
                  <rect x="3" y="6.5" width="10" height="3" rx="0.5" fill="white"/>
                </svg>
              </div>
              <span className="text-[14px] font-semibold text-ink">Mon planning</span>
            </div>
            <button
              onClick={() => logout()}
              className="text-[13px] text-muted hover:text-ink transition-colors px-2 py-1"
            >
              Deconnexion
            </button>
          </div>
        </header>
      </>
    )
  }

  // Admin: Notion-style top nav
  return (
    <nav className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border">
      <div className="max-w-[1200px] mx-auto px-4 h-11 flex items-center gap-1">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-3">
          <div className="w-5 h-5 rounded bg-red flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <rect x="6.5" y="3" width="3" height="10" rx="0.5" fill="white"/>
              <rect x="3" y="6.5" width="10" height="3" rx="0.5" fill="white"/>
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-ink hidden sm:inline">Armee du Salut</span>
        </Link>

        {/* Tab links */}
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-2.5 py-1 text-[13px] rounded-md transition-colors whitespace-nowrap ${
                isActive(tab.href)
                  ? 'bg-border text-ink font-medium'
                  : 'text-muted hover:bg-surface-hover hover:text-ink'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="flex-1" />

        {/* User */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[12px] text-muted hidden sm:inline">{username}</span>
          <button
            onClick={() => logout()}
            className="text-[12px] text-muted hover:text-ink transition-colors px-1.5 py-0.5 rounded hover:bg-surface-hover"
          >
            Deconnexion
          </button>
        </div>
      </div>
    </nav>
  )
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <path d="M3 8h14" />
      <path d="M7 2v3M13 2v3" />
    </svg>
  )
}
