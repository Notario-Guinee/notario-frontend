export type StatutFacture = 'BROUILLON' | 'ENVOYEE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';

export interface Facture {
  id: string;
  numero: string;
  clientNomComplet: string;
  dossierReference?: string;
  montantHT: number;
  montantTTC: number;
  statut: StatutFacture;
  dateEmission: string;
  dateEcheance: string;
  devise: string;
}
