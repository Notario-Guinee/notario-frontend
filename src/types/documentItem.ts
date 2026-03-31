export type TypeDocument = 'ACTE' | 'ANNEXE' | 'COURRIER' | 'MODELE' | 'AUTRE';

export type FormatDocument = 'PDF' | 'DOCX' | 'XLSX' | 'IMG';

export interface DocumentItem {
  id: string;
  nom: string;
  typeDocument: TypeDocument;
  format: FormatDocument;
  tailleMo: number;
  dossierReference?: string;
  auteurNomComplet: string;
  createdAt: string;
  url: string;
}
