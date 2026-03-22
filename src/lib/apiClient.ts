/**
 * API Client - fetch-based HTTP client for all backend calls.
 *
 * Handles:
 *  - Base URL /api
 *  - Automatic Bearer token injection from localStorage.accessToken
 *  - Unwrapping GlobalApiResponse<T> wrapper
 *  - 401 → clear localStorage + redirect to /login
 *  - Meaningful error throwing
 */

export interface GlobalApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errorCode?: string;
  errorDetails?: Record<string, string>;
  timestamp: string;
  tenantId: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
    public errorDetails?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

function buildHeaders(extra: Record<string, string> = {}): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function handleUnauthorized(): never {
  localStorage.removeItem("accessToken");
  window.location.href = "/login";
  // Throw so TypeScript knows this path never returns normally
  throw new ApiError("Session expirée. Redirection vers la connexion.", 401);
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    handleUnauthorized();
  }

  let body: unknown;
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    body = await response.json();
  } else {
    // For empty responses (e.g. 204 No Content)
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return undefined as unknown as T;
    }
    const text = await response.text();
    throw new ApiError(text || `HTTP ${response.status}`, response.status);
  }

  const wrapped = body as GlobalApiResponse<T>;

  if (!response.ok) {
    const details = wrapped?.errorDetails;
    let errorMsg = wrapped?.message || `HTTP ${response.status}`;
    if (details && typeof details === "object") {
      const fieldErrors = Object.values(details).filter(Boolean).join(" · ");
      if (fieldErrors) errorMsg = fieldErrors;
    }
    throw new ApiError(errorMsg, response.status, wrapped?.errorCode, details);
  }

  if (wrapped?.success === false) {
    throw new ApiError(
      wrapped.message || "Erreur inattendue",
      response.status,
      wrapped.errorCode
    );
  }

  // Return the unwrapped data
  return wrapped.data;
}

// ─── Core request helper ────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string | number | boolean | undefined | null>
): Promise<T> {
  let url = path.startsWith("/") ? path : `/${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url = `${url}?${qs}`;
  }

  const response = await fetch(url, {
    method,
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(response);
}

// ─── Public API ─────────────────────────────────────────────────────────────

export const apiClient = {
  get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>
  ): Promise<T> {
    return request<T>("GET", path, undefined, params);
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>("POST", path, body);
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>("PUT", path, body);
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>("PATCH", path, body);
  },

  delete<T = void>(path: string): Promise<T> {
    return request<T>("DELETE", path);
  },
};

export { ApiError };
export default apiClient;
