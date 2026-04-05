// ═══════════════════════════════════════════════════════════════
// clients — Requêtes API paginées pour les clients du cabinet
// GET  /api/clients
// POST /api/clients
// PUT  /api/clients/{id}
// DELETE /api/clients/{id}
// ═══════════════════════════════════════════════════════════════

import { apiClient, fetchPage } from '@/lib/apiClient';
import type { PageResponse, PaginationParams } from '@/types/pagination';
import type { Client, CreateClientPayload } from '@/types/client';

export interface GetClientsParams extends PaginationParams {
  typeClient?: 'PHYSIQUE' | 'MORALE';
}

export async function getClients(params: GetClientsParams): Promise<PageResponse<Client>> {
  const p = new URLSearchParams();
  p.set('page', String(params.page));
  if (params.size !== undefined) p.set('size', String(params.size));
  if (params.search) p.set('search', params.search);
  if (params.typeClient) p.set('typeClient', params.typeClient);
  if (params.sortBy) p.set('sortBy', params.sortBy);
  if (params.sortDir) p.set('sortDir', params.sortDir);
  return fetchPage<PageResponse<Client>>(`/api/clients?${p.toString()}`);
}

export async function createClient(data: CreateClientPayload): Promise<Client> {
  return apiClient.post<Client>('/api/clients', data);
}

export async function updateClient(id: string | number, data: Partial<CreateClientPayload>): Promise<Client> {
  return apiClient.put<Client>(`/api/clients/${id}`, data);
}

export async function deleteClient(id: string | number): Promise<void> {
  return apiClient.delete<void>(`/api/clients/${id}`);
}

export async function toggleClientStatus(id: string | number): Promise<Client> {
  return apiClient.patch<Client>(`/api/clients/${id}/toggle-status`);
}

// ═══════════════════════════════════════════════════════════════
// Fonctions API additionnelles
// ═══════════════════════════════════════════════════════════════

export interface ClientStatistiquesGlobales {
  total: number;
  physiques: number;
  morales: number;
  actifs: number;
}

/** Réponse brute du backend (noms différents du frontend) */
interface ClientStatistiquesGlobalesRaw {
  totalClients?: number;
  personnesPhysiques?: number;
  personnesMorales?: number;
  clientsActifs?: number;
  clientsInactifs?: number;
  // Fallback : accepte aussi les noms courts si le backend évolue
  total?: number;
  physiques?: number;
  morales?: number;
  actifs?: number;
}

export interface HistoriqueEntry {
  id: string | number;
  date: string;
  type: string;
  description: string;
}

export async function getClientById(id: string | number): Promise<Client> {
  return apiClient.get<Client>(`/api/clients/${id}`);
}

export async function getClientHistorique(id: string | number): Promise<HistoriqueEntry[]> {
  return apiClient.get<HistoriqueEntry[]>(`/api/clients/${id}/historique`);
}

export async function getClientContacts(id: string | number): Promise<unknown[]> {
  return apiClient.get<unknown[]>(`/api/clients/${id}/contacts`);
}

export async function addClientContact(id: string | number, payload: Record<string, unknown>): Promise<unknown> {
  return apiClient.post<unknown>(`/api/clients/${id}/contacts`, payload);
}

export async function updateClientContact(clientId: string | number, contactId: string | number, payload: Record<string, unknown>): Promise<unknown> {
  return apiClient.put<unknown>(`/api/clients/${clientId}/contacts/${contactId}`, payload);
}

export async function deleteClientContact(clientId: string | number, contactId: string | number): Promise<void> {
  return apiClient.delete<void>(`/api/clients/${clientId}/contacts/${contactId}`);
}

export async function setContactPrincipal(clientId: string | number, contactId: string | number): Promise<unknown> {
  return apiClient.patch<unknown>(`/api/clients/${clientId}/contacts/${contactId}/set-principal`);
}

export async function getClientStatistiques(id: string | number): Promise<Record<string, unknown>> {
  return apiClient.get<Record<string, unknown>>(`/api/clients/${id}/statistiques`);
}

export async function getStatistiquesGlobales(): Promise<ClientStatistiquesGlobales> {
  const raw = await apiClient.get<ClientStatistiquesGlobalesRaw>('/api/clients/statistiques/global');
  return {
    total: raw.totalClients ?? raw.total ?? 0,
    physiques: raw.personnesPhysiques ?? raw.physiques ?? 0,
    morales: raw.personnesMorales ?? raw.morales ?? 0,
    actifs: raw.clientsActifs ?? raw.actifs ?? 0,
  };
}

/** Headers d'auth pour les requêtes blob (export) */
function blobAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const tenantId = payload.tenantId ?? payload.tenant_id ?? payload.tenant;
      if (tenantId) headers["X-Tenant-ID"] = tenantId;
    } catch { /* ignore */ }
  }
  return headers;
}

export async function exportClientsCsv(): Promise<Blob> {
  const res = await fetch('/api/clients/export/csv', { headers: blobAuthHeaders() });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.blob();
}

export async function exportClientsExcel(): Promise<Blob> {
  const res = await fetch('/api/clients/export/excel', { headers: blobAuthHeaders() });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.blob();
}

export async function validateEmail(email: string): Promise<unknown> {
  return apiClient.get<unknown>(`/api/clients/validate/email?email=${encodeURIComponent(email)}`);
}

export async function validateRccm(rccm: string): Promise<unknown> {
  return apiClient.get<unknown>(`/api/clients/validate/rccm?numeroRccm=${encodeURIComponent(rccm)}`);
}

export async function validateNif(nif: string): Promise<unknown> {
  return apiClient.get<unknown>(`/api/clients/validate/nif?nif=${encodeURIComponent(nif)}`);
}

// ═══════════════════════════════════════════════════════════════
// Fonctions de filtrage et gestion avancée
// ═══════════════════════════════════════════════════════════════

export async function getClientsByType(typeClient: 'PHYSIQUE' | 'MORALE'): Promise<Client[]> {
  return apiClient.get<Client[]>(`/api/clients/type/${typeClient}`);
}

export async function getClientsByStatus(actif: boolean): Promise<Client[]> {
  return apiClient.get<Client[]>(`/api/clients/status/${actif}`);
}

export async function getRecentClients(): Promise<Client[]> {
  return apiClient.get<Client[]>('/api/clients/recent');
}

export async function getInactiveClients(days: number): Promise<Client[]> {
  return apiClient.get<Client[]>(`/api/clients/inactive?days=${days}`);
}

export async function getVipClients(): Promise<Client[]> {
  return apiClient.get<Client[]>('/api/clients/vip');
}

export async function mergeClients(sourceId: string | number, targetId: string | number): Promise<Client> {
  return apiClient.post<Client>(`/api/clients/${sourceId}/merge/${targetId}`);
}

export async function getClientDuplicates(id: string | number): Promise<Client[]> {
  return apiClient.get<Client[]>(`/api/clients/${id}/duplicates`);
}
