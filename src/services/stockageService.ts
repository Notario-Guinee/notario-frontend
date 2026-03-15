// ═══════════════════════════════════════════════════════════════
// Service Stockage — Fonctions mock de gestion du stockage
// Simule les appels API pour les plans, packs et la facturation
// Cabinet simulé : Offre Professionnelle + Pack M actif
// ═══════════════════════════════════════════════════════════════

import type {
  PlanNotario,
  PackMensuel,
  QuotaStockage,
  RecapFacturation,
  InfosFacturation,
  InfosCarteBancaire,
  LigneFacture,
} from '@/types/stockage';

// ─── Délai simulé pour imiter un appel réseau ───
const DELAI_MS = 800;
const attendre = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── État mutable en mémoire (simule la base de données) ───
let etatPlans: PlanNotario[] = [
  {
    id: 'plan-essentielle',
    nom: 'Offre Essentielle',
    niveau: 1,
    stockage_gb: 5,
    utilisateurs_max: 5,
    est_plan_actuel: false,
  },
  {
    id: 'plan-professionnelle',
    nom: 'Offre Professionnelle',
    niveau: 2,
    stockage_gb: 15,
    utilisateurs_max: 15,
    est_plan_actuel: true,
  },
  {
    id: 'plan-premium',
    nom: 'Offre Premium',
    niveau: 3,
    stockage_gb: 30,
    utilisateurs_max: 50,
    est_plan_actuel: false,
  },
];

let etatPacks: PackMensuel[] = [
  {
    id: 'pack-50',
    nom: 'Pack 50 GB',
    stockage_gb: 50,
    prix_mois_gnf: 250_000,
    est_populaire: false,
    est_actif: false,
  },
  {
    id: 'pack-100',
    nom: 'Pack 100 GB',
    stockage_gb: 100,
    prix_mois_gnf: 500_000,
    est_populaire: false,
    est_actif: false,
  },
  {
    id: 'pack-200',
    nom: 'Pack 200 GB',
    stockage_gb: 200,
    prix_mois_gnf: 900_000,
    est_populaire: false,
    est_actif: false,
  },
  {
    id: 'pack-300',
    nom: 'Pack 300 GB',
    stockage_gb: 300,
    prix_mois_gnf: 1_300_000,
    est_populaire: false,
    est_actif: false,
  },
  {
    id: 'pack-500',
    nom: 'Pack 500 GB',
    stockage_gb: 500,
    prix_mois_gnf: 2_000_000,
    est_populaire: true,
    est_actif: false,
  },
  {
    id: 'pack-1to',
    nom: 'Pack 1 To',
    stockage_gb: 1_000,
    prix_mois_gnf: 3_500_000,
    est_populaire: false,
    est_actif: false,
  },
  {
    id: 'pack-5to',
    nom: 'Pack 5 To',
    stockage_gb: 5_000,
    prix_mois_gnf: 15_000_000,
    est_populaire: false,
    est_actif: false,
  },
  {
    id: 'pack-10to',
    nom: 'Pack 10 To',
    stockage_gb: 10_000,
    prix_mois_gnf: 25_000_000,
    est_populaire: false,
    est_actif: false,
  },
];

let etatInfosCarteBancaire: InfosCarteBancaire = {
  titulaire: 'Mamadou Diallo',
  numero_carte: '4111 1111 1111 1111',
  date_expiration: '12/28',
  cvv: '',
  banque_emettrice: 'Banque de Guinée',
  type_carte: 'Visa',
};

let etatInfosFacturation: InfosFacturation = {
  raison_sociale: 'Cabinet Diallo & Associés',
  numero_rccm: 'RCCM/GN/KAL/2020/B/001234',
  adresse: 'Quartier Almamya, Kaloum',
  ville: 'Conakry',
  email_facturation: 'contact@diallo-notaires.gn',
  telephone: '+224 622 00 11 22',
};

// ─── Helpers internes ───

/** Affiche la capacité en GB ou To (usage synchrone dans les messages d'erreur) */
function afficherCapaciteSync(gb: number): string {
  return gb >= 1000 ? `${gb / 1000} To` : `${gb} GB`;
}

/** Calcule le stockage total du plan actuel */
const _getPlanActuel = (): PlanNotario =>
  etatPlans.find(p => p.est_plan_actuel)!;

/** Calcule le stockage total des packs actifs */
const _getPacksActifs = (): PackMensuel[] =>
  etatPacks.filter(p => p.est_actif);

