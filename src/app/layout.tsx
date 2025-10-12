// src/app/layout.tsx
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

// Charger les messages i18n
async function getMessages(locale: string = 'fr') {
  try {
    // Charger tous les fichiers de traduction
    const [common, associations] = await Promise.all([
      import(`../locales/${locale}/common.json`).then(m => m.default).catch(() => ({})),
      import(`../locales/${locale}/associations.json`).then(m => m.default).catch(() => ({}))
    ]);
    
    // ✅ Retourner les messages à plat (sans namespace imbriqué)
    return {
      ...common,
      ...associations
    };
  } catch (error) {
    console.error('Erreur chargement messages i18n:', error);
    return {};
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = 'fr'; // Pour l'instant, français par défaut
  const messages = await getMessages(locale);

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