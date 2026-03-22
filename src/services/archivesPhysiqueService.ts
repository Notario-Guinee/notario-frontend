import apiClient from "../lib/apiClient";
import type { Page } from "../types/api";

const BASE_BOITES = "/api/archives/boites";
const BASE_RAYONNAGES = "/api/archives/rayonnages";
const BASE_ESPACES = "/api/archives/espaces";

export const archivesPhysiqueService = {
  async getBoites(page = 0, size = 20): Promise<Page<unknown>> {
    return apiClient.get<Page<unknown>>(BASE_BOITES, { page, size });
  },

  async getBoite(id: number): Promise<unknown> {
    return apiClient.get<unknown>(`${BASE_BOITES}/${id}`);
  },

  async createBoite(data: unknown): Promise<unknown> {
    return apiClient.post<unknown>(BASE_BOITES, data);
  },

  async updateBoite(id: number, data: unknown): Promise<unknown> {
    return apiClient.put<unknown>(`${BASE_BOITES}/${id}`, data);
  },

  async getRayonnages(): Promise<unknown[]> {
    return apiClient.get<unknown[]>(BASE_RAYONNAGES);
  },

  async getEspaces(): Promise<unknown[]> {
    return apiClient.get<unknown[]>(BASE_ESPACES);
  },
};

export default archivesPhysiqueService;
