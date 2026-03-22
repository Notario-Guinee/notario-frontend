import apiClient from "../lib/apiClient";
import type {
  Facture,
  CreateFacturePayload,
  UpdateFacturePayload,
  FactureStatut,
  Page,
} from "../types/api";
import { normalizeFacture } from "../lib/dataUtils";

const BASE = "/api/factures";

export const factureService = {
  /**
   * Fetch a paginated list of factures with optional filters.
   */
  async getAll(
    page = 0,
    size = 20,
    statut?: FactureStatut,
    search?: string
  ): Promise<Page<Facture>> {
    const result = await apiClient.get<Page<Facture>>(BASE, { page, size, statut, search });
    return { ...result, content: result.content.map(normalizeFacture) };
  },

  /**
   * Fetch a single facture by ID.
   */
  async getById(id: number): Promise<Facture> {
    const result = await apiClient.get<Facture>(`${BASE}/${id}`);
    return normalizeFacture(result);
  },

  /**
   * Create a new facture (starts as BROUILLON).
   */
  async create(data: CreateFacturePayload): Promise<Facture> {
    const result = await apiClient.post<Facture>(BASE, data);
    return normalizeFacture(result);
  },

  /**
   * Update an existing facture.
   */
  async update(id: number, data: UpdateFacturePayload): Promise<Facture> {
    const result = await apiClient.put<Facture>(`${BASE}/${id}`, data);
    return normalizeFacture(result);
  },

  /**
   * Delete a facture by ID.
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE}/${id}`);
  },

  /**
   * Finalise a facture (transition BROUILLON → EMISE).
   */
  async finaliser(id: number): Promise<Facture> {
    const result = await apiClient.post<Facture>(`${BASE}/${id}/finaliser`);
    return normalizeFacture(result);
  },

  /**
   * Cancel a facture.
   */
  async annuler(id: number): Promise<Facture> {
    const result = await apiClient.post<Facture>(`${BASE}/${id}/annuler`);
    return normalizeFacture(result);
  },
};

export default factureService;
