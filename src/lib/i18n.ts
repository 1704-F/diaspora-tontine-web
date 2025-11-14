import { getRequestConfig } from "next-intl/server";

export const locales = ["fr", "it"] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = "fr";

export default getRequestConfig(async ({ locale }) => {
  // Forcer 'fr' si locale invalide (pas de notFound() dans root layout)
  const validLocale = locale && locales.includes(locale as Locale) 
    ? locale 
    : defaultLocale;

  // Charger tous les namespaces nécessaires
  const [
    common,
    associations,
    roles,
    settings,
    createAssociation,
    editMember,
    memberDetails,
    members,
    sections,
    createSection,
    addMember,
    cotisations,
    finances
  ] = await Promise.all([
    import(`../locales/${validLocale}/common.json`).then(m => m.default),
    import(`../locales/${validLocale}/associations.json`).then(m => m.default),
    import(`../locales/${validLocale}/roles.json`).then(m => m.default),
    import(`../locales/${validLocale}/settings.json`).then(m => m.default),
    import(`../locales/${validLocale}/create-association.json`).then(m => m.default),
    import(`../locales/${validLocale}/editMember.json`).then(m => m.default),
    import(`../locales/${validLocale}/member-details.json`).then(m => m.default),
    import(`../locales/${validLocale}/members.json`).then(m => m.default),
    import(`../locales/${validLocale}/sections.json`).then(m => m.default),
    import(`../locales/${validLocale}/create-section.json`).then(m => m.default),
    import(`../locales/${validLocale}/add-member.json`).then(m => m.default),
    import(`../locales/${validLocale}/cotisations.json`).then(m => m.default),
    import(`../locales/${validLocale}/finances.json`).then(m => m.default),
  ]);

  return {
    locale: validLocale,
    messages: {
      common,
      associations,
      roles,
      settings,
      createAssociation,
      editMember,
      memberDetails,
      members,
      sections,
      createSection,
      addMember,
      cotisations,
      finances,
    },
  };
});