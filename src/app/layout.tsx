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

type Messages = Record<string, Record<string, string | Record<string, string>>>

async function getMessages(locale: string = 'fr'): Promise<Messages> {
  try {
    const [common, associations, roles, settings, createAssociation,editMember, memberDetails, members, sections] = await Promise.all([
      import(`../locales/${locale}/common.json`).then(m => m.default),
      import(`../locales/${locale}/associations.json`).then(m => m.default),
      import(`../locales/${locale}/roles.json`).then(m => m.default),
      import(`../locales/${locale}/settings.json`).then(m => m.default),
      import(`../locales/${locale}/create-association.json`).then(m => m.default),
      import(`../locales/${locale}/editMember.json`).then(m => m.default),
      import(`../locales/${locale}/member-details.json`).then(m => m.default),
      import(`../locales/${locale}/members.json`).then(m => m.default),
      import(`../locales/${locale}/sections.json`).then(m => m.default),
    ]);
    
    return {
      common,
      associations,
      roles,
      settings,
      createAssociation,
      editMember,
      memberDetails,
      members,
      sections,

    };
  } catch (error) {
    console.error('Erreur chargement messages i18n:', error);
    return {
      common: {},
      associations: {},
      roles: {},
      settings: {},
      createAssociation: {},
      editMember:{},
      memberDetails:{},
      members:{},
      sections:{}
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = 'fr';
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