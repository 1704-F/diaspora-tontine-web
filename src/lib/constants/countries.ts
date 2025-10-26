/**
 * 🌍 Constantes centralisées - Pays, Devises, Langues
 * 
 * Utilisé par tous les composants nécessitant ces listes
 * Les noms sont des clés i18n pour supporter le multilingue
 */

export const COUNTRIES = [
  { code: 'FR', name: 'countries.FR', flag: '🇫🇷' },
  { code: 'BE', name: 'countries.BE', flag: '🇧🇪' },
  { code: 'SN', name: 'countries.SN', flag: '🇸🇳' },
  { code: 'IT', name: 'countries.IT', flag: '🇮🇹' },
  { code: 'ES', name: 'countries.ES', flag: '🇪🇸' },
  { code: 'US', name: 'countries.US', flag: '🇺🇸' },
  { code: 'CA', name: 'countries.CA', flag: '🇨🇦' },
  { code: 'DE', name: 'countries.DE', flag: '🇩🇪' },
  { code: 'CH', name: 'countries.CH', flag: '🇨🇭' },
  { code: 'ML', name: 'countries.ML', flag: '🇲🇱' },
  { code: 'CI', name: 'countries.CI', flag: '🇨🇮' },
  { code: 'TG', name: 'countries.TG', flag: '🇹🇬' },
  { code: 'BF', name: 'countries.BF', flag: '🇧🇫' },
  { code: 'NE', name: 'countries.NE', flag: '🇳🇪' },
  { code: 'GN', name: 'countries.GN', flag: '🇬🇳' },
  { code: 'CM', name: 'countries.CM', flag: '🇨🇲' },
  { code: 'CD', name: 'countries.CD', flag: '🇨🇩' },
] as const;

export const CURRENCIES = [
  { code: 'EUR', name: 'currencies.EUR', symbol: '€' },
  { code: 'USD', name: 'currencies.USD', symbol: '$' },
  { code: 'GBP', name: 'currencies.GBP', symbol: '£' },
  { code: 'CAD', name: 'currencies.CAD', symbol: 'CAD' },
  { code: 'CHF', name: 'currencies.CHF', symbol: 'CHF' },
  { code: 'XOF', name: 'currencies.XOF', symbol: 'CFA' },
] as const;

export const LANGUAGES = [
  { code: 'fr', name: 'languages.fr', nativeName: 'Français' },
  { code: 'en', name: 'languages.en', nativeName: 'English' },
  { code: 'it', name: 'languages.it', nativeName: 'Italiano' },
  { code: 'es', name: 'languages.es', nativeName: 'Español' },
  { code: 'de', name: 'languages.de', nativeName: 'Deutsch' },
] as const;

export const TIMEZONES = [
  { value: 'Europe/Paris', label: 'timezones.europeParis' },
  { value: 'Europe/Brussels', label: 'timezones.europeBrussels' },
  { value: 'Europe/Rome', label: 'timezones.europeRome' },
  { value: 'Europe/Madrid', label: 'timezones.europeMadrid' },
  { value: 'Europe/Berlin', label: 'timezones.europeBerlin' },
  { value: 'Europe/Zurich', label: 'timezones.europeZurich' },
  { value: 'America/New_York', label: 'timezones.americaNewYork' },
  { value: 'America/Toronto', label: 'timezones.americaToronto' },
  { value: 'Africa/Dakar', label: 'timezones.africaDakar' },
  { value: 'Africa/Bamako', label: 'timezones.africaBamako' },
  { value: 'Africa/Abidjan', label: 'timezones.africaAbidjan' },
  { value: 'Africa/Lome', label: 'timezones.africaLome' },
  { value: 'Africa/Ouagadougou', label: 'timezones.africaOuagadougou' },
  { value: 'Africa/Niamey', label: 'timezones.africaNiamey' },
  { value: 'Africa/Conakry', label: 'timezones.africaConakry' },
  { value: 'Africa/Douala', label: 'timezones.africaDouala' },
  { value: 'Africa/Kinshasa', label: 'timezones.africaKinshasa' },
] as const;

// Types dérivés pour TypeScript
export type CountryCode = typeof COUNTRIES[number]['code'];
export type CurrencyCode = typeof CURRENCIES[number]['code'];
export type LanguageCode = typeof LANGUAGES[number]['code'];
export type TimezoneValue = typeof TIMEZONES[number]['value'];