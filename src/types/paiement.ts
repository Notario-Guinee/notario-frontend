export type ModePaiement = 'ESPECES' | 'VIREMENT' | 'CHEQUE' | 'WAVE' | 'ORANGE_MONEY' | 'MTN_MONEY';

export type StatutPaiement = 'EN_ATTENTE' | 'CONFIRME' | 'ECHEC' | 'REMBOURSE';

export interface Paiement {
  id: string;
  reference: string;
  factureNumero: string;
  clientNomComplet: string;
  montant: number;
  devise: string;
  modePaiement: ModePaiement;
  statut: StatutPaiement;
  datePaiement: string;
  referenceMobileMoney?: string;
}
