// ═══════════════════════════════════════════════════════════════
// Formatters — Fonctions de formatage centralisées
// Source : mockData.ts, stockageService.ts, GestionPacks.tsx
// ═══════════════════════════════════════════════════════════════

/**
 * Formate un montant en francs guinéens (GNF)
 * Ex: 1500000 → "1 500 000 GNF"
 */
export function formatGNF(amount: number): string {
  return new Intl.NumberFormat('fr-GN', { style: 'decimal' }).format(amount) + ' GNF';
}

/**
 * Formate une capacité en Go/To selon la valeur
 * Ex: 100 → "100 GB", 1000 → "1 To"
 */
export function formatCapacite(gb: number): string {
  if (gb >= 1000) return `${gb / 1000} To`;
  return `${gb} GB`;
}

/**
 * Formate une date ISO en locale FR ou EN
 * Ex: "2025-06-15", "fr" → "15/06/2025"
 */
export function formatDate(dateStr: string, locale?: "fr" | "en"): string {
  return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formate une date relative (Aujourd'hui, Hier, ou date formatée)
 */
export function formatDateRelative(dateStr: string, lang?: "FR" | "EN"): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0);
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return lang === 'EN' ? "Today" : "Aujourd'hui";
  if (diffDays === 1) return lang === 'EN' ? "Yesterday" : "Hier";
  return formatDate(dateStr, lang === 'EN' ? 'en' : 'fr');
}
