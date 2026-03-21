import apiClient from "../lib/apiClient";
import type { CabinetConfig } from "../types/api";

const BASE = "/api/cabinet/config";

export const cabinetService = {
  /**
   * Fetch the cabinet configuration.
   */
  async getConfig(): Promise<CabinetConfig> {
    return apiClient.get<CabinetConfig>(BASE);
  },

  /**
   * Update the cabinet configuration.
   */
  async updateConfig(data: Partial<CabinetConfig>): Promise<CabinetConfig> {
    return apiClient.put<CabinetConfig>(BASE, data);
  },
};

export default cabinetService;
