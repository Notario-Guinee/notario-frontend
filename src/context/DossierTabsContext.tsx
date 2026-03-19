// ═══════════════════════════════════════════════════════════════
// Contexte DossierTabs — Persiste les onglets dossiers ouverts
// à travers la navigation React Router
// ═══════════════════════════════════════════════════════════════

import { createContext, useContext, useState, type ReactNode } from "react";

export interface DossierTab {
  id: string;           // `${dossierId}-${type}`
  dossierId: string;
  dossierCode: string;
  dossierObjet: string;
  type: "details" | "workflow";
  detailSubTab: string;
}

interface DossierTabsContextType {
  openTabs: DossierTab[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  openTab: (dossier: { id: string; code: string; objet: string }, type: "details" | "workflow") => void;
  closeTab: (tabId: string) => void;
  setTabDetailSubTab: (tabId: string, subTab: string) => void;
}

const DossierTabsContext = createContext<DossierTabsContextType | null>(null);

export function DossierTabsProvider({ children }: { children: ReactNode }) {
  const [openTabs, setOpenTabs] = useState<DossierTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("dossiers");

  const openTab = (dossier: { id: string; code: string; objet: string }, type: "details" | "workflow") => {
    const id = `${dossier.id}-${type}`;
    setOpenTabs(prev => {
      if (prev.some(t => t.id === id)) return prev;
      return [...prev, {
        id,
        dossierId: dossier.id,
        dossierCode: dossier.code,
        dossierObjet: dossier.objet,
        type,
        detailSubTab: "details",
      }];
    });
    setActiveTabId(id);
  };

  const closeTab = (tabId: string) => {
    setOpenTabs(prev => {
      const idx = prev.findIndex(t => t.id === tabId);
      const next = prev.filter(t => t.id !== tabId);
      setActiveTabId(cur => {
        if (cur !== tabId) return cur;
        if (idx > 0 && next[idx - 1]) return next[idx - 1].id;
        if (next[idx]) return next[idx].id;
        return "dossiers";
      });
      return next;
    });
  };

  const setTabDetailSubTab = (tabId: string, subTab: string) => {
    setOpenTabs(prev => prev.map(t => t.id === tabId ? { ...t, detailSubTab: subTab } : t));
  };

  return (
    <DossierTabsContext.Provider value={{ openTabs, activeTabId, setActiveTabId, openTab, closeTab, setTabDetailSubTab }}>
      {children}
    </DossierTabsContext.Provider>
  );
}

export function useDossierTabs() {
  const ctx = useContext(DossierTabsContext);
  if (!ctx) throw new Error("useDossierTabs must be used within DossierTabsProvider");
  return ctx;
}
