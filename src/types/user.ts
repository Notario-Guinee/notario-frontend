export type UserRole = 'NOTAIRE' | 'CLERC' | 'STAGIAIRE' | 'ADMIN';

export interface User {
  id: string | number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  adresse?: string;
  photoUrl?: string;
  role: UserRole;
  actif: boolean;
  emailVerifie?: boolean;
  compteVerrouille?: boolean;
  derniereConnexion?: string;
  nomComplet?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  adresse?: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  actif?: boolean;
}

export interface UpdateUserPayload {
  role?: UserRole;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  adresse?: string;
}
