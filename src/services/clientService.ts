import apiClient from "../lib/apiClient";
import type { Client, CreateClientPayload, UpdateClientPayload, Page } from "../types/api";
import { normalizeClient } from "../lib/dataUtils";

const BASE = "/api/clients";

export const clientService = {
  /**
   * Fetch a paginated list of clients, with optional search filter.
   */
  async getAll(
    page = 0,
    size = 20,
    search?: string
  ): Promise<Page<Client>> {
    const result = await apiClient.get<Page<Client>>(BASE, { page, size, search });
    return { ...result, content: result.content.map(normalizeClient) };
  },

  /**
   * Fetch a single client by ID.
   */
  async getById(id: number): Promise<Client> {
    const result = await apiClient.get<Client>(`${BASE}/${id}`);
    return normalizeClient(result);
  },

  /**
   * Create a new client.
   */
  async create(data: CreateClientPayload): Promise<Client> {
    const result = await apiClient.post<Client>(BASE, data);
    return normalizeClient(result);
  },

  /**
   * Update an existing client.
   */
  async update(id: number, data: UpdateClientPayload): Promise<Client> {
    const result = await apiClient.put<Client>(`${BASE}/${id}`, data);
    return normalizeClient(result);
  },

  /**
   * Delete a client by ID.
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE}/${id}`);
  },

  /**
   * Search clients by query string.
   */
  async search(query: string): Promise<Client[]> {
    const results = await apiClient.get<Client[]>(`${BASE}/search`, { q: query });
    return results.map(normalizeClient);
  },
};

export default clientService;
