export const translations = {
  en: {
    dashboard: "Dashboard",
    generate: "Generate",
    calendar: "Calendar",
    settings: "Settings",
    flowly: "Flowly",
    welcome: "Flowly is running!",
    language: "Language",
  },
  ro: {
    dashboard: "Bord de control",
    generate: "Generează",
    calendar: "Calendar",
    settings: "Setări",
    flowly: "Flowly",
    welcome: "Flowly rulează!",
    language: "Limba",
  },
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
