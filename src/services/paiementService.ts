import apiClient from "../lib/apiClient";
import type {
  Paiement,
  CreatePaiementPayload,
  PaiementStatut,
  Page,
} from "../types/api";

const BASE = "/api/paiements";

export const paiementService = {
  /**
   * Fetch a paginated list of paiements with optional filters.
   */
  async getAll(
    page = 0,
    size = 20,
    statut?: PaiementStatut,
    search?: string
  ): Promise<Page<Paiement>> {
    return apiClient.get<Page<Paiement>>(BASE, { page, size, statut, search });
  },

  /**
   * Fetch a single paiement by ID.
   */
  async getById(id: number): Promise<Paiement> {
    return apiClient.get<Paiement>(`${BASE}/${id}`);
  },

  /**
   * Create a new paiement.
   */
  async create(data: CreatePaiementPayload): Promise<Paiement> {
    return apiClient.post<Paiement>(BASE, data);
  },

  /**
   * Update the statut of a paiement (validate, reject, refund…).
   */
  async updateStatut(id: number, statut: PaiementStatut): Promise<Paiement> {
    return apiClient.put<Paiement>(`${BASE}/${id}/status`, { statut });
  },
};

export default paiementService;
