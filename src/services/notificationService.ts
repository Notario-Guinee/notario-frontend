import apiClient from "../lib/apiClient";
import type { Notification } from "../types/api";

const BASE = "/api/notifications";

export const notificationService = {
  /**
   * Fetch all notifications for the current user.
   */
  async getAll(): Promise<Notification[]> {
    return apiClient.get<Notification[]>(BASE);
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id: number): Promise<Notification> {
    return apiClient.put<Notification>(`${BASE}/${id}/read`);
  },

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead(): Promise<void> {
    return apiClient.put<void>(`${BASE}/read-all`);
  },

  /**
   * Delete a notification by ID.
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE}/${id}`);
  },
};

export default notificationService;
