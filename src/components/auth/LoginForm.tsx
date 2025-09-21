// ============================================
// LoginForm COMPLET - Layout Horizontal Optimisé
// src/components/auth/LoginForm.tsx
// ============================================
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

// Schémas de validation
const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, "Numéro de téléphone invalide")
    .regex(/^\+?[1-9]\d{1,14}$/, "Format de numéro invalide"),
});

const otpSchema = z.object({
  otpCode: z
    .string()
    .length(6, "Le code OTP doit contenir 6 chiffres")
    .regex(/^\d{6}$/, "Le code OTP ne doit contenir que des chiffres"),
});

const pinSchema = z.object({
  pin: z
    .string()
    .length(4, "Le PIN doit contenir 4 chiffres")
    .regex(/^\d{4}$/, "Le PIN ne doit contenir que des chiffres"),
});

const setupPinSchema = z
  .object({
    firstName: z.string().min(2, "Prénom requis"),
    lastName: z.string().min(2, "Nom requis"),
    email: z.string().email("Email invalide").or(z.literal("")),
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    pin: z
      .string()
      .length(4, "Le PIN doit contenir 4 chiffres")
      .regex(/^\d{4}$/, "Le PIN ne doit contenir que des chiffres"),
    confirmPin: z.string(),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "Les codes PIN ne correspondent pas",
    path: ["confirmPin"],
  });

