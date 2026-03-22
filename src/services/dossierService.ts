import apiClient from "../lib/apiClient";
import type {
  Dossier,
  CreateDossierPayload,
  UpdateDossierPayload,
  DossierStatut,
  Page,
} from "../types/api";
import { normalizeDossier } from "../lib/dataUtils";

const BASE = "/api/dossiers";

export const dossierService = {
  /**
   * Fetch a paginated list of dossiers with optional filters.
   */
  async getAll(
    page = 0,
    size = 20,
    statut?: DossierStatut,
    search?: string
  ): Promise<Page<Dossier>> {
    const result = await apiClient.get<Page<Dossier>>(BASE, { page, size, statut, search });
    return { ...result, content: result.content.map(normalizeDossier) };
  },

  /**
   * Fetch a single dossier by ID.
   */
  async getById(id: number): Promise<Dossier> {
    const result = await apiClient.get<Dossier>(`${BASE}/${id}`);
    return normalizeDossier(result);
  },

  /**
   * Create a new dossier.
   */
  async create(data: CreateDossierPayload): Promise<Dossier> {
    const result = await apiClient.post<Dossier>(BASE, data);
    return normalizeDossier(result);
  },

  /**
   * Update an existing dossier.
   */
  async update(id: number, data: UpdateDossierPayload): Promise<Dossier> {
    const result = await apiClient.put<Dossier>(`${BASE}/${id}`, data);
    return normalizeDossier(result);
  },

  /**
   * Delete a dossier by ID.
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE}/${id}`);
  },

  /**
   * Change the statut of a dossier.
   */
  async changeStatut(id: number, statut: DossierStatut): Promise<Dossier> {
    const result = await apiClient.put<Dossier>(`${BASE}/${id}/statut`, { statut });
    return normalizeDossier(result);
  },
};

export default dossierService;
