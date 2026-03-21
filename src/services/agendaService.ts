import apiClient from "../lib/apiClient";
import type {
  RendezVous,
  CreateRendezVousPayload,
  UpdateRendezVousPayload,
} from "../types/api";

const BASE = "/api/agenda/rendez-vous";

export const agendaService = {
  /**
   * Fetch all rendez-vous, optionally filtered by date range.
   */
  async getAll(dateDebut?: string, dateFin?: string): Promise<RendezVous[]> {
    return apiClient.get<RendezVous[]>(BASE, { dateDebut, dateFin });
  },

  /**
   * Fetch a single rendez-vous by ID.
   */
  async getById(id: number): Promise<RendezVous> {
    return apiClient.get<RendezVous>(`${BASE}/${id}`);
  },

  /**
   * Create a new rendez-vous.
   */
  async create(data: CreateRendezVousPayload): Promise<RendezVous> {
    return apiClient.post<RendezVous>(BASE, data);
  },

  /**
   * Update an existing rendez-vous.
   */
  async update(id: number, data: UpdateRendezVousPayload): Promise<RendezVous> {
    return apiClient.put<RendezVous>(`${BASE}/${id}`, data);
  },

  /**
   * Delete a rendez-vous by ID.
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE}/${id}`);
  },
};

export default agendaService;
