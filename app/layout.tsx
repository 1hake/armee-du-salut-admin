import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Nav } from '@/components/Nav'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Plan d'occupation des salles",
  description: 'Planning des réservations de salles',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="bg-bg text-ink font-display antialiased min-h-screen">
        <Nav />
        {children}
      </body>
    </html>
  )
}
