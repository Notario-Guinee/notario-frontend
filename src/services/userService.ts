import apiClient from "../lib/apiClient";
import type { User, CreateUserPayload, UpdateUserPayload, Page } from "../types/api";

const BASE = "/api/users";

export const userService = {
  /**
   * Fetch a paginated list of users.
   */
  async getAll(page = 0, size = 20): Promise<Page<User>> {
    return apiClient.get<Page<User>>(BASE, { page, size });
  },

  /**
   * Fetch a single user by ID.
   */
  async getById(id: number): Promise<User> {
    return apiClient.get<User>(`${BASE}/${id}`);
  },

  /**
   * Create a new user.
   */
  async create(data: CreateUserPayload): Promise<User> {
    return apiClient.post<User>(BASE, data);
  },

  /**
   * Update an existing user.
   */
  async update(id: number, data: UpdateUserPayload): Promise<User> {
    return apiClient.put<User>(`${BASE}/${id}`, data);
  },

  /**
   * Delete a user by ID.
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE}/${id}`);
  },

  /**
   * Activate a user account.
   */
  async activate(id: number): Promise<User> {
    return apiClient.patch<User>(`${BASE}/${id}/activate`);
  },

  /**
   * Deactivate a user account.
   */
  async deactivate(id: number): Promise<User> {
    return apiClient.patch<User>(`${BASE}/${id}/deactivate`);
  },
};

export default userService;