type PhoneData = z.infer<typeof phoneSchema>;
type OtpData = z.infer<typeof otpSchema>;
type PinData = z.infer<typeof pinSchema>;
type SetupPinData = z.infer<typeof setupPinSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [step, setStep] = useState<"phone" | "pin" | "otp" | "setup-profile" | "setup-pin">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newUser, setNewUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [existingDataSources, setExistingDataSources] = useState<any[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null); // Stocker les données du profil

  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  // Forms séparés
  const phoneForm = useForm<PhoneData>({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm<OtpData>({ resolver: zodResolver(otpSchema) });
  const pinForm = useForm<PinData>({ resolver: zodResolver(pinSchema) });
  const profileForm = useForm<{
    firstName: string;
    lastName: string;
    email?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
  }>({
    resolver: zodResolver(z.object({
      firstName: z.string().min(2, "Prénom requis"),
      lastName: z.string().min(2, "Nom requis"),
      email: z.string().email("Email invalide").or(z.literal("")),
      dateOfBirth: z.string().optional(),
      gender: z.string().optional(),
      address: z.string().optional(),
    }))
  });
  const setupPinForm = useForm<SetupPinData>({
    resolver: zodResolver(setupPinSchema),
  });

  // Fonction utilitaire de redirection après succès
  const handleLoginSuccess = (user: any, token: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);
    setToken(token);

    toast.success("Connexion réussie!");
    onSuccess?.();

    // Toujours rediriger vers le dashboard
    router.push("/dashboard");
  };

  // Fonction pour récupérer les valeurs pré-remplies des données existantes
  const getPrefilledValue = (fieldName: string) => {
    if (existingDataSources.length === 0) return '';
    
    // Prendre la première source (plus prioritaire)
    const firstSource = existingDataSources[0];
    
    switch (fieldName) {
      case 'firstName':
        return firstSource.data?.firstName || '';
      case 'lastName':
        return firstSource.data?.lastName || '';
      case 'email':
        return firstSource.data?.email || '';
      case 'dateOfBirth':
        // Formatter la date pour l'input date (YYYY-MM-DD)
        if (firstSource.data?.dateOfBirth) {
          const date = new Date(firstSource.data.dateOfBirth);
          return date.toISOString().split('T')[0];
        }
        return '';
      case 'gender':
        return firstSource.data?.gender || '';
      case 'address':
        // Combiner adresse, ville, pays si disponibles
        const parts = [
          firstSource.data?.address,
          firstSource.data?.city,
          firstSource.data?.country
        ].filter(Boolean);
        return parts.join(', ');
      default:
        return '';
    }
  };

  // Fonction pour ignorer les données existantes
  const handleIgnoreExistingData = () => {
    // Vider les données existantes
    setExistingDataSources([]);
    setSelectedDataSource(null);
    
    // Reset le formulaire
    profileForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '',
      gender: '',
      address: ''
    });
    
    toast.info("Données ignorées, vous pouvez repartir à zéro");
  };

  // Nouvelle fonction: Sauvegarder le profil et passer au PIN
  const saveProfile = async (data: any) => {
    setProfileData(data);
    setStep("setup-pin");
    toast.success("Profil sauvegardé ! Créez maintenant votre code PIN.");
  };

  // Étape 1: Vérifier si utilisateur existe et a un PIN
  const checkUser = async (data: PhoneData) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/check-user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: data.phoneNumber }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setPhoneNumber(data.phoneNumber);

        if (result.hasPIN) {
          // Utilisateur avec PIN → demander PIN
          setStep("pin");
        } else {
          // Nouvel utilisateur ou sans PIN → demander OTP
          await requestOtp(data.phoneNumber);
        }
      } else {
        toast.error(result.error || "Erreur de vérification");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 2a: Demander OTP (pour nouveaux utilisateurs)
  const requestOtp = async (phone: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/request-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: phone }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setStep("otp");
        toast.success("Code OTP envoyé par SMS");
      } else {
        toast.error(data.error || "Erreur lors de l'envoi du SMS");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    }
  };

  // Étape 2b: Connexion avec PIN (utilisateurs existants)
  const loginWithPin = async (data: PinData) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login-pin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: phoneNumber,
            pin: data.pin,
          }),
        }
      );

      const result = await response.json();

      if (result.success && result.tokens) {
        handleLoginSuccess(result.user, result.tokens.accessToken);
      } else {
        toast.error(result.error || "PIN incorrect");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 3: Vérification OTP
  const verifyOtp = async (data: OtpData) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: phoneNumber,
            otp: data.otpCode,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setNewUser(result.user);

        // Vérifier s'il y a des données existantes
        if (result.existingData?.found && result.existingData?.sources?.length > 0) {
          setExistingDataSources(result.existingData.sources);
          setStep("setup-profile");
          toast.success("Données existantes trouvées et pré-remplies !");
        } else if (result.nextStep === "setup_pin") {
          setStep("setup-profile");
          toast.success("Compte créé !");
        } else {
          // Connexion réussie directe
          if (result.tokens) {
            handleLoginSuccess(result.user, result.tokens.accessToken);
          }
        }
      } else {
        toast.error(result.error || "Code OTP incorrect");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 4: Configuration PIN final
  const setupPin = async (data: { pin: string; confirmPin: string }) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/setup-pin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: phoneNumber,
            pin: data.pin,
            confirmPin: data.confirmPin,
            // Utiliser les données du profil sauvegardées
            firstName: profileData?.firstName,
            lastName: profileData?.lastName,
            email: profileData?.email || null,
            dateOfBirth: profileData?.dateOfBirth || null,
            gender: profileData?.gender || null,
            address: profileData?.address || null,
            // Indiquer si on utilise des données existantes
            selectedDataSource: existingDataSources.length > 0 ? existingDataSources[0] : null
          }),
        }
      );

      const result = await response.json();

      if (result.success && result.tokens) {
        handleLoginSuccess(result.user, result.tokens.accessToken);
        toast.success("Compte créé avec succès !");
      } else {
        toast.error(result.error || "Erreur lors de la création du compte");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Container principal avec largeur plus généreuse */}
      <div className={`w-full bg-white rounded-lg shadow-sm border p-6 ${
        step === "setup-profile" || step === "setup-pin" ? "max-w-lg" : "max-w-md"
      }`}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 bg-primary-500 rounded-full mx-auto mb-4">
            <span className="text-white font-bold text-xl">DT</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DiasporaTontine</h1>
          <p className="text-gray-600 mt-2">Connectez-vous à votre espace</p>
        </div>

        {/* Étape 1: Numéro de téléphone */}
        {step === "phone" && (
          <form
            onSubmit={phoneForm.handleSubmit(checkUser)}
            className="space-y-4"
          >
            <div className="text-center">
              <h3 className="font-medium text-gray-900">Connexion</h3>
              <p className="text-sm text-gray-600 mt-1">
                Saisissez votre numéro de téléphone
              </p>
            </div>

            <Input
              {...phoneForm.register("phoneNumber")}
              label="Numéro de téléphone"
              placeholder="+33 6 12 34 56 78"
              error={phoneForm.formState.errors.phoneNumber?.message}
              autoFocus
            />

            <Button type="submit" loading={isLoading} className="w-full">
              Continuer
            </Button>
          </form>
        )}

        {/* Étape 2a: Saisie PIN (utilisateurs existants) */}
        {step === "pin" && (
          <form
            onSubmit={pinForm.handleSubmit(loginWithPin)}
            className="space-y-4"
          >
            <div className="text-center">
              <h3 className="font-medium text-gray-900">Code PIN</h3>
              <p className="text-sm text-gray-600 mt-1">
                Saisissez votre code PIN à 4 chiffres
              </p>
            </div>

            <Input
              {...pinForm.register("pin")}
              label="Code PIN"
              type="password"
              placeholder="••••"
              maxLength={4}
              error={pinForm.formState.errors.pin?.message}
              autoFocus
            />

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep("phone")}
                className="flex-1"
              >
                Retour
              </Button>
              <Button type="submit" loading={isLoading} className="flex-1">
                Se connecter
              </Button>
            </div>
          </form>
        )}

        {/* Étape 2b: Vérification OTP */}
        {step === "otp" && (
          <form
            onSubmit={otpForm.handleSubmit(verifyOtp)}
            className="space-y-4"
          >
            <div className="text-center">
              <h3 className="font-medium text-gray-900">Code de vérification</h3>
              <p className="text-sm text-gray-600 mt-1">
                Saisissez le code reçu par SMS au {phoneNumber}
              </p>
            </div>

            <Input
              {...otpForm.register("otpCode")}
              label="Code OTP"
              placeholder="123456"
              maxLength={6}
              error={otpForm.formState.errors.otpCode?.message}
              autoFocus
            />

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep("phone")}
                className="flex-1"
              >
                Retour
              </Button>
              <Button type="submit" loading={isLoading} className="flex-1">
                Vérifier
              </Button>
            </div>
          </form>
        )}

        {/* Étape 3: Configuration Profil */}
        {step === "setup-profile" && (
          <form
            onSubmit={profileForm.handleSubmit(saveProfile)}
            className="space-y-4"
          >
            {/* Header du formulaire */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">Vos informations</h3>
              {existingDataSources.length > 0 ? (
                <div className="space-y-2 mt-3">
                  <p className="text-sm text-green-600 font-medium">
                    Nous vous connaissons déjà !
                  </p>
                  <p className="text-xs text-gray-500">
                    Nous avons trouvé vos informations dans {existingDataSources.length} source(s).
                    Vérifiez et complétez si nécessaire.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600 mt-2">
                  Complétez vos informations personnelles
                </p>
              )}
            </div>

            {/* Champs en vertical */}
            <div className="space-y-4">
              
              {/* Prénom */}
              <Input
                {...profileForm.register("firstName")}
                label="Prénom *"
                placeholder="Votre prénom"
                defaultValue={getPrefilledValue('firstName')}
                error={profileForm.formState.errors.firstName?.message}
              />

              {/* Nom */}
              <Input
                {...profileForm.register("lastName")}
                label="Nom de famille *"
                placeholder="Votre nom de famille"
                defaultValue={getPrefilledValue('lastName')}
                error={profileForm.formState.errors.lastName?.message}
              />

              {/* Téléphone - Non modifiable */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Téléphone *
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
                  {phoneNumber}
                </div>
              </div>

              {/* Email */}
              <Input
                {...profileForm.register("email")}
                label="Email (optionnel)"
                type="email"
                placeholder="votre@email.com"
                defaultValue={getPrefilledValue('email')}
                error={profileForm.formState.errors.email?.message}
              />

              {/* Date de naissance */}
              <Input
                {...profileForm.register("dateOfBirth")}
                label="Date de naissance (optionnel)"
                type="date"
                defaultValue={getPrefilledValue('dateOfBirth')}
                error={profileForm.formState.errors.dateOfBirth?.message}
              />

              {/* Genre */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Genre (optionnel)
                </label>
                <select
                  {...profileForm.register("gender")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  defaultValue={getPrefilledValue('gender')}
                >
                  <option value="">Sélectionner</option>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                </select>
              </div>

              {/* Adresse */}
              <Input
                {...profileForm.register("address")}
                label="Adresse complète (optionnel)"
                placeholder="Numéro, rue, ville, code postal, pays"
                defaultValue={getPrefilledValue('address')}
                error={profileForm.formState.errors.address?.message}
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <Button type="submit" loading={isLoading} className="w-full">
                Continuer
              </Button>
              
              {existingDataSources.length > 0 && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleIgnoreExistingData}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Ignorer les données trouvées et repartir à zéro
                  </button>
                </div>
              )}

              {/* Info sécurité discrète */}
              {existingDataSources.length > 0 && (
                <div className="text-xs text-gray-400 text-center">
                  Vos données sont sécurisées et vous gardez le contrôle total
                </div>
              )}
            </div>
          </form>
        )}

        {/* Étape 4: Configuration PIN */}
        {step === "setup-pin" && (
          <form
            onSubmit={setupPinForm.handleSubmit((data) => setupPin({ pin: data.pin, confirmPin: data.confirmPin }))}
            className="space-y-4"
          >
            {/* Header du formulaire */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">Sécuriser votre compte</h3>
              <p className="text-sm text-gray-600 mt-2">
                Créez un code PIN à 4 chiffres pour sécuriser votre compte
              </p>
            </div>

            {/* Récapitulatif du profil */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-gray-900">Récapitulatif</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Nom:</span> {profileData?.firstName} {profileData?.lastName}</p>
                <p><span className="font-medium">Téléphone:</span> {phoneNumber}</p>
                {profileData?.email && <p><span className="font-medium">Email:</span> {profileData.email}</p>}
              </div>
            </div>

            {/* Section PIN */}
            <div className="space-y-4">
              <Input
                {...setupPinForm.register("pin")}
                label="Créer votre code PIN *"
                type="password"
                placeholder="4 chiffres"
                maxLength={4}
                error={setupPinForm.formState.errors.pin?.message}
              />

              <Input
                {...setupPinForm.register("confirmPin")}
                label="Confirmer votre code PIN *"
                type="password"
                placeholder="4 chiffres"
                maxLength={4}
                error={setupPinForm.formState.errors.confirmPin?.message}
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <Button type="submit" loading={isLoading} className="w-full">
                Créer mon compte
              </Button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep("setup-profile")}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Retour aux informations
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}