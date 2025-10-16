// src/app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { NextIntlClientProvider } from 'next-intl'
import { useState } from 'react'
import { Toaster } from 'sonner'

type Messages = Record<string, Record<string, string | Record<string, string>>>

interface ProvidersProps {
  children: React.ReactNode
  locale: string
  messages: Messages
  timeZone?: string
}

export function Providers({ 
  children, 
  locale, 
  messages,
  timeZone = 'Europe/Paris'
}: ProvidersProps) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          retry: 1,
        },
      },
    })
  )

  return (
    <NextIntlClientProvider 
      locale={locale} 
      messages={messages}
      timeZone={timeZone}
    >
      <QueryClientProvider client={queryClient}>
        {children}
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
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </NextIntlClientProvider>
  )
}