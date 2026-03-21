import apiClient from "../lib/apiClient";
import type { Client, CreateClientPayload, UpdateClientPayload, Page } from "../types/api";

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
    return apiClient.get<Page<Client>>(BASE, { page, size, search });
  },

  /**
   * Fetch a single client by ID.
   */
  async getById(id: number): Promise<Client> {
    return apiClient.get<Client>(`${BASE}/${id}`);
  },

  /**
   * Create a new client.
   */
  async create(data: CreateClientPayload): Promise<Client> {
    return apiClient.post<Client>(BASE, data);
  },

  /**
   * Update an existing client.
   */
  async update(id: number, data: UpdateClientPayload): Promise<Client> {
    return apiClient.put<Client>(`${BASE}/${id}`, data);
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
    return apiClient.get<Client[]>(`${BASE}/search`, { q: query });
  },
};

export default clientService;
