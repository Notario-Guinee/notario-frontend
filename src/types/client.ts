export type TypeClient = 'PARTICULIER' | 'ENTREPRISE';

export interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  typeClient: TypeClient;
  createdAt: string;
}
