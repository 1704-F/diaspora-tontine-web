// ============================================
// LoginForm COMPLET avec workflow backend
// src/components/auth/LoginForm.tsx
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

// Schémas de validation
const phoneOtpSchema = z.object({
  phoneNumber: z.string()
    .min(10, 'Numéro de téléphone invalide')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Format de numéro invalide'),
  otpCode: z.string()
    .length(6, 'Le code OTP doit contenir 6 chiffres')
    .regex(/^\d{6}$/, 'Le code OTP ne doit contenir que des chiffres')
})

const setupPinSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  pin: z.string()
    .length(4, 'Le PIN doit contenir 4 chiffres')
    .regex(/^\d{4}$/, 'Le PIN ne doit contenir que des chiffres'),
  confirmPin: z.string()
}).refine((data) => data.pin === data.confirmPin, {
  message: "Les codes PIN ne correspondent pas",
  path: ["confirmPin"],
})

type PhoneOtpData = z.infer<typeof phoneOtpSchema>
type SetupPinData = z.infer<typeof setupPinSchema>

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [step, setStep] = useState<'module' | 'phone' | 'otp' | 'setup-pin'>('module')
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [newUser, setNewUser] = useState<any>(null)
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isSettingUpPin, setIsSettingUpPin] = useState(false)
  
  const router = useRouter()
  const { setUser, setToken } = useAuthStore()

  // Forms
  const phoneOtpForm = useForm<PhoneOtpData>({
    resolver: zodResolver(phoneOtpSchema)
  })

  const setupPinForm = useForm<SetupPinData>({
    resolver: zodResolver(setupPinSchema)
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
    const phone = phoneOtpForm.watch('phoneNumber')
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

  // Étape 2: Vérification OTP
  const onVerifyOtp = async (data: PhoneOtpData) => {
    setIsVerifyingOtp(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: data.phoneNumber,
          otp: data.otpCode
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        if (result.nextStep === 'setup_pin') {
          // Nouvel utilisateur - configuration PIN
          setNewUser(result.user)
          setStep('setup-pin')
          toast.success('Compte créé ! Configurez votre PIN')
        } else if (result.tokens) {
          // Utilisateur existant - connexion directe
          const token = result.tokens.accessToken
          
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(result.user))
          
          setUser(result.user)
          setToken(token)
          
          toast.success('Connexion réussie!')
          onSuccess?.()
          
          if (selectedModule && selectedModule !== 'general') {
            router.push(`/modules/${selectedModule}`)
          } else {
            router.push('/dashboard')
          }
        }
      } else {
        toast.error(result.error || 'Code OTP invalide')
      }
    } catch (error) {
      toast.error('Erreur de vérification')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  // Étape 3: Configuration PIN
  const onSetupPin = async (data: SetupPinData) => {
    if (!newUser) return

    setIsSettingUpPin(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/setup-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: newUser.phoneNumber,
          pin: data.pin,
          confirmPin: data.confirmPin,
          firstName: data.firstName,
          lastName: data.lastName
        })
      })
      
      const result = await response.json()
      
      if (result.success && result.tokens) {
        const token = result.tokens.accessToken
        
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(result.user))
        
        setUser(result.user)
        setToken(token)
        
        toast.success('Configuration terminée avec succès!')
        onSuccess?.()
        
        if (selectedModule && selectedModule !== 'general') {
          router.push(`/modules/${selectedModule}`)
        } else {
          router.push('/dashboard')
        }
      } else {
        toast.error(result.error || 'Erreur de configuration')
      }
    } catch (error) {
      toast.error('Erreur de configuration')
    } finally {
      setIsSettingUpPin(false)
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

      {/* Contenu selon l'étape */}
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

      {step === 'phone' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-medium text-gray-900">Numéro de téléphone</h3>
            <p className="text-sm text-gray-600 mt-1">
              Nous vous enverrons un code de vérification
            </p>
          </div>
          
          <Input
            {...phoneOtpForm.register('phoneNumber')}
            label="Numéro de téléphone"
            placeholder="+33 6 12 34 56 78"
            error={phoneOtpForm.formState.errors.phoneNumber?.message}
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

      {step === 'otp' && (
        <form onSubmit={phoneOtpForm.handleSubmit(onVerifyOtp)} className="space-y-4">
          <div className="text-center">
            <h3 className="font-medium text-gray-900">Code de vérification</h3>
            <p className="text-sm text-gray-600 mt-1">
              Code envoyé au {phoneNumber}
            </p>
          </div>

          <Input
            {...phoneOtpForm.register('otpCode')}
            label="Code à 6 chiffres"
            placeholder="123456"
            error={phoneOtpForm.formState.errors.otpCode?.message}
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
              loading={isVerifyingOtp}
              className="flex-1"
            >
              Vérifier
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

      {step === 'setup-pin' && (
        <form onSubmit={setupPinForm.handleSubmit(onSetupPin)} className="space-y-4">
          <div className="text-center">
            <h3 className="font-medium text-gray-900">Configuration du compte</h3>
            <p className="text-sm text-gray-600 mt-1">
              Finalisez votre inscription
            </p>
          </div>

          <Input
            {...setupPinForm.register('firstName')}
            label="Prénom"
            placeholder="John"
            error={setupPinForm.formState.errors.firstName?.message}
          />

          <Input
            {...setupPinForm.register('lastName')}
            label="Nom"
            placeholder="Doe"
            error={setupPinForm.formState.errors.lastName?.message}
          />

          <Input
            {...setupPinForm.register('pin')}
            label="Code PIN (4 chiffres)"
            type="password"
            placeholder="1234"
            maxLength={4}
            error={setupPinForm.formState.errors.pin?.message}
          />

          <Input
            {...setupPinForm.register('confirmPin')}
            label="Confirmer le code PIN"
            type="password"
            placeholder="1234"
            maxLength={4}
            error={setupPinForm.formState.errors.confirmPin?.message}
          />

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('otp')}
              className="flex-1"
            >
              Retour
            </Button>
            <Button
              type="submit"
              loading={isSettingUpPin}
              className="flex-1"
            >
              Finaliser
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}