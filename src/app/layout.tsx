import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { getMessages } from 'next-intl/server'

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = 'fr'
  const messages = await getMessages()

  return (
    <html lang={locale} className="h-full">
      <body className={`${inter.className} h-full bg-white antialiased`}>
        <Providers locale={locale} messages={messages} timeZone="Europe/Paris">
          {children}
        </Providers>
      </body>
    </html>
  )
}