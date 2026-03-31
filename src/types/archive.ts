export type TypeArchive = 'ACTE_NOTARIE' | 'REGISTRE' | 'REPERTOIRE' | 'DOSSIER_CLOTURE' | 'AUTRE';

export interface Archive {
  id: string;
  reference: string;
  titre: string;
  typeArchive: TypeArchive;
  annee: number;
  localisationPhysique?: string;
  localisationNumerique: string;
  indexMotsCles: string[];
  responsableNomComplet: string;
  dateArchivage: string;
  nombrePages?: number;
}
