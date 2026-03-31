export type StatutFormation = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export interface Formation {
  id: string;
  titre: string;
  description: string;
  statut: StatutFormation;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  nombreParticipants: number;
  capaciteMax: number;
  formateurNomComplet: string;
}