/** Calcule le stockage total disponible (plan + packs) */
const _calcStockageTotal = (): number => {
  const plan = _getPlanActuel();
  const packs = _getPacksActifs();
  return plan.stockage_gb + packs.reduce((acc, p) => acc + p.stockage_gb, 0);
};

// ─── Fonctions exportées ───

/**
 * Récupère le quota de stockage complet du cabinet
 */
export async function getQuotaCabinet(): Promise<QuotaStockage> {
  await attendre(DELAI_MS);
  const plan = _getPlanActuel();
  const packsActifs = _getPacksActifs();
  const stockagePacks = packsActifs.reduce((acc, p) => acc + p.stockage_gb, 0);
  const stockageTotal = plan.stockage_gb + stockagePacks;
  const utilise = 18.4;
  return {
    plan_actuel: plan,
    stockage_plan_gb: plan.stockage_gb,
    stockage_packs_gb: stockagePacks,
    stockage_total_gb: stockageTotal,
    stockage_utilise_gb: utilise,
    pourcentage_utilise: Math.round((utilise / stockageTotal) * 100),
    packs_actifs: packsActifs,
  };
}

/**
 * Retourne les 3 plans de la plateforme avec leur état actuel
 */
export async function getPlansDisponibles(): Promise<PlanNotario[]> {
  await attendre(DELAI_MS);
  return [...etatPlans];
}

/**
 * Retourne les 4 packs mensuels disponibles avec leur état
 */
export async function getPacksDisponibles(): Promise<PackMensuel[]> {
  await attendre(DELAI_MS);
  return [...etatPacks];
}

/**
 * Effectue un upgrade vers un plan supérieur.
 * Rejette la demande si le plan cible est de niveau ≤ plan actuel.
 */
export async function upgraderPlan(
  planId: string
): Promise<{ succes: boolean; message: string }> {
  await attendre(DELAI_MS);
  const planCible = etatPlans.find(p => p.id === planId);
  const planActuel = _getPlanActuel();
  if (!planCible) {
    return { succes: false, message: 'Plan introuvable.' };
  }
  // Règle métier : le downgrade est interdit
  if (planCible.niveau <= planActuel.niveau) {
    return {
      succes: false,
      message: 'La rétrogradation vers un plan inférieur ou identique est interdite.',
    };
  }
  // Mise à jour de l'état
  etatPlans = etatPlans.map(p => ({
    ...p,
    est_plan_actuel: p.id === planId,
  }));
  return {
    succes: true,
    message: `Votre plan a été mis à niveau vers ${planCible.nom} !`,
  };
}

/**
 * Souscrit à un pack mensuel et l'active immédiatement.
 * Règle : un seul pack actif à la fois. Rejette si un autre pack est déjà actif.
 */
export async function souscrirePack(packId: string): Promise<PackMensuel> {
  await attendre(DELAI_MS);
  const pack = etatPacks.find(p => p.id === packId);
  if (!pack) throw new Error('Pack introuvable.');
  // Règle métier : la rétrogradation vers un pack inférieur est interdite
  const packActif = etatPacks.find(p => p.est_actif && p.id !== packId);
  if (packActif && pack.stockage_gb < packActif.stockage_gb) {
    throw new Error(
      `La rétrogradation vers un pack inférieur est interdite. Votre pack actuel est ${packActif.nom} (${afficherCapaciteSync(packActif.stockage_gb)}).`
    );
  }
  // Si un autre pack est actif, on le désactive automatiquement (comme iCloud+)
  etatPacks = etatPacks.map(p =>
    p.est_actif && p.id !== packId
      ? { ...p, est_actif: false, resiliation_programmee: false, date_renouvellement: undefined, date_resiliation: undefined }
      : p
  );
  // Date de renouvellement : 1er du mois suivant
  const prochainMois = new Date();
  prochainMois.setMonth(prochainMois.getMonth() + 1);
  prochainMois.setDate(1);
  const dateRenouv = prochainMois.toISOString().slice(0, 10);
  const packMisAJour: PackMensuel = {
    ...pack,
    est_actif: true,
    date_renouvellement: dateRenouv,
    resiliation_programmee: false,
  };
  etatPacks = etatPacks.map(p => (p.id === packId ? packMisAJour : p));
  return packMisAJour;
}

/**
 * Programme la résiliation d'un pack en fin de mois.
 * Le pack reste actif jusqu'à la date de résiliation.
 */
