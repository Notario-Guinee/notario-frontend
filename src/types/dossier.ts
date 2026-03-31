export type StatutDossier = 'OUVERT' | 'EN_COURS' | 'CLOTURE' | 'ARCHIVE';

export interface Dossier {
  id: string;
  reference: string;
  titre: string;
  typeActe: string;
  statut: StatutDossier;
  clientNomComplet: string;
  notaireNomComplet: string;
  dateCreation: string;
  dateEcheance?: string;
}
