import apiClient from "../lib/apiClient";

const BASE = "/api/dossiers/types-actes";

export const acteService = {
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
};

export default acteService;
