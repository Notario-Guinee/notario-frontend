// ═══════════════════════════════════════════════════════════════
// Service Utilisateurs — Centralise tous les appels API du module users
// Basé sur les endpoints disponibles dans UserController.java
// ═══════════════════════════════════════════════════════════════

const getHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };
  
  const BASE = "/api/users";
  
  // ─── Types TypeScript basés sur UserDto.java ───
  export type UserRole = "ADMIN" | "GERANT" | "STANDARD" | "CLIENT" | "NOTAIRE";
  
  export interface User {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    role: UserRole;
    actif: boolean;
    dateNaissance?: string;
    lieuNaissance?: string;
    adresse?: string;
    photoUrl?: string;
    nomComplet?: string;
    initiales?: string;
    compteVerrouille?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface UserPreferences {
    theme: "light" | "dark" | "system";
    language: "FR" | "EN";
    notificationsEmail: boolean;
    notificationsSms: boolean;
    notificationsPush: boolean;
    dashboardLayout: string;
  }

  export interface PagedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
    first: boolean;
    last: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
  }

  // ─── Aide à la gestion des réponses ───
  async function handleResponse(res: Response) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok || (data && data.success === false)) {
      const firstError = data.errorDetails && typeof data.errorDetails === 'object'
        ? Object.values(data.errorDetails)[0]
        : data.message;
      throw new Error(firstError as string || `Erreur serveur (Status: ${res.status})`);
    }
    return data;
  }
  
  // ─── Liste paginée des utilisateurs ───
  export async function getUsers(page = 0, size = 20): Promise<PagedResponse<User>> {
    const res = await fetch(`${BASE}?page=${page}&size=${size}`, { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }
  
  // ─── Récupérer un utilisateur par ID ───
  export async function getUserById(id: number): Promise<User> {
    const res = await fetch(`${BASE}/${id}`, { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }
  
  // ─── Créer un utilisateur ───
  export async function createUser(payload: any): Promise<User> {
    const res = await fetch(BASE, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(res);
    return data.data;
  }
  
  // ─── Mettre à jour un utilisateur ───
  export async function updateUser(id: number, payload: any): Promise<User> {
    const res = await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(res);
    return data.data;
  }
  
  // ─── Supprimer un utilisateur ───
  export async function deleteUser(id: number): Promise<void> {
    const res = await fetch(`${BASE}/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    await handleResponse(res);
  }
  
  // ─── Recherche d'utilisateurs ───
  export async function searchUsers(query: string, page = 0, size = 20): Promise<PagedResponse<User>> {
    const res = await fetch(`${BASE}/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`, {
      headers: getHeaders(),
    });
    const data = await handleResponse(res);
    return data.data;
  }

  // ─── Lister les utilisateurs actifs ───
  export async function getActiveUsers(): Promise<User[]> {
    const res = await fetch(`${BASE}/active`, { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }

  // ─── Lister les utilisateurs par rôle ───
  export async function getUsersByRole(role: UserRole): Promise<User[]> {
    const res = await fetch(`${BASE}/role/${role}`, { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }

  // ─── Gestion du statut (Activé / Désactivé / Verrouillé) ───
  export async function activateUser(id: number): Promise<void> {
    const res = await fetch(`${BASE}/${id}/activate`, { method: "PATCH", headers: getHeaders() });
    await handleResponse(res);
  }
  
  export async function deactivateUser(id: number): Promise<void> {
    const res = await fetch(`${BASE}/${id}/deactivate`, { method: "PATCH", headers: getHeaders() });
    await handleResponse(res);
  }

  export async function lockAccount(id: number): Promise<void> {
    const res = await fetch(`${BASE}/${id}/lock`, { method: "PATCH", headers: getHeaders() });
    await handleResponse(res);
  }

  export async function unlockAccount(id: number): Promise<void> {
    const res = await fetch(`${BASE}/${id}/unlock`, { method: "PATCH", headers: getHeaders() });
    await handleResponse(res);
  }
  
  // ─── Gestion des mots de passe ───
  export async function changePassword(id: number, ancienMotDePasse: string, nouveauMotDePasse: string): Promise<void> {
    const res = await fetch(`${BASE}/${id}/change-password`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ ancienMotDePasse, nouveauMotDePasse }),
    });
    await handleResponse(res);
  }

  export async function resetPassword(email: string): Promise<void> {
    const res = await fetch(`${BASE}/reset-password`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });
    await handleResponse(res);
  }

  // ─── Préférences utilisateur ───
  export async function getUserPreferences(id: number): Promise<UserPreferences> {
    const res = await fetch(`${BASE}/${id}/preferences`, { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }

  export async function updateUserPreferences(id: number, preferences: UserPreferences): Promise<UserPreferences> {
    const res = await fetch(`${BASE}/${id}/preferences`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(preferences),
    });
    const data = await handleResponse(res);
    return data.data;
  }

  // ─── Statistiques utilisateurs ───
  export async function getUserStatistics(): Promise<Map<string, any>> {
    const res = await fetch(`${BASE}/statistics`, { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }

  export async function getUserRoleDistribution(): Promise<Record<UserRole, number>> {
    const res = await fetch(`${BASE}/statistics/roles`, { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }
