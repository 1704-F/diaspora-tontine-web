// ============================================
// 1. MISE À JOUR PROVIDERS (src/app/providers.tsx)
// ============================================
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
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
  )
}