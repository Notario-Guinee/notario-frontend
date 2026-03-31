export type TypeEcriture = 'RECETTE' | 'DEPENSE' | 'DEBOURS';

export interface EcritureCaisse {
  id: string;
  libelle: string;
  typeEcriture: TypeEcriture;
  montant: number;
  devise: string;
  categorie: string;
  dossierReference?: string;
  responsableNomComplet: string;
  dateEcriture: string;
  soldeApres: number;
}
