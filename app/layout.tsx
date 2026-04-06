import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { NavWrapper } from '@/components/NavWrapper'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Armee du Salut",
  description: 'Planning et gestion',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Planning',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FFFFFF',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className="bg-bg text-ink font-display antialiased min-h-screen">
        <NavWrapper />
        <main className="pb-[72px] md:pb-0">{children}</main>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
