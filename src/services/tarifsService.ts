import apiClient from "../lib/apiClient";
import type { Page } from "../types/api";

const BASE = "/api/tarification";

export const tarifsService = {
  async getAll(page = 0, size = 20): Promise<Page<unknown>> {
    return apiClient.get<Page<unknown>>(BASE, { page, size });
  },

  async getById(id: number): Promise<unknown> {
    return apiClient.get<unknown>(`${BASE}/${id}`);
  },

  async create(data: unknown): Promise<unknown> {
    return apiClient.post<unknown>(BASE, data);
  },

  async update(id: number, data: unknown): Promise<unknown> {
    return apiClient.put<unknown>(`${BASE}/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE}/${id}`);
  },

  async calculate(data: unknown): Promise<unknown> {
    return apiClient.post<unknown>(`${BASE}/calculate`, data);
  },
};

export default tarifsService;
