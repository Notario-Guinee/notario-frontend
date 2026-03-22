import apiClient from "../lib/apiClient";
import type { Page } from "../types/api";

const BASE_FICHIERS = "/api/archives-numeriques/fichiers";
const BASE_INDEXATION = "/api/archives-numeriques/indexation";

export const archivesNumeriqueService = {
  async getFichiers(page = 0, size = 20, search?: string): Promise<Page<unknown>> {
    return apiClient.get<Page<unknown>>(BASE_FICHIERS, { page, size, search });
  },

  async getFichier(id: number): Promise<unknown> {
    return apiClient.get<unknown>(`${BASE_FICHIERS}/${id}`);
  },

  async uploadFichier(data: unknown): Promise<unknown> {
    return apiClient.post<unknown>(BASE_FICHIERS, data);
  },

  async deleteFichier(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE_FICHIERS}/${id}`);
  },

  async searchFichiers(query: string): Promise<unknown[]> {
    return apiClient.get<unknown[]>(`${BASE_FICHIERS}/search`, { q: query });
  },

  async getIndexation(fichierId: number): Promise<unknown> {
    return apiClient.get<unknown>(`${BASE_INDEXATION}/${fichierId}`);
  },
};

export default archivesNumeriqueService;
