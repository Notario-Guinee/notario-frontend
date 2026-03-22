import type { Facture, Client, Dossier } from '../types/api';

/** Normalize a Facture from backend format to frontend format */
export function normalizeFacture(f: Facture): Facture {
  return {
    ...f,
    numero: f.numero ?? f.numeroFacture,
    dateCreation: f.dateCreation ?? f.createdAt,
  };
}

/** Get display label for PaiementStatut */
export function getPaiementStatutLabel(statut: string): string {
  const labels: Record<string, string> = {
    EN_ATTENTE: 'En attente',
    VALIDE: 'Validé',
    CONFIRME: 'Confirmé',
    ENCAISSE: 'Encaissé',
    REJETE: 'Rejeté',
    REMBOURSE: 'Remboursé',
    EN_COURS: 'En cours',
    PARTIEL: 'Partiel',
  };
  return labels[statut] ?? statut;
}

/** Get display label for ModePaiement */
export function getModePaiementLabel(mode: string): string {
  const labels: Record<string, string> = {
    ESPECES: 'Espèces',
    VIREMENT: 'Virement',
    CHEQUE: 'Chèque',
    MOBILE_MONEY: 'Mobile Money',
    ORANGE_MONEY: 'Orange Money',
    MTN_MONEY: 'MTN Money',
    MOOV_MONEY: 'Moov Money',
    CARTE: 'Carte',
    CARTE_BANCAIRE: 'Carte Bancaire',
    PAYCARD: 'PayCard',
  };
  return labels[mode] ?? mode;
}

/** Normalize a Client from backend format to frontend format */
export function normalizeClient(c: Client): Client {
  return {
    ...c,
    numeroCni: c.numeroCni ?? c.numeroPiece,
    raisonSociale: c.raisonSociale ?? c.denominationSociale,
  };
}

/** Normalize a Dossier from backend format to frontend format */
export function normalizeDossier(d: Dossier): Dossier {
  return {
    ...d,
    code: d.code ?? d.numeroDossier ?? `D-${d.id}`,
    montant: d.montant ?? d.montantTotal,
    notaireId: d.notaireId ?? d.notaireChargeId,
    assistantId: d.assistantId ?? d.assistantChargeId,
    dateCreation: d.dateCreation ?? d.dateOuverture ?? d.createdAt,
  };
}

/** Get display label for DossierStatut */
export function getDossierStatutLabel(statut: string): string {
  const labels: Record<string, string> = {
    EN_COURS: 'En cours',
    EN_SIGNATURE: 'En signature',
    EN_ATTENTE_SIGNATURE: 'En attente de signature',
    EN_ATTENTE_PIECES: 'En attente de pièces',
    EN_ATTENTE: 'En attente',
    EN_ATTENTE_VALIDATION: 'En attente de validation',
    PRET_SIGNATURE: 'Prêt pour signature',
    TERMINE: 'Terminé',
    CLOTURE: 'Clôturé',
    SUSPENDU: 'Suspendu',
    ARCHIVE: 'Archivé',
    ANNULE: 'Annulé',
    BROUILLON: 'Brouillon',
    SIGNE: 'Signé',
    ENREGISTRE: 'Enregistré',
  };
  return labels[statut] ?? statut;
}
