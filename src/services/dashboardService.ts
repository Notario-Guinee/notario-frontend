import apiClient from "../lib/apiClient";
import type { DashboardStats, RevenueByMonth, TopClient } from "../types/api";

export const dashboardService = {
  /**
   * Fetch global dashboard statistics.
   */
  async getStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>("/api/dashboard/statistics/global");
  },

  /**
   * Fetch revenue aggregated by month.
   */
  async getRevenueByMonth(): Promise<RevenueByMonth[]> {
    return apiClient.get<RevenueByMonth[]>("/api/synthese/revenue-by-month");
  },

  /**
   * Fetch top clients by billed amount.
   */
  async getTopClients(): Promise<TopClient[]> {
    return apiClient.get<TopClient[]>("/api/synthese/top-clients");
  },

  /**
   * Fetch full financial synthesis.
   */
  async getSyntheseFinanciere(dateDebut?: string, dateFin?: string): Promise<unknown> {
    return apiClient.get("/api/synthese/financiere", { dateDebut, dateFin });
  },
};

export default dashboardService;
