import apiClient from "../lib/apiClient";
import type {
  Dossier,
  CreateDossierPayload,
  UpdateDossierPayload,
  DossierStatut,
  Page,
} from "../types/api";

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
    return apiClient.get<Page<Dossier>>(BASE, { page, size, statut, search });
  },

  /**
   * Fetch a single dossier by ID.
   */
  async getById(id: number): Promise<Dossier> {
    return apiClient.get<Dossier>(`${BASE}/${id}`);
  },

  /**
   * Create a new dossier.
   */
  async create(data: CreateDossierPayload): Promise<Dossier> {
    return apiClient.post<Dossier>(BASE, data);
  },

  /**
   * Update an existing dossier.
   */
  async update(id: number, data: UpdateDossierPayload): Promise<Dossier> {
    return apiClient.put<Dossier>(`${BASE}/${id}`, data);
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
    return apiClient.put<Dossier>(`${BASE}/${id}/statut`, { statut });
  },
};

export default dossierService;
