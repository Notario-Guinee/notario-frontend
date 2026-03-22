import apiClient from "../lib/apiClient";
import type { Page } from "../types/api";

const BASE_TEMPLATES = "/api/templates";
const BASE_GENERATION = "/api/modeles-documents/generation";

export const modelesDocumentsService = {
  async getAll(page = 0, size = 20): Promise<Page<unknown>> {
    return apiClient.get<Page<unknown>>(BASE_TEMPLATES, { page, size });
  },

  async getById(id: number): Promise<unknown> {
    return apiClient.get<unknown>(`${BASE_TEMPLATES}/${id}`);
  },

  async create(data: unknown): Promise<unknown> {
    return apiClient.post<unknown>(BASE_TEMPLATES, data);
  },

  async update(id: number, data: unknown): Promise<unknown> {
    return apiClient.put<unknown>(`${BASE_TEMPLATES}/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE_TEMPLATES}/${id}`);
  },

  async generate(templateId: number, data: unknown): Promise<unknown> {
    return apiClient.post<unknown>(`${BASE_GENERATION}/${templateId}`, data);
  },
};

export default modelesDocumentsService;
