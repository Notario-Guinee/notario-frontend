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

/** Catégories d'actes notariaux avec leurs actes spécifiques */
export interface CategorieActe {
  label: string;
  actes: string[];
}

export const CATEGORIES_ACTES: CategorieActe[] = [
  {
    label: "Actes immobiliers",
    actes: [
      "Vente immobilière",
      "Promesse de vente (compromis)",
      "Échange de biens immobiliers",
      "Donation immobilière",
      "Bail emphytéotique",
      "Bail commercial",
      "Constitution d'hypothèque",
      "Mainlevée d'hypothèque",
      "Attestation de propriété",
      "Morcellement / lotissement",
      "Mise en copropriété",
      "Règlement de copropriété",
    ],
  },
  {
    label: "Actes de famille",
    actes: [
      "Contrat de mariage",
      "Changement de régime matrimonial",
      "Donation entre époux",
      "Testament authentique",
      "Révocation de testament",
      "Reconnaissance d'enfant",
      "Adoption",
      "Autorisation parentale notariée",
    ],
  },
  {
    label: "Actes de succession",
    actes: [
      "Acte de notoriété (héritiers)",
      "Déclaration de succession",
      "Partage successoral",
      "Liquidation de succession",
      "Attestation de propriété successorale",
      "Inventaire des biens",
    ],
  },
  {
    label: "Actes commerciaux et sociétés",
    actes: [
      "Création de société (statuts)",
      "Modification des statuts",
      "Cession de parts sociales",
      "Cession de fonds de commerce",
      "Dissolution de société",
      "Procès-verbal d'assemblée",
      "Nomination de dirigeants",
    ],
  },
  {
    label: "Actes financiers",
    actes: [
      "Prêt notarié",
      "Reconnaissance de dette",
      "Constitution de garantie (hypothèque, nantissement)",
      "Mainlevée de garantie",
      "Acte de cautionnement",
    ],
  },
  {
    label: "Actes administratifs et divers",
    actes: [
      "Procuration (mandat)",
      "Légalisation de signature",
      "Certification conforme de documents",
      "Déclaration sur l'honneur",
      "Convention entre parties",
      "Acte de transaction",
    ],
  },
];

/** Liste plate de tous les actes — pour compatibilité avec les filtres existants */
export const TYPES_ACTE: string[] = CATEGORIES_ACTES.flatMap(c => c.actes);
