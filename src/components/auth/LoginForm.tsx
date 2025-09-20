// ============================================
// LoginForm SIMPLIFIÉ - Direct connexion
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
import { DataReviewStep } from "./DataReviewStep";

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
  const [step, setStep] = useState<
    "phone" | "pin" | "otp" | "review-data" | "setup-pin"
  >("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newUser, setNewUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  // Forms séparés
  const phoneForm = useForm<PhoneData>({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm<OtpData>({ resolver: zodResolver(otpSchema) });
  const pinForm = useForm<PinData>({ resolver: zodResolver(pinSchema) });
  const setupPinForm = useForm<SetupPinData>({
    resolver: zodResolver(setupPinSchema),
  });
  const [existingDataSources, setExistingDataSources] = useState<any[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<any>(null);

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

  const handleUseExistingData = async (selectedSource: any) => {
    // Passer directement au setup-pin avec la source sélectionnée
    setSelectedDataSource(selectedSource); // Nouveau state
    setStep("setup-pin");
  };

  const handleModifyAndUse = async (selectedSource: any) => {
    // Même chose mais avec intention de modifier
    setSelectedDataSource(selectedSource);
    setStep("setup-pin");
  };

  const handleManualEntry = () => {
    // Ignorer les données existantes
    setStep("setup-pin");
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

        // NOUVEAU : Vérifier s'il y a des données existantes
        if (
          result.nextStep === "review_existing_data" &&
          result.existingData?.found
        ) {
          setExistingDataSources(result.existingData.sources); // Nouveau state nécessaire
          setStep("review-data"); // Nouveau step
          toast.success("Données existantes trouvées !");
        } else if (result.nextStep === "setup_pin") {
          setStep("setup-pin");
          toast.success("Compte créé ! Configurez votre PIN");
        } else if (result.tokens) {
          handleLoginSuccess(result.user, result.tokens.accessToken);
        }
      } else {
        toast.error(result.error || "Code OTP invalide");
      }
    } catch (error) {
      toast.error("Erreur de vérification");
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 4: Configuration PIN (nouveaux utilisateurs)
  const setupPin = async (data: SetupPinData) => {
    if (!newUser) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/setup-pin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: newUser.phoneNumber,
            pin: data.pin,
            confirmPin: data.confirmPin,
            firstName: data.firstName,
            lastName: data.lastName,
            selectedDataSource: selectedDataSource,
          }),
        }
      );

      const result = await response.json();

      if (result.success && result.tokens) {
        handleLoginSuccess(result.user, result.tokens.accessToken);
      } else {
        toast.error(result.error || "Erreur de configuration");
      }
    } catch (error) {
      toast.error("Erreur de configuration");
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Nouveau step : Révision des données existantes */}
      {step === "review-data" && (
        <DataReviewStep
          phoneNumber={phoneNumber}
          existingDataSources={existingDataSources}
          onUseExistingData={handleUseExistingData}
          onManualEntry={handleManualEntry}
          onModifyAndUse={handleModifyAndUse}
        />
      )}

      {/* Étape 2a: Code PIN (utilisateurs existants) */}
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
            placeholder="1234"
            maxLength={4}
            error={pinForm.formState.errors.pin?.message}
            autoFocus
          />

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("phone")}
              className="flex-1"
            >
              Retour
            </Button>
            <Button type="submit" loading={isLoading} className="flex-1">
              Se connecter
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-primary-600 hover:text-primary-700"
              onClick={() => {
                requestOtp(phoneNumber);
                toast.info("Code OTP envoyé par SMS");
              }}
            >
              PIN oublié ? Utiliser un code SMS
            </button>
          </div>
        </form>
      )}

      {/* Étape 2b: Code OTP (nouveaux utilisateurs ou PIN oublié) */}
      {step === "otp" && (
        <form onSubmit={otpForm.handleSubmit(verifyOtp)} className="space-y-4">
          <div className="text-center">
            <h3 className="font-medium text-gray-900">Code de vérification</h3>
            <p className="text-sm text-gray-600 mt-1">
              Code envoyé au {phoneNumber}
            </p>
          </div>

          <Input
            {...otpForm.register("otpCode")}
            label="Code à 6 chiffres"
            placeholder="123456"
            error={otpForm.formState.errors.otpCode?.message}
            autoFocus
            maxLength={6}
          />

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("phone")}
              className="flex-1"
            >
              Retour
            </Button>
            <Button type="submit" loading={isLoading} className="flex-1">
              Vérifier
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-primary-600 hover:text-primary-700"
              onClick={() => requestOtp(phoneNumber)}
            >
              Renvoyer le code
            </button>
          </div>
        </form>
      )}


      {/* Étape 3: Configuration PIN (nouveaux utilisateurs) */}
      {step === "setup-pin" && (
        <form
          onSubmit={setupPinForm.handleSubmit(setupPin)}
          className="space-y-4"
        >
          <div className="text-center">
            <h3 className="font-medium text-gray-900">
              Configuration du compte
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Finalisez votre inscription
            </p>
          </div>

          <Input
            {...setupPinForm.register("firstName")}
            label="Prénom"
            placeholder="John"
            error={setupPinForm.formState.errors.firstName?.message}
          />

          <Input
            {...setupPinForm.register("lastName")}
            label="Nom"
            placeholder="Doe"
            error={setupPinForm.formState.errors.lastName?.message}
          />

          <Input
            {...setupPinForm.register("pin")}
            label="Code PIN (4 chiffres)"
            type="password"
            placeholder="1234"
            maxLength={4}
            error={setupPinForm.formState.errors.pin?.message}
          />

          <Input
            {...setupPinForm.register("confirmPin")}
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
              onClick={() => setStep("otp")}
              className="flex-1"
            >
              Retour
            </Button>
            <Button type="submit" loading={isLoading} className="flex-1">
              Finaliser
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
