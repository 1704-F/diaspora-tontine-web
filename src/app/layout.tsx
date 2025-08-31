// ============================================
// 10. LAYOUT ROOT MISE À JOUR (src/app/layout.tsx)
// ============================================
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DiasporaTontine - Gestion Association & Tontines',
  description: 'Plateforme de gestion pour associations diaspora et tontines communautaires',
  keywords: 'diaspora, tontine, association, épargne, communauté, finance',
  authors: [{ name: 'DiasporaTontine Team' }],
  openGraph: {
    title: 'DiasporaTontine',
    description: 'La super-app financière pour les communautés diaspora',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.className} h-full bg-white antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
    