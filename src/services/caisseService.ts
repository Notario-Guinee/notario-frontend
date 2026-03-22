import apiClient from "../lib/apiClient";
import type { Page } from "../types/api";

const BASE_OPERATIONS = "/api/caisse/operations";
const BASE_DEBOURS = "/api/caisse/debours";

export const caisseService = {
  // ─── Operations ────────────────────────────────────────────────────────────

  async getOperations(
    page = 0,
    size = 20,
    type?: string,
    statut?: string
  ): Promise<Page<unknown>> {
    return apiClient.get<Page<unknown>>(BASE_OPERATIONS, { page, size, type, statut });
  },

  async getOperation(id: number): Promise<unknown> {
    return apiClient.get<unknown>(`${BASE_OPERATIONS}/${id}`);
  },

  async createOperation(data: unknown): Promise<unknown> {
    return apiClient.post<unknown>(BASE_OPERATIONS, data);
  },

  async updateOperation(id: number, data: unknown): Promise<unknown> {
    return apiClient.put<unknown>(`${BASE_OPERATIONS}/${id}`, data);
  },

  async deleteOperation(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE_OPERATIONS}/${id}`);
  },

  // ─── Debours ───────────────────────────────────────────────────────────────

  async getDebours(
    page = 0,
    size = 20,
    statut?: string
  ): Promise<Page<unknown>> {
    return apiClient.get<Page<unknown>>(BASE_DEBOURS, { page, size, statut });
  },

  async getDebour(id: number): Promise<unknown> {
    return apiClient.get<unknown>(`${BASE_DEBOURS}/${id}`);
  },

  async createDebour(data: unknown): Promise<unknown> {
    return apiClient.post<unknown>(BASE_DEBOURS, data);
  },

  async avancerDebour(id: number): Promise<unknown> {
    return apiClient.post<unknown>(`${BASE_DEBOURS}/${id}/avancer`);
  },

  async justifierDebour(id: number): Promise<unknown> {
    return apiClient.post<unknown>(`${BASE_DEBOURS}/${id}/justifier`);
  },

  async factureDebour(id: number, factureId: number): Promise<unknown> {
    return apiClient.post<unknown>(`${BASE_DEBOURS}/${id}/facture/${factureId}`);
  },
};

export default caisseService;
