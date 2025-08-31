import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

// Langues supportées
export const locales = ["fr", "it"] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = "fr";

export default getRequestConfig(async ({ locale }) => {
  // Si locale undefined ou non supportée → redirection 404
  if (!locale || !locales.includes(locale as Locale)) notFound();

  const messages = (await import(`../locales/${locale}/common.json`)).default;

  return {
    locale,   // ✅ ici TypeScript sait que locale est string
    messages,
  };
});
