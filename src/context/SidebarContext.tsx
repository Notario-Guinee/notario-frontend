// ═══════════════════════════════════════════════════════════════
// Contexte de la barre latérale — Gère l'état réduit/étendu
// du menu de navigation principal (sidebar)
// ═══════════════════════════════════════════════════════════════

import { createContext, useContext, useState, ReactNode } from "react";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
  toggle: () => {},
});

/**
 * Provider de la sidebar — fournit l'état et les actions
 * pour réduire/étendre le menu latéral
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle: () => setCollapsed(c => !c) }}>
      {children}
    </SidebarContext.Provider>
  );
}

/** Hook pour accéder à l'état de la sidebar */
export const useSidebarState = () => useContext(SidebarContext);
