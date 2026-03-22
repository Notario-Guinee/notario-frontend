import apiClient from "../lib/apiClient";

const BASE_MESSAGES = "/api/messages";
const BASE_ATTACHMENTS = "/api/attachments";

export const messagerieService = {
  async getConversations(): Promise<unknown[]> {
    return apiClient.get<unknown[]>(`${BASE_MESSAGES}/conversations`);
  },

  async getMessages(conversationId: number | string): Promise<unknown[]> {
    return apiClient.get<unknown[]>(`${BASE_MESSAGES}/conversations/${conversationId}`);
  },

  async sendMessage(data: unknown): Promise<unknown> {
    return apiClient.post<unknown>(BASE_MESSAGES, data);
  },

  async deleteMessage(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE_MESSAGES}/${id}`);
  },

  async getAttachments(messageId: number): Promise<unknown[]> {
    return apiClient.get<unknown[]>(`${BASE_ATTACHMENTS}`, { messageId });
  },

  async uploadAttachment(messageId: number, file: File): Promise<unknown> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("messageId", String(messageId));

    const token = localStorage.getItem("accessToken");
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(BASE_ATTACHMENTS, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }

    const json = await response.json();
    return json?.data ?? json;
  },
};

export default messagerieService;
