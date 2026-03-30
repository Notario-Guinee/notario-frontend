// ═══════════════════════════════════════════════════════════════
// Service Authentification — Centralise les appels API du module Auth manquants
// D'autres fonctions (login, logout, me, etc.) sont gérées directement
// dans AuthContext.tsx, InscriptionClient.tsx ou ResetPassword.tsx
// ═══════════════════════════════════════════════════════════════

const getHeaders = (includeAuth = true, extraHeaders: Record<string, string> = {}) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders
  };
  
  if (includeAuth) {
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
};

// Détermine l'URL de base selon le tenant stocké
const getBasePath = () => localStorage.getItem("authBasePath") || "/api";

// Helper pour gérer les réponses
async function handleResponse(res: Response) {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    if (data && data.success === false) {
      const firstError = data.errorDetails && Object.keys(data.errorDetails).length > 0
        ? Object.values(data.errorDetails)[0]
        : data.message;
      throw new Error(firstError as string || `Erreur (Status: ${res.status})`);
    }
    throw new Error(data?.message || `Erreur HTTP : ${res.status}`);
  }
  return data;
}

// ─── 1. Validation de Token de réinitialisation ───
// GET /api/auth/validate-reset-token
export async function validateResetToken(token: string): Promise<boolean> {
  const basePath = getBasePath();
  // Ne nécessite pas d'authentification Bearer
  const res = await fetch(`${basePath}/auth/validate-reset-token?token=${encodeURIComponent(token)}`, {
    method: "GET",
    headers: getHeaders(false), 
  });
  
  // Cette route renvoie 200 OK ou 400 Bad Request selon la validité
  const data = await res.json().catch(() => null);
  return res.ok && data?.success === true;
}

// ─── 2. Vérification d'Email ───
// POST /api/auth/verify-email
export async function verifyEmail(token: string): Promise<boolean> {
  const basePath = getBasePath();
  const res = await fetch(`${basePath}/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: getHeaders(false),
  });
  
  const data = await res.json().catch(() => null);
  return res.ok && data?.success === true;
}

// ─── 3. Rafraîchissement du Token (Refresh Token) ───
// POST /api/auth/refresh
export async function refreshToken(refreshTokenStr: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number } | null> {
  const basePath = getBasePath();
  const tenantId = localStorage.getItem("tenantId"); // On essaie de récupérer le tenantId s'il est stocké
  
  const headers = getHeaders(false);
  if (tenantId) {
    headers["X-Tenant-ID"] = tenantId;
  }

  const res = await fetch(`${basePath}/auth/refresh`, {
    method: "POST",
    headers,
    body: JSON.stringify({ refreshToken: refreshTokenStr }),
  });

  if (!res.ok) {
    return null; // En cas d'échec (token expiré ou invalide)
  }

  const data = await handleResponse(res);
  return data.data; // Renvoie les nouveaux tokens
}

// ─── 4. Création d'un Administrateur Global ───
// POST /api/auth/register-admin
export async function registerAdmin(adminSecret: string, payload: any): Promise<any> {
  // Cette requête doit forcément pointer vers l'API globale /api-admin
  const basePath = "/api-admin"; 
  
  const res = await fetch(`${basePath}/auth/register-admin`, {
    method: "POST",
    headers: getHeaders(false, { "X-Admin-Secret": adminSecret }),
    body: JSON.stringify(payload),
  });
  
  const data = await handleResponse(res);
  return data.data;
}
