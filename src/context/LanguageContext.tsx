// ═══════════════════════════════════════════════════════════════
// Contexte de langue — Gestion de l'internationalisation (i18n)
// Fournit la langue active (FR/EN), un setter et une fonction
// de traduction t(clé) utilisée dans toute l'application
// ═══════════════════════════════════════════════════════════════

import { createContext, useContext, useState, ReactNode } from "react";
import { translations, type Language } from "@/i18n/translations";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

// Valeurs par défaut du contexte
const LanguageContext = createContext<LanguageContextType>({
  lang: "FR",
  setLang: () => {},
  t: (key: string) => key,
});

/**
 * Provider de langue — enveloppe l'application pour fournir
 * la langue active et la fonction de traduction
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("FR");

  // Fonction de traduction avec fallback sur le français
  const t = (key: string): string => {
    return translations[lang]?.[key] || translations["FR"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/** Hook pour accéder au contexte de langue */
export const useLanguage = () => useContext(LanguageContext);
