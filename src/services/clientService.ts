import apiClient from "../lib/apiClient";
import type { Client, CreateClientPayload, UpdateClientPayload, Page } from "../types/api";
import { normalizeClient } from "../lib/dataUtils";

const BASE = "/api/clients";

export const clientService = {
  /**
   * Fetch a paginated list of clients.
   * If search is provided, delegates to the search endpoint (searchTerm param).
   */
  async getAll(
    page = 0,
    size = 20,
    search?: string
  ): Promise<Page<Client>> {
    if (search) {
      const result = await apiClient.get<Page<Client>>(`${BASE}/search`, { searchTerm: search, page, size });
      return { ...result, content: result.content.map(normalizeClient) };
    }
    const result = await apiClient.get<Page<Client>>(BASE, { page, size });
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
    const results = await apiClient.get<Client[]>(`${BASE}/search`, { searchTerm: query });
    return results.map(normalizeClient);
  },
};

export default clientService;
