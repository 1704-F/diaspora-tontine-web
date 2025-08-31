// ============================================
// 2. MODULE SELECTOR COMPONENT (src/components/auth/ModuleSelector.tsx)
// ============================================
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface ModuleOption {
  id: 'associations' | 'tontines' | 'family' | 'commerce' | 'general'
  label: string
  description: string
  icon: string
  disabled?: boolean
  badge?: string
  recommended?: boolean
}

interface ModuleSelectorProps {
  value: string | null
  onChange: (value: string) => void
  options: ModuleOption[]
}

export function ModuleSelector({ value, onChange, options }: ModuleSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Me connecter pour...</h3>
        <p className="text-sm text-gray-600 mt-1">Choisissez votre contexte de connexion</p>
      </div>
      
      <div className="grid gap-3">
        {options.map((option) => (
          <Card
            key={option.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              value === option.id && "ring-2 ring-primary-500 shadow-md",
              option.disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !option.disabled && onChange(option.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{option.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{option.label}</h4>
                    {option.badge && (
                      <Badge variant={option.badge === 'Nouveau' ? 'success' : 'secondary'} className="text-xs">
                        {option.badge}
                      </Badge>
                    )}
                    {option.recommended && (
                      <Badge variant="default" className="text-xs">
                        Recommandé
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                </div>
                {value === option.id && (
                  <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}