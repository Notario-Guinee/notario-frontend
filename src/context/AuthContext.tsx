import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  actif: boolean;
  nomComplet: string;
  initiales: string;
  telephone?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorDetails?: Record<string, string>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, tenantId?: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (data: { nom: string; prenom: string; email: string; telephone?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Détermine l'URL de base selon le tenant stocké (pour le proxy Vite)
  const getBasePath = () => localStorage.getItem("authBasePath") || "/api";

  // Récupère le profil utilisateur avec le token stocké
  const fetchMe = async (token: string, basePath: string): Promise<User> => {
    const res = await fetch(`${basePath}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur serveur");
    const data: ApiResponse<User> = await res.json();
    if (!data.success) throw new Error("Non authentifié");
    return data.data;
  };

  // Au démarrage — vérifie si un token valide existe en localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      const basePath = getBasePath();
      if (token) {
        try {
          const userData = await fetchMe(token, basePath);
          setUser(userData);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("authBasePath");
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string, tenantId: string = "tenant-demo-1") => {
    // Si c'est global-admin, on passe par le proxy /api-admin
    const basePath = tenantId === "global-admin" ? "/api-admin" : "/api";

    const res = await fetch(`${basePath}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Erreur serveur");
    const data: ApiResponse<{ accessToken: string }> = await res.json();
    if (!data.success) throw new Error(data.message || "Erreur de connexion");

    const token = data.data.accessToken;
    localStorage.setItem("accessToken", token);
    localStorage.setItem("authBasePath", basePath);

    const userData = await fetchMe(token, basePath);
    setUser(userData);
  };

  const logout = async () => {
    const token = localStorage.getItem("accessToken");
    const basePath = getBasePath();
    if (token) {
      await fetch(`${basePath}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {}); // Ignore si le backend échoue
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authBasePath");
    setUser(null);
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    const token = localStorage.getItem("accessToken");
    const basePath = getBasePath();
    if (!token) throw new Error("Non authentifié");

    const res = await fetch(`${basePath}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ancienMotDePasse: oldPassword,
        nouveauMotDePasse: newPassword,
        confirmationMotDePasse: newPassword, // Le DTO backend en a besoin
      }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Erreur lors du changement de mot de passe");
    }
  };

  // Met à jour le profil utilisateur — appelle PUT /api/auth/profile
  const updateProfile = async (data: { nom: string; prenom: string; email: string; telephone?: string }) => {
    const token = localStorage.getItem("accessToken");
    const basePath = getBasePath();
    if (!token) throw new Error("Non authentifié");

    const res = await fetch(`${basePath}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      // Le backend exige aussi email et role — on récupère le role depuis le user actuel
      body: JSON.stringify({
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone || null,
        role: user?.role || "STANDARD",
      }),
    });

    const result: ApiResponse<User> = await res.json();
    if (!result.success) {
      const firstError = result.errorDetails
        ? Object.values(result.errorDetails)[0]
        : result.message;
      throw new Error(firstError || "Erreur lors de la mise à jour du profil");
    }

    // Met à jour le user en mémoire avec les nouvelles données
    setUser(result.data);
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
