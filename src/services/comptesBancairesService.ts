import apiClient from "../lib/apiClient";
import type { Page } from "../types/api";

const BASE = "/api/comptes-bancaires";

export const comptesBancairesService = {
  async getAll(): Promise<unknown[]> {
    return apiClient.get<unknown[]>(BASE);
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

  async getSolde(id: number): Promise<unknown> {
    return apiClient.get<unknown>(`${BASE}/${id}/solde`);
  },

  async getOperations(id: number, page = 0, size = 20): Promise<Page<unknown>> {
    return apiClient.get<Page<unknown>>(`${BASE}/${id}/operations`, { page, size });
  },
};

export default comptesBancairesService;
