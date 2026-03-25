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

/** Décode le payload JWT (base64) sans librairie externe */
function decodeTenantFromJwt(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.tenantId ?? payload.tenant_id ?? payload.tenant ?? null;
  } catch {
    return null;
  }
}

function getTenantId(): string | null {
  const token = getToken();
  if (!token) return null;
  return decodeTenantFromJwt(token);
}

function authHeaders(extra?: Record<string, string>): HeadersInit {
  const token = getToken();
  const tenantId = getTenantId();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
    // extra peut override X-Tenant-ID (ex: admin créant un cabinet pour un autre tenant)
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
  get: async <T>(url: string, extra?: Record<string, string>): Promise<T> => {
    const res = await fetch(url, { headers: authHeaders(extra) });
    return parseResponse<T>(res);
  },

  post: async <T>(url: string, body?: unknown, extra?: Record<string, string>): Promise<T> => {
    const res = await fetch(url, {
      method: "POST",
      headers: authHeaders(extra),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return parseResponse<T>(res);
  },

  put: async <T>(url: string, body?: unknown, extra?: Record<string, string>): Promise<T> => {
    const res = await fetch(url, {
      method: "PUT",
      headers: authHeaders(extra),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return parseResponse<T>(res);
  },

  patch: async <T>(url: string, body?: unknown, extra?: Record<string, string>): Promise<T> => {
    const res = await fetch(url, {
      method: "PATCH",
      headers: authHeaders(extra),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return parseResponse<T>(res);
  },

  delete: async <T>(url: string, extra?: Record<string, string>): Promise<T> => {
    const res = await fetch(url, {
      method: "DELETE",
      headers: authHeaders(extra),
    });
    return parseResponse<T>(res);
  },
};
