// ═══════════════════════════════════════════════════════════════
// Service Clients — Centralise tous les appels API du module clients
// Basé sur les endpoints disponibles dans ClientController.java
// ═══════════════════════════════════════════════════════════════

const getHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const BASE = "/api/clients";

// Helper robuste pour gérer les réponses API et extraire les erreurs réelles du backend (Swagger compatible)
async function handleResponse(res: Response) {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    if (data && data.success === false) {
      // Priorité aux détails de validation (errorDetails) puis au message global
      const firstError = data.errorDetails && Object.keys(data.errorDetails).length > 0
        ? Object.values(data.errorDetails)[0]
        : data.message;
      throw new Error(firstError as string || `Erreur serveur (Status: ${res.status})`);
    }
    throw new Error(data?.message || `Erreur technique : ${res.statusText} (Status: ${res.status})`);
  }
  return data;
}

// ─── Types TypeScript basés sur ClientDto.java ───
export interface Client {
  id: number;
  tenantId: string;
  codeClient: string;
  typeClient: "PHYSIQUE" | "MORALE";
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  photoUrl?: string;
  actif: boolean;
  datePremiereVisite?: string;
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  profession?: string;
  typePieceIdentite?: string;
  numeroPiece?: string;
  dateDelivrance?: string;
  dateExpiration?: string;
  lieuDelivrance?: string;
  denominationSociale?: string;
  sigle?: string;
  formeJuridique?: string;
  secteurActivite?: string;
  numeroRccm?: string;
  nif?: string;
  capitalSocial?: number;
  dateCreation?: string;
  nomContact?: string;
  prenomContact?: string;
  fonctionContact?: string;
  telephoneContact?: string;
  emailContact?: string;
  descriptionActivites?: string;
  noteDescriptive?: string;
  observations?: string;
  nomComplet?: string;
  nomAffichage?: string;
  pieceIdentiteExpiree?: boolean;
  contacts?: ClientContact[];
  nombreDossiers?: number;
  nombreDossiersActifs?: number;
  derniereInteraction?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientContact {
  id: number;
  nom: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  fonction?: string;
  principal?: boolean;
}

export interface ClientStatistiques {
  totalClients: number;
  clientsActifs: number;
  clientsInactifs: number;
  personnesPhysiques: number;
  personnesMorales: number;
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

export async function getClients(page = 0, size = 20): Promise<PagedResponse<Client>> {
  const res = await fetch(`${BASE}?page=${page}&size=${size}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getClientById(id: number): Promise<Client> {
  const res = await fetch(`${BASE}/${id}`, { headers: getHeaders() });
  const data = await handleResponse(res);
  return data.data;
}

export async function createClient(payload: Partial<Client>, createdBy: string): Promise<Client> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ ...payload, createdBy, updatedBy: createdBy }),
  });
  const data = await handleResponse(res);
  return data.data;
}

export async function updateClient(id: number, payload: Partial<Client>, updatedBy: string): Promise<Client> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ ...payload, updatedBy }),
  });
  const data = await handleResponse(res);
  return data.data;
}

export async function deleteClient(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  await handleResponse(res);
}

export async function toggleClientStatus(id: number): Promise<Client> {
  const res = await fetch(`${BASE}/${id}/toggle-status`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  const data = await handleResponse(res);
  return data.data;
}

export async function searchClients(searchTerm: string, page = 0, size = 20): Promise<PagedResponse<Client>> {
  const res = await fetch(`${BASE}/search?searchTerm=${encodeURIComponent(searchTerm)}&page=${page}&size=${size}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function advancedSearch(
  params: { typeClient?: "PHYSIQUE" | "MORALE"; actif?: boolean; ville?: string; searchTerm?: string },
  page = 0,
  size = 20
): Promise<PagedResponse<Client>> {
  const queryParams = new URLSearchParams();
  if (params.typeClient) queryParams.append("typeClient", params.typeClient);
  if (params.actif !== undefined) queryParams.append("actif", String(params.actif));
  if (params.ville) queryParams.append("ville", params.ville);
  if (params.searchTerm) queryParams.append("searchTerm", params.searchTerm);
  queryParams.append("page", String(page));
  queryParams.append("size", String(size));

  const res = await fetch(`${BASE}/advanced-search?${queryParams.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getClientsByStatus(actif: boolean, page = 0, size = 20): Promise<PagedResponse<Client>> {
  const res = await fetch(`${BASE}/status/${actif}?page=${page}&size=${size}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getInactiveClients(days = 90, page = 0, size = 20): Promise<PagedResponse<Client>> {
  const res = await fetch(`${BASE}/inactive?days=${days}&page=${page}&size=${size}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getClientsByType(typeClient: "Personne Physique" | "Personne Morale"): Promise<Client[]> {
  const res = await fetch(`${BASE}/type/${typeClient}`, { headers: getHeaders() });
  const data = await handleResponse(res);
  return data.data || data.content || [];
}

export async function getRecentClients(): Promise<Client[]> {
  const res = await fetch(`${BASE}/recent`, { headers: getHeaders() });
  const data = await handleResponse(res);
  return data.data;
}

// ─── Clients VIP ───
export async function getVipClients(): Promise<Client[]> {
  const res = await fetch(`${BASE}/vip`, { headers: getHeaders() });
  const data = await res.json();
  return data.content || data.data || [];
}

export async function getClientHistorique(id: number): Promise<any[]> {
  const res = await fetch(`${BASE}/${id}/historique`, { headers: getHeaders() });
  const data = await handleResponse(res);
  return data.data;
}

export async function addClientHistorique(id: number, payload: { type: string; description: string }): Promise<any> {
  const res = await fetch(`${BASE}/${id}/historique`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(res);
  return data.data;
}

export async function getClientContacts(id: number): Promise<ClientContact[]> {
  const res = await fetch(`${BASE}/${id}/contacts`, { headers: getHeaders() });
  const data = await handleResponse(res);
  return data.data;
}

export async function addClientContact(id: number, payload: Partial<ClientContact>): Promise<ClientContact> {
  const res = await fetch(`${BASE}/${id}/contacts`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(res);
  return data.data;
}

export async function updateClientContact(clientId: number, contactId: number, payload: Partial<ClientContact>): Promise<ClientContact> {
  const res = await fetch(`${BASE}/${clientId}/contacts/${contactId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(res);
  return data.data;
}

export async function deleteClientContact(clientId: number, contactId: number): Promise<void> {
  const res = await fetch(`${BASE}/${clientId}/contacts/${contactId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  await handleResponse(res);
}

export async function setContactPrincipal(clientId: number, contactId: number): Promise<void> {
  const res = await fetch(`${BASE}/${clientId}/contacts/${contactId}/set-principal`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  await handleResponse(res);
}

export async function getClientStatistiques(id: number): Promise<any> {
  const res = await fetch(`${BASE}/${id}/statistiques`, { headers: getHeaders() });
  const data = await handleResponse(res);
  return data.data;
}

export async function getStatistiquesGlobales(): Promise<ClientStatistiques> {
  const res = await fetch(`${BASE}/statistiques/global`, { headers: getHeaders() });
  const data = await handleResponse(res);
  return data.data;
}

export async function mergeClients(sourceId: number, targetId: number): Promise<Client> {
  const res = await fetch(`${BASE}/${sourceId}/merge/${targetId}`, {
    method: "POST",
    headers: getHeaders(),
  });
  const data = await handleResponse(res);
  return data.data;
}

export async function getClientDuplicates(id: number): Promise<Client[]> {
  const res = await fetch(`${BASE}/${id}/duplicates`, { headers: getHeaders() });
  const data = await handleResponse(res);
  return data.data;
}


export async function validateEmail(email: string): Promise<boolean> {
  const res = await fetch(`${BASE}/validate/email?email=${encodeURIComponent(email)}`, {
    headers: getHeaders(),
  });
  const data = await handleResponse(res);
  return data.success && data.data === true;
}

export async function validateRccm(rccm: string): Promise<boolean> {
  const res = await fetch(`${BASE}/validate/rccm?numeroRccm=${encodeURIComponent(rccm)}`, {
    headers: getHeaders(),
  });
  const data = await handleResponse(res);
  return data.success && data.data === true;
}

export async function validateNif(nif: string): Promise<boolean> {
  const res = await fetch(`${BASE}/validate/nif?nif=${encodeURIComponent(nif)}`, {
    headers: getHeaders(),
  });
  const data = await handleResponse(res);
  return data.success && data.data === true;
}

// ─── Export CSV ───
export async function exportClientsCsv(): Promise<void> {
  const res = await fetch(`${BASE}/export/csv`, { headers: getHeaders() });
  if (!res.ok) {
    await handleResponse(res);
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clients_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Export Excel ───
export async function exportClientsExcel(): Promise<void> {
  const res = await fetch(`${BASE}/export/excel`, { headers: getHeaders() });
  if (!res.ok) {
    await handleResponse(res);
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clients_${new Date().toISOString().split("T")[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
