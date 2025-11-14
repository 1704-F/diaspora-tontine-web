// src/components/auth/LoginForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import {
  Phone,
  Lock,
  User,
  ArrowLeft,
} from "lucide-react";

// ============================================
// SCHÉMAS DE VALIDATION
// ============================================
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

const profileSchema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide").or(z.literal("")),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

const pinOnlySchema = z
  .object({
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

// ============================================
// TYPES
// ============================================
type PhoneData = z.infer<typeof phoneSchema>;
type OtpData = z.infer<typeof otpSchema>;
type PinData = z.infer<typeof pinSchema>;
type ProfileData = z.infer<typeof profileSchema>;
type PinOnlyData = z.infer<typeof pinOnlySchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

type Step = "phone" | "pin" | "otp" | "setup-profile" | "setup-pin";

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export function LoginForm({ onSuccess }: LoginFormProps) {
  // États
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [existingDataSources, setExistingDataSources] = useState<Array<{
    module: { name: string };
    data: Record<string, unknown>;
    metadata: { userId: number };
  }>>([]);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  // Forms
  const phoneForm = useForm<PhoneData>({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm<OtpData>({ resolver: zodResolver(otpSchema) });
  const pinForm = useForm<PinData>({ resolver: zodResolver(pinSchema) });
  const profileForm = useForm<ProfileData>({ resolver: zodResolver(profileSchema) });
  const pinOnlyForm = useForm<PinOnlyData>({ resolver: zodResolver(pinOnlySchema) });

  // ============================================
  // EFFET: PRÉ-REMPLISSAGE DES DONNÉES
  // ============================================
  useEffect(() => {
    if (existingDataSources.length > 0) {
      const firstSource = existingDataSources[0];
      const prefilledData: ProfileData = {
        firstName: (firstSource.data?.firstName as string) || "",
        lastName: (firstSource.data?.lastName as string) || "",
        email: (firstSource.data?.email as string) || "",
        dateOfBirth: firstSource.data?.dateOfBirth
          ? new Date(firstSource.data.dateOfBirth as string).toISOString().split("T")[0]
          : "",
        gender: (firstSource.data?.gender as string) || "",
        address: (firstSource.data?.address as string) || "",
        postalCode: (firstSource.data?.postalCode as string) || "",
        city: (firstSource.data?.city as string) || "",
        country: (firstSource.data?.country as string) || "",
      };

      profileForm.reset(prefilledData);
    }
  }, [existingDataSources, profileForm]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleLoginSuccess = (user: Record<string, unknown>, token: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);
    setToken(token);

    toast.success("Connexion réussie!");
    onSuccess?.();
    router.push("/dashboard");
  };

  const handleIgnoreExistingData = () => {
    setExistingDataSources([]);
    profileForm.reset({
      firstName: "",
      lastName: "",
      email: "",
      dateOfBirth: "",
      gender: "",
      address: "",
      postalCode: "",
      city: "",
      country: "",
    });
    toast.info("Données ignorées");
  };

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
          setStep("pin");
        } else {
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
        if (result.existingData?.found && result.existingData?.sources?.length > 0) {
          setExistingDataSources(result.existingData.sources);
          setStep("setup-profile");
          toast.success("Données existantes trouvées!");
        } else if (result.nextStep === "setup_pin") {
          setStep("setup-profile");
          toast.success("Compte créé!");
        } else if (result.tokens) {
          handleLoginSuccess(result.user, result.tokens.accessToken);
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

  const saveProfile = async (data: ProfileData) => {
    setProfileData(data);
    setStep("setup-pin");
    toast.success("Profil sauvegardé!");
  };

  const setupPin = async (data: PinOnlyData) => {
    setIsLoading(true);
    try {
      const requestBody = {
        phoneNumber: phoneNumber,
        pin: data.pin,
        confirmPin: data.confirmPin,
        firstName: profileData?.firstName,
        lastName: profileData?.lastName,
        email: profileData?.email || null,
        dateOfBirth: profileData?.dateOfBirth || null,
        gender: profileData?.gender || null,
        address: profileData?.address || null,
        city: profileData?.city || null,
        country: profileData?.country || null,
        postalCode: profileData?.postalCode || null,
        selectedDataSource:
          existingDataSources.length > 0
            ? {
                userId: existingDataSources[0].metadata.userId,
                module: existingDataSources[0].module.name,
              }
            : null,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/setup-pin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      const result = await response.json();

      if (result.success && result.tokens) {
        handleLoginSuccess(result.user, result.tokens.accessToken);
        toast.success("Compte créé avec succès!");
      } else {
        toast.error(result.error || "Erreur lors de la création du compte");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="h-screen flex">
      {/* ✅ PARTIE GAUCHE - IMAGE UNIQUEMENT */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/login-image.jpg"
          alt="Illustration"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* ✅ PARTIE DROITE - FORMULAIRE */}
<div
  className="flex-1 flex items-center justify-center"
  style={{ backgroundColor: "#042927" }}
>
  <div className="w-full max-w-md px-8">
  

    {/* ÉTAPE 1: TÉLÉPHONE */}
    {step === "phone" && (
      <div className="space-y-6 text-white">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
            <Image src="/logoicon.svg" alt="Logo" width={200} height={200} />
          </div>
          <h3 className="text-2xl font-bold text-white">Connexion</h3>
          <p className="text-gray-100 mt-2">
            Entrez votre numéro de téléphone pour continuer
          </p>
        </div>

        <form onSubmit={phoneForm.handleSubmit(checkUser)} className="space-y-4">
          <Input
            {...phoneForm.register("phoneNumber")}
            label="Numéro de téléphone"
            placeholder="+33 6 12 34 56 78"
            error={phoneForm.formState.errors.phoneNumber?.message}
            autoFocus
            className="bg-white text-gray-900"
          />

          <Button
            type="submit"
            loading={isLoading}
            className="w-full bg-white text-[#042927] hover:bg-gray-100 font-semibold"
          >
            Continuer
          </Button>
        </form>
      </div>
    )}

    {/* ÉTAPE 2A: PIN */}
    {step === "pin" && (
      <div className="space-y-6 text-white">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white">Code PIN</h3>
          <p className="text-gray-100 mt-2">
            Entrez votre code PIN à 4 chiffres
          </p>
        </div>

        <form onSubmit={pinForm.handleSubmit(loginWithPin)} className="space-y-4">
          <Input
            {...pinForm.register("pin")}
            label="Code PIN"
            type="password"
            placeholder="••••"
            maxLength={4}
            error={pinForm.formState.errors.pin?.message}
            className="bg-white text-gray-900"
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("phone")}
              className="flex-1 bg-transparent border border-white text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              className="flex-1 bg-white text-[#042927] hover:bg-gray-100 font-semibold"
            >
              Se connecter
            </Button>
          </div>
        </form>
      </div>
    )}

    {/* ÉTAPE 2B: OTP */}
    {step === "otp" && (
      <div className="space-y-6 text-white">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
            <Image src="/logo.svg" alt="Logo" width={40} height={40} />
          </div>
          <h3 className="text-2xl font-bold text-white">Vérification</h3>
          <p className="text-gray-100 mt-2">
            Code envoyé au {phoneNumber}
          </p>
        </div>

        <form onSubmit={otpForm.handleSubmit(verifyOtp)} className="space-y-4">
          <Input
            {...otpForm.register("otpCode")}
            label="Code OTP"
            placeholder="123456"
            maxLength={6}
            error={otpForm.formState.errors.otpCode?.message}
            autoFocus
            className="bg-white text-gray-900"
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("phone")}
              className="flex-1 bg-transparent border border-white text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              className="flex-1 bg-white text-[#042927] hover:bg-gray-100 font-semibold"
            >
              Vérifier
            </Button>
          </div>
        </form>
      </div>
    )}

    {/* Footer */}
    <p className="text-center text-sm text-gray-300 mt-8">
      En continuant, vous acceptez nos conditions d&apos;utilisation
    </p>
  </div>
</div>



    </div>
  );
}