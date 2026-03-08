import type { Metadata } from 'next'
import { Syne, DM_Mono } from 'next/font/google'
import { Nav } from '@/components/Nav'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmMono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Plan d'occupation des salles",
  description: 'Planning des réservations de salles',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${syne.variable} ${dmMono.variable}`}>
      <body className="bg-bg text-ink font-mono antialiased min-h-screen">
        <Nav />
        {children}
      </body>
    </html>
  )
}
