import apiClient from "../lib/apiClient";
import type { Page } from "../types/api";

const BASE = "/api/formations";

export const formationService = {
  async getAll(page = 0, size = 20): Promise<Page<unknown>> {
    return apiClient.get<Page<unknown>>(BASE, { page, size });
  },

  async getById(id: number): Promise<unknown> {
    return apiClient.get<unknown>(`${BASE}/${id}`);
  },

  async getProgress(formationId: number): Promise<unknown> {
    return apiClient.get<unknown>(`${BASE}/progress/${formationId}`);
  },

  async updateProgress(formationId: number, data: unknown): Promise<unknown> {
    return apiClient.put<unknown>(`${BASE}/progress/${formationId}`, data);
  },

  async enroll(formationId: number): Promise<unknown> {
    return apiClient.post<unknown>(`${BASE}/${formationId}/enroll`);
  },
};

export default formationService;
