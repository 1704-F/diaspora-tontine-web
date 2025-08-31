// ============================================
// 3. LOGIN FORM COMPONENT (src/components/auth/LoginForm.tsx)
// ============================================
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ModuleSelector } from './ModuleSelector'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

const loginSchema = z.object({
  phoneNumber: z.string()
    .min(10, 'Numéro de téléphone invalide')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Format de numéro invalide'),
  otpCode: z.string()
    .length(6, 'Le code OTP doit contenir 6 chiffres')
    .regex(/^\d{6}$/, 'Le code OTP ne doit contenir que des chiffres')
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [step, setStep] = useState<'module' | 'phone' | 'otp'>('module')
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  
  const router = useRouter()
  const { login, isLoading } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const moduleOptions = [
    {
      id: 'associations' as const,
      label: 'Mon Association',
      description: 'Gérer ma participation associative',
      icon: '🏛️',
      recommended: true
    },
    {
      id: 'tontines' as const,
      label: 'Mes Tontines', 
      description: 'Épargne collective et solidarité',
      icon: '💰'
    },
    {
      id: 'family' as const,
      label: 'Budget Famille',
      description: 'Gestion financière familiale',
      icon: '👨‍👩‍👧‍👦',
      disabled: true,
      badge: 'Bientôt'
    },
    {
      id: 'commerce' as const,
      label: 'Commerce Diaspora',
      description: 'Marketplace communautaire',
      icon: '🏪',
      disabled: true,
      badge: 'Bientôt'
    },
    {
      id: 'general' as const,
      label: 'Accès Général',
      description: 'Vue d\'ensemble de tous mes modules',
      icon: '🌍'
    }
  ]

  // Étape 1: Demande OTP
  const requestOtp = async () => {
    const phone = watch('phoneNumber')
    if (!phone) {
      toast.error('Veuillez saisir votre numéro de téléphone')
      return
    }

    setIsRequestingOtp(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setPhoneNumber(phone)
        setStep('otp')
        toast.success('Code OTP envoyé par SMS')
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi du SMS')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setIsRequestingOtp(false)
    }
  }

  // Étape 2: Vérification OTP + Login
  const onSubmit = async (data: LoginFormData) => {
    const success = await login({
      phoneNumber: data.phoneNumber,
      otpCode: data.otpCode,
      module: selectedModule || undefined
    })

    if (success) {
      toast.success('Connexion réussie!')
      onSuccess?.()
      
      // Redirection selon module sélectionné
      if (selectedModule && selectedModule !== 'general') {
        router.push(`/modules/${selectedModule}`)
      } else {
        router.push('/dashboard')
      }
    } else {
      toast.error('Code OTP invalide ou expiré')
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* En-tête */}
      <div className="text-center">
        <div className="flex items-center justify-center w-12 h-12 bg-primary-500 rounded-full mx-auto mb-4">
          <span className="text-white font-bold text-xl">DT</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">DiasporaTontine</h1>
        <p className="text-gray-600 mt-2">Connectez-vous à votre espace</p>
      </div>

      {/* Étape 1: Sélection module */}
      {step === 'module' && (
        <div className="space-y-4">
          <ModuleSelector
            value={selectedModule}
            onChange={setSelectedModule}
            options={moduleOptions}
          />
          <Button
            className="w-full"
            onClick={() => setStep('phone')}
            disabled={!selectedModule}
          >
            Continuer
          </Button>
        </div>
      )}

      {/* Étape 2: Numéro de téléphone */}
      {step === 'phone' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-medium text-gray-900">Numéro de téléphone</h3>
            <p className="text-sm text-gray-600 mt-1">
              Nous vous enverrons un code de vérification
            </p>
          </div>
          
          <Input
            {...register('phoneNumber')}
            label="Numéro de téléphone"
            placeholder="+33 6 12 34 56 78"
            error={errors.phoneNumber?.message}
            autoFocus
          />
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setStep('module')}
              className="flex-1"
            >
              Retour
            </Button>
            <Button
              onClick={requestOtp}
              loading={isRequestingOtp}
              className="flex-1"
            >
              Envoyer le code
            </Button>
          </div>
        </div>
      )}

      {/* Étape 3: Code OTP */}
      {step === 'otp' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="text-center">
            <h3 className="font-medium text-gray-900">Code de vérification</h3>
            <p className="text-sm text-gray-600 mt-1">
              Code envoyé au {phoneNumber}
            </p>
          </div>

          <Input
            {...register('otpCode')}
            label="Code à 6 chiffres"
            placeholder="123456"
            error={errors.otpCode?.message}
            autoFocus
            maxLength={6}
          />

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('phone')}
              className="flex-1"
            >
              Retour
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              className="flex-1"
            >
              Se connecter
            </Button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-primary-600 hover:text-primary-700"
              onClick={() => {
                setStep('phone')
                toast.info('Vous pouvez redemander un nouveau code')
              }}
            >
              Renvoyer le code
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
