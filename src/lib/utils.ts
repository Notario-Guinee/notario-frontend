// ═══════════════════════════════════════════════════════════════
// Utilitaires partagés de l'application
// Fonctions de fusion de classes CSS (cn) et de recherche textuelle
// ═══════════════════════════════════════════════════════════════

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne les classes CSS avec prise en charge de Tailwind
 * Utilise clsx pour la logique conditionnelle et twMerge pour résoudre les conflits
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalise une chaîne pour la recherche : minuscules + suppression des espaces
 */
export function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

/**
 * Vérifie si la chaîne haystack contient needle (insensible à la casse et aux espaces)
 * Utilisé dans tous les filtres de recherche de l'application
 */
export function searchMatch(haystack: string, needle: string): boolean {
  return norm(haystack).includes(norm(needle));
}
