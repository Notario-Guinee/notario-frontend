// ═══════════════════════════════════════════════════════════════
// Types — Gestion du stockage et de la facturation
// Définit toutes les structures de données utilisées par le
// module de gestion de l'espace de stockage des cabinets
// ═══════════════════════════════════════════════════════════════

/** Noms des plans disponibles sur la plateforme Notario */
export type NomPlan =
  | 'Offre Essentielle'
  | 'Offre Professionnelle'
  | 'Offre Premium';

/** Niveau hiérarchique du plan : 1 = bas, 3 = haut */
export type NiveauPlan = 1 | 2 | 3;

/** Représente un plan d'abonnement de la plateforme */
export interface PlanNotario {
  id: string;
  nom: NomPlan;
  /** 1 = Essentielle, 2 = Professionnelle, 3 = Premium */
  niveau: NiveauPlan;
  stockage_gb: number;
  utilisateurs_max: number;
  est_plan_actuel: boolean;
}

/** Représente un pack de stockage mensuel */
export interface PackMensuel {
  id: string;
  nom: string;
  stockage_gb: number;
  prix_mois_gnf: number;
  /** Badge "Populaire" affiché sur la carte */
  est_populaire: boolean;
  /** Indique si le pack est actuellement souscrit */
  est_actif: boolean;
  /** Date ISO de prochain renouvellement automatique */
  date_renouvellement?: string;
  /** Résiliation programmée en fin de mois */
  resiliation_programmee?: boolean;
  /** Date ISO d'effet de la résiliation */
  date_resiliation?: string;
}

/** Quota global de stockage du cabinet */
export interface QuotaStockage {
  plan_actuel: PlanNotario;
  /** Stockage inclus dans le plan en GB */
  stockage_plan_gb: number;
  /** Stockage ajouté par les packs actifs en GB */
  stockage_packs_gb: number;
  /** Stockage total = plan + packs en GB */
  stockage_total_gb: number;
  /** Stockage réellement utilisé en GB */
  stockage_utilise_gb: number;
  /** Pourcentage d'utilisation (0–100) */
  pourcentage_utilise: number;
  /** Liste des packs actuellement actifs */
  packs_actifs: PackMensuel[];
}

/** Récapitulatif de facturation mensuelle */
export interface RecapFacturation {
  plan_nom: string;
  plan_montant_gnf: number;
  packs: { nom: string; montant_gnf: number }[];
  total_mensuel_gnf: number;
  /** Date ISO de la prochaine échéance */
  prochaine_echeance: string;
}

/** Informations légales du cabinet pour la facturation */
export interface InfosFacturation {
  raison_sociale: string;
  numero_rccm: string;
  adresse: string;
  ville: string;
  email_facturation: string;
  telephone: string;
}

/** Ligne dans l'historique des factures */
export interface LigneFacture {
  id: string;
  /** Date ISO */
  date: string;
  description: string;
  montant_gnf: number;
  statut: 'payé' | 'en_attente' | 'échoué';
}

/** Coordonnées bancaires / carte de paiement du cabinet */
export interface InfosCarteBancaire {
  /** Nom complet du titulaire de la carte */
  titulaire: string;
  /** Numéro de carte masqué (16 chiffres, ex: 4111 1111 1111 1111) */
  numero_carte: string;
  /** Date d'expiration au format MM/AA */
  date_expiration: string;
  /** Cryptogramme visuel (CVV/CVC, 3–4 chiffres) */
  cvv: string;
  /** Nom de la banque émettrice */
  banque_emettrice: string;
  /** Type de carte */
  type_carte: 'Visa' | 'Mastercard' | 'American Express' | 'UnionPay' | 'Autre';
}

/**
 * Niveau d'alerte de stockage :
 * - normal    → < 70%
 * - attention → 70–89%
 * - urgent    → 90–99%
 * - plein     → 100%
 */
export type NiveauAlerte = 'normal' | 'attention' | 'urgent' | 'plein';
