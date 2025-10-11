// src/app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { NextIntlClientProvider } from 'next-intl'
import { useState } from 'react'
import { Toaster } from 'sonner'

// 🌐 Type pour les messages i18n
type Messages = Record<string, Record<string, string | Record<string, string>>>

interface ProvidersProps {
  children: React.ReactNode
  locale?: string
  messages?: Messages
}

export function Providers({ children, locale = 'fr', messages = {} }: ProvidersProps) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          retry: 1,
        },
      },
    })
  )

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* 🍞 Sonner Toast Provider */}
        <Toaster 
          position="top-right"
          closeButton
          richColors
          theme="light"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'white',
              color: '#0a0a0a',
              border: '1px solid #e5e5e5',
            },
          }}
        />
        {/* React Query DevTools */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </NextIntlClientProvider>
  )
}