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
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Récupère le profil utilisateur avec le token stocké
  const fetchMe = async (token: string): Promise<User> => {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Erreur /auth/me (${res.status})`);
    }
    const data: ApiResponse<User> = await res.json();
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

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {}); // Ignore si le backend échoue
    }
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}