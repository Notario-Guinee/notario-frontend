// ═══════════════════════════════════════════════════════════════
// Constants — Constantes métier centralisées
// Source : Clients.tsx, Dossiers.tsx
// ═══════════════════════════════════════════════════════════════

export const PROFESSIONS: string[] = [
  "Commerçant", "Médecin", "Avocat(e)", "Ingénieur", "Enseignant(e)",
  "Fonctionnaire", "Entrepreneur(e)", "Pharmacien(ne)", "Architecte",
  "Comptable", "Notaire", "Agriculteur", "Banquier", "Consultant(e)",
  "Journaliste", "Informaticien(ne)", "Propriétaire", "Militaire",
  "Diplomate", "Artisan", "Transporteur", "Importateur/Exportateur",
  "Agent immobilier", "Retraité(e)", "Étudiant(e)", "Sans emploi",
];

export const RAISONS_SOCIALES: string[] = [
  "SARL", "SA", "SARLU", "SAS",
  "Association", "ONG", "Coopérative", "Fondation",
  "Établissement public", "Entreprise individuelle",
];

/** Fusion sans doublon de Clients.tsx et Dossiers.tsx — valeurs identiques */
export const TYPES_ACTE: string[] = [
  "Vente immobilière",
  "Succession",
  "Constitution société",
  "Donation",
  "Bail commercial",
  "Hypothèque",
  "Procuration",
];
