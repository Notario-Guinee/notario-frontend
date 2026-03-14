// ═══════════════════════════════════════════════════════════════
// Contexte de rôle — Gestion du rôle utilisateur actif
// Permet de basculer entre « gérant » et « admin_global »
// pour afficher les menus et fonctionnalités correspondants
// ═══════════════════════════════════════════════════════════════

import { createContext, useContext, useState, ReactNode } from "react";

/** Rôles disponibles dans l'application */
export type UserRole = "admin_global" | "gerant";

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAdminGlobal: boolean;
  isGerant: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

/**
 * Provider de rôle — fournit le rôle actif et des booléens d'aide
 * pour simplifier les vérifications de permissions dans les composants
 */
export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("gerant");

  return (
    <RoleContext.Provider value={{ role, setRole, isAdminGlobal: role === "admin_global", isGerant: role === "gerant" }}>
      {children}
    </RoleContext.Provider>
  );
}

/** Hook pour accéder au rôle actif — doit être utilisé dans un RoleProvider */
export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be inside RoleProvider");
  return ctx;
}