export async function resilierPack(
  packId: string
): Promise<{ succes: boolean; date_fin: string; message: string }> {
  await attendre(DELAI_MS);
  const pack = etatPacks.find(p => p.id === packId);
  if (!pack || !pack.est_actif) {
    return { succes: false, date_fin: '', message: 'Pack introuvable ou inactif.' };
  }
  const dateFin = pack.date_renouvellement ?? '2026-04-01';
  etatPacks = etatPacks.map(p =>
    p.id === packId
      ? { ...p, resiliation_programmee: true, date_resiliation: dateFin }
      : p
  );
  return {
    succes: true,
    date_fin: dateFin,
    message: `Résiliation programmée au ${dateFin}. Le pack reste actif jusqu'à cette date.`,
  };
}

/**
 * Annule une résiliation programmée sur un pack.
 */
export async function annulerResiliationPack(
  packId: string
): Promise<{ succes: boolean; message: string }> {
  await attendre(DELAI_MS);
  const pack = etatPacks.find(p => p.id === packId);
  if (!pack || !pack.resiliation_programmee) {
    return { succes: false, message: 'Aucune résiliation programmée sur ce pack.' };
  }
  etatPacks = etatPacks.map(p =>
    p.id === packId
      ? { ...p, resiliation_programmee: false, date_resiliation: undefined }
      : p
  );
  return { succes: true, message: 'La résiliation a été annulée.' };
}

/**
 * Calcule le récapitulatif de facturation mensuelle du cabinet.
 */
export async function getRecapFacturation(): Promise<RecapFacturation> {
  await attendre(DELAI_MS);
  const plan = _getPlanActuel();
  // Prix du plan (simulés)
  const prixPlan: Record<string, number> = {
    'plan-essentielle': 150_000,
    'plan-professionnelle': 300_000,
    'plan-premium': 500_000,
  };
  const packsActifs = _getPacksActifs();
  const total =
    (prixPlan[plan.id] ?? 0) +
    packsActifs.reduce((acc, p) => acc + p.prix_mois_gnf, 0);
  return {
    plan_nom: plan.nom,
    plan_montant_gnf: prixPlan[plan.id] ?? 0,
    packs: packsActifs.map(p => ({
      nom: `${p.nom} (+${p.stockage_gb} GB/mois)`,
      montant_gnf: p.prix_mois_gnf,
    })),
    total_mensuel_gnf: total,
    prochaine_echeance: '2026-04-01',
  };
}

/**
 * Retourne les informations légales de facturation du cabinet.
 */
export async function getInfosFacturation(): Promise<InfosFacturation> {
  await attendre(DELAI_MS);
  return { ...etatInfosFacturation };
}

/**
 * Sauvegarde les informations légales de facturation du cabinet.
 */
export async function sauvegarderInfosFacturation(
  infos: InfosFacturation
): Promise<void> {
  await attendre(DELAI_MS);
  etatInfosFacturation = { ...infos };
}

/**
 * Retourne les coordonnées bancaires / carte enregistrées du cabinet.
 * Le CVV n'est jamais renvoyé (vide par sécurité).
 */
export async function getInfosCarteBancaire(): Promise<InfosCarteBancaire> {
  await attendre(DELAI_MS);
  // Le CVV ne doit jamais être exposé après enregistrement
  return { ...etatInfosCarteBancaire, cvv: '' };
}

/**
 * Sauvegarde les coordonnées bancaires / carte du cabinet.
 */
export async function sauvegarderInfosCarteBancaire(
  infos: InfosCarteBancaire
): Promise<void> {
  await attendre(DELAI_MS);
  etatInfosCarteBancaire = { ...infos };
}

/**
 * Retourne l'historique des factures du cabinet (4 entrées dont 1 échouée).
 */
export async function getHistoriqueFactures(): Promise<LigneFacture[]> {
  await attendre(DELAI_MS);
  return [
    {
      id: 'fact-001',
      date: '2026-03-01',
      description: 'Offre Professionnelle — Mars 2026',
      montant_gnf: 300_000,
      statut: 'payé',
    },
    {
      id: 'fact-002',
      date: '2026-03-01',
      description: 'Pack M (+10 GB) — Mars 2026',
      montant_gnf: 90_000,
      statut: 'payé',
    },
    {
      id: 'fact-003',
      date: '2026-02-01',
      description: 'Offre Professionnelle — Février 2026',
      montant_gnf: 300_000,
      statut: 'payé',
    },
    {
      id: 'fact-004',
      date: '2026-02-01',
      description: 'Pack M (+10 GB) — Février 2026',
      montant_gnf: 90_000,
      statut: 'échoué',
    },
  ];
}
