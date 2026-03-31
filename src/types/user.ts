export type UserRole = 'NOTAIRE' | 'CLERC' | 'STAGIAIRE' | 'ADMIN';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  actif: boolean;
  createdAt: string;
}
