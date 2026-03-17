/**
 * Helpers de sanitisation pour la protection XSS.
 *
 * React échappe automatiquement les interpolations JSX ({value}),
 * ce qui couvre la majorité des cas. Ces helpers fournissent une
 * couche de défense supplémentaire pour :
 *   - Le contenu entré par l'utilisateur stocké en état puis réaffiché
 *   - Tout futur usage de dangerouslySetInnerHTML avec données utilisateur
 */

import DOMPurify from 'dompurify';

/**
 * Sanitise une chaîne saisie par l'utilisateur avant de la stocker ou l'afficher.
 * Supprime tout balisage HTML — retourne du texte brut uniquement.
 *
 * Usage : champs de texte libre (messages, commentaires, noms, etc.)
 */
export function sanitizeInput(value: string): string {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Sanitise une chaîne destinée à être injectée via dangerouslySetInnerHTML.
 * Autorise un sous-ensemble sûr de balises HTML (mise en forme basique uniquement).
 *
 * Usage : éditeur de texte enrichi, affichage de contenu formaté côté serveur.
 * ⚠️  Ne jamais utiliser avec du contenu non fiable sans audit préalable.
 */
export function sanitizeHTML(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'li', 'span'],
    ALLOWED_ATTR: [],
  });
}
