// ─────────────────────────────────────────────────────────────────────────────
// Client HTTP de base — gère l'authentification JWT et le parsing des réponses
// ─────────────────────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
  errorDetails?: string;
}

function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function parseResponse<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || `Erreur ${res.status}`);
  }
  return json.data;
}

export const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    const res = await fetch(url, { headers: authHeaders() });
    return parseResponse<T>(res);
  },

  post: async <T>(url: string, body?: unknown): Promise<T> => {
    const res = await fetch(url, {
      method: "POST",
      headers: authHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return parseResponse<T>(res);
  },

  put: async <T>(url: string, body?: unknown): Promise<T> => {
    const res = await fetch(url, {
      method: "PUT",
      headers: authHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return parseResponse<T>(res);
  },

  patch: async <T>(url: string, body?: unknown): Promise<T> => {
    const res = await fetch(url, {
      method: "PATCH",
      headers: authHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return parseResponse<T>(res);
  },
};
