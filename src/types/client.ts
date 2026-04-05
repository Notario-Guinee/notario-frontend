export type TypeClient = 'PHYSIQUE' | 'MORALE';

export interface Client {
  id: string | number;
  codeClient?: string;
  typeClient: TypeClient;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  photoUrl?: string;
  actif?: boolean;
  datePremiereVisite?: string;
  profession?: string;
  // Entreprise
  denominationSociale?: string;
  sigle?: string;
  formeJuridique?: string;
  secteurActivite?: string;
  numeroRccm?: string;
  nif?: string;
  // Computed by backend
  nomComplet?: string;
  nomAffichage?: string;
  noteDescriptive?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClientPayload {
  typeClient: TypeClient;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  profession?: string;
  adresse?: string;
  denominationSociale?: string;
  secteurActivite?: string;
  noteDescriptive?: string;
}
