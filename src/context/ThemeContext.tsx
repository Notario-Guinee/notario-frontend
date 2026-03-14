// ═══════════════════════════════════════════════════════════════
// Contexte de thème — Bascule entre mode clair et sombre
// Persiste le choix dans localStorage et applique la classe CSS
// correspondante sur l'élément <html>
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "dark", toggleTheme: () => {} });

/**
 * Provider de thème — gère la persistance et l'application
 * du thème clair/sombre sur le document HTML
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Récupérer le thème sauvegardé ou utiliser "light" par défaut
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("notario-theme") as Theme) || "light";
  });

  // Appliquer le thème au document HTML et le sauvegarder
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("notario-theme", theme);
  }, [theme]);

  /** Basculer entre les thèmes clair et sombre */
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Hook pour accéder au thème actif et à la fonction de bascule */
export function useTheme() {
  return useContext(ThemeContext);
}
