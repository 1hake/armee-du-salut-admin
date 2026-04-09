'use client'

import { useState } from 'react'
import { login } from '@/server/auth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(username, password)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-[340px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-red flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <rect x="6.5" y="3" width="3" height="10" rx="0.5" fill="white"/>
              <rect x="3" y="6.5" width="10" height="3" rx="0.5" fill="white"/>
            </svg>
          </div>
        </div>

        <h1 className="text-[22px] font-bold text-center mb-1">Connexion</h1>
        <p className="text-[14px] text-muted text-center mb-8">Armée du Salut — Administration</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Identifiant"
              className="w-full h-10 px-3 text-[14px] rounded-md border border-border-strong bg-bg placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full h-10 px-3 text-[14px] rounded-md border border-border-strong bg-bg placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-[13px] text-red bg-red-light rounded-md px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 text-[14px] font-medium rounded-md bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
