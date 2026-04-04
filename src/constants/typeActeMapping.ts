// ═══════════════════════════════════════════════════════════════
// Type Acte Mapping — Liaison entre UI et Backend
// ═══════════════════════════════════════════════════════════════

import { TYPES_ACTE } from "@/data/constants";

// Mapping entre les libellés UI et les codes backend (enum TypeActe)
export const TYPE_ACTE_MAPPING: Record<string, string> = {
  // Actes immobiliers
  "Vente immobilière": "VENTE_IMMOBILIERE",
  "Donation immobilière": "DONATION_IMMOBILIERE",
  "Bail emphytéotique": "BAIL_IMMOBILIER",
  "Bail commercial": "BAIL_IMMOBILIER",
  "Constitution d'hypothèque": "HYPOTHEQUE",
  "Mainlevée d'hypothèque": "MAINLEVEE_HYPOTHEQUE",
  "Promesse de vente (compromis)": "PRET_SIGNATURE",
  "Échange de biens immobiliers": "VENTE_IMMOBILIERE",
  "Attestation de propriété": "VENTE_IMMOBILIERE",
  "Morcellement / lotissement": "VENTE_IMMOBILIERE",
  "Mise en copropriété": "VENTE_IMMOBILIERE",
  "Règlement de copropriété": "CONTRAT_DIVERS",

  // Actes de famille
  "Contrat de mariage": "CONTRAT_MARIAGE",
  "Changement de régime matrimonial": "LIQUIDATION_REGIME",
  "Donation entre époux": "DONATION_PARTAGE",
  "Testament authentique": "TESTAMENT",
  "Révocation de testament": "TESTAMENT",
  "Reconnaissance d'enfant": "AUTHENTIFICATION",
  "Adoption": "AUTHENTIFICATION",
  "Autorisation parentale notariée": "PROCURATION",

  // Actes de succession
  "Acte de notoriété (héritiers)": "SUCCESSION",
  "Déclaration de succession": "SUCCESSION",
  "Partage successoral": "SUCCESSION",
  "Liquidation de succession": "LIQUIDATION_REGIME",
  "Attestation de propriété successorale": "SUCCESSION",
  "Inventaire des biens": "INVENTAIRE",

  // Actes commerciaux et sociétés
  "Création de société (statuts)": "CREATION_SOCIETE",
  "Modification des statuts": "MODIFICATION_STATUTS",
  "Cession de parts sociales": "CESSION_PARTS_SOCIALES",
  "Cession de fonds de commerce": "CESSION_PARTS_SOCIALES",
  "Dissolution de société": "DISSOLUTION_SOCIETE",
  "Procès-verbal d'assemblée": "MODIFICATION_STATUTS",
  "Nomination de dirigeants": "MODIFICATION_STATUTS",

  // Actes financiers
  "Prêt notarié": "PRET",
  "Reconnaissance de dette": "PRET",
  "Constitution de garantie (hypothèque, nantissement)": "HYPOTHEQUE",
  "Mainlevée de garantie": "MAINLEVEE_HYPOTHEQUE",
  "Acte de cautionnement": "PRET",

  // Actes administratifs et divers
  "Procuration (mandat)": "PROCURATION",
  "Légalisation de signature": "AUTHENTIFICATION",
  "Certification conforme de documents": "CERTIFICATION_CONFORME",
  "Déclaration sur l'honneur": "AUTHENTIFICATION",
  "Convention entre parties": "CONTRAT_DIVERS",
  "Acte de transaction": "CONTRAT_DIVERS",
};

// Mapping inverse pour afficher le libellé UI à partir du code backend
export const TYPE_ACTE_REVERSE_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(TYPE_ACTE_MAPPING).map(([ui, backend]) => [backend, ui])
);

// Fonction pour obtenir le code backend à partir du libellé UI
export function getTypeActeCode(uiLabel: string): string {
  // Vérifier si le libellé exact existe dans le mapping
  if (TYPE_ACTE_MAPPING[uiLabel]) {
    return TYPE_ACTE_MAPPING[uiLabel];
  }
  
  // Fallback : essayer de trouver un mapping partiel
  const lowerLabel = uiLabel.toLowerCase();
  const entry = Object.entries(TYPE_ACTE_MAPPING).find(([ui]) => 
    ui.toLowerCase() === lowerLabel
  );
  
  if (entry) {
    return entry[1];
  }
  
  // Dernier recours
  console.warn(`Aucun mapping trouvé pour: ${uiLabel}`);
  return uiLabel.toUpperCase().replace(/[^\w]/g, "_");
}

// Fonction pour obtenir le libellé UI à partir du code backend
export function getTypeActeLibelle(backendCode: string): string {
  return TYPE_ACTE_REVERSE_MAPPING[backendCode] || backendCode;
}

// Liste des types d'actes pour le select
export const TYPE_ACTE_LIST = TYPES_ACTE;