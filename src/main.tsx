// ═══════════════════════════════════════════════════════════════
// Point d'entrée principal de l'application Notario
// Monte le composant racine <App /> dans le DOM
// Gère aussi la suppression du badge Lovable et le nettoyage du cache
// ═══════════════════════════════════════════════════════════════

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LanguageProvider } from "./context/LanguageContext";

// Expression régulière pour détecter le badge Lovable
const LOVABLE_BADGE_TEXT = /edit with lovable/i;

/**
 * Supprime les éléments du badge Lovable du DOM
 * Recherche par sélecteurs CSS et par contenu textuel
 */
const removeLovableBadge = () => {
  const directSelectors = [
    '[data-lovable-badge]',
    '[class*="lovable"][class*="badge"]',
    '[id*="lovable"][id*="badge"]',
    'a[href*="lovable.dev"]',
    'a[href*="lovable.app"]',
    'iframe[src*="lovable"]',
  ].join(",");

  document.querySelectorAll<HTMLElement>(directSelectors).forEach((node) => node.remove());

  document.querySelectorAll<HTMLElement>("a,button,div,span,p").forEach((node) => {
    const text = node.textContent?.trim();
    if (text && LOVABLE_BADGE_TEXT.test(text)) {
      node.remove();
    }
  });
};

/**
 * Observe les mutations du DOM pour supprimer le badge dès son apparition
 */
const startLovableBadgeGuard = () => {
  removeLovableBadge();

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      removeLovableBadge();
      scheduled = false;
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
};

/**
 * Nettoie les anciens caches du service worker
 */
const purgeLegacyCaches = async () => {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.includes("lovable") || key.startsWith("Notario-"))
      .map((key) => caches.delete(key))
  );
};

// Lancement du nettoyage et du guard
void purgeLegacyCaches();
startLovableBadgeGuard();

// Montage de l'application React dans l'élément #root
createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </LanguageProvider>
);
