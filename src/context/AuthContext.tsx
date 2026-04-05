import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  actif: boolean;
  nomComplet?: string;
  initiales?: string;
  telephone?: string | null;
  dateNaissance?: string | null;
  lieuNaissance?: string | null;
  adresse?: string | null;
  photoUrl?: string | null;
  nomCabinet?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, tenantId?: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (ancienMotDePasse: string, nouveauMotDePasse: string) => Promise<void>;
  updateProfile: (payload: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Décode le tenant_id depuis un JWT (même utilitaire que apiClient) */
function tenantFromJwt(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.tenantId ?? payload.tenant_id ?? payload.tenant ?? null;
  } catch {
    return null;
  }
}

/** Headers auth + tenant pour les appels fetch bruts */
function bearerHeaders(token: string, extra?: Record<string, string>): Record<string, string> {
  const tenantId = tenantFromJwt(token);
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
    ...extra,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Récupère le profil utilisateur avec le token stocké
  const fetchMe = async (token: string): Promise<AuthUser> => {
    const res = await fetch("/api/auth/me", {
      headers: bearerHeaders(token),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Erreur /auth/me (${res.status})`);
    }

    const data: ApiResponse<AuthUser> = await res.json();
    if (!data.success) throw new Error(data.message || "Non authentifié");
    return data.data;
  };

  // Au démarrage vérifie si un token valide existe en localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const userData = await fetchMe(token);
          setUser(userData);
        } catch {
          localStorage.removeItem("accessToken");
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string, tenantId?: string) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (tenantId) headers["X-Tenant-ID"] = tenantId;
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Erreur /auth/login (${res.status})`);
    }

    const data: ApiResponse<{ accessToken: string }> = await res.json();
    if (!data.success) throw new Error(data.message || "Erreur de connexion");

    const token = data.data.accessToken;
    localStorage.setItem("accessToken", token);

    const userData = await fetchMe(token);
    setUser(userData);
  };

  const logout = async () => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: bearerHeaders(token),
      }).catch(() => {}); // Ignore si le backend échoue
    }
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  // Rafraîchissement silencieux du token via POST /api/auth/refresh
  const refreshAccessToken = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: bearerHeaders(token),
      });
      if (!res.ok) throw new Error("Refresh failed");
      const data: ApiResponse<{ accessToken: string }> = await res.json();
      if (data.success && data.data.accessToken) {
        localStorage.setItem("accessToken", data.data.accessToken);
      }
    } catch {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  };

  // Changement de mot de passe via POST /api/auth/change-password
  const changePassword = async (ancienMotDePasse: string, nouveauMotDePasse: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("Non authentifié");
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: bearerHeaders(token),
      body: JSON.stringify({ ancienMotDePasse, nouveauMotDePasse }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Erreur ${res.status}`);
    }
  };

  // Rafraîchissement automatique du token (toutes les 14 minutes)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refreshAccessToken, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Mise à jour du profil utilisateur via PUT /api/auth/profile
  const updateProfile = async (payload: Partial<AuthUser>) => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("Non authentifié");
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: bearerHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Erreur ${res.status}`);
    }
    // Rafraîchir le profil local
    const userData = await fetchMe(token);
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout, changePassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}