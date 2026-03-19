// ═══════════════════════════════════════════════════════════════
// Contexte ActeSteps — Partage les étapes de workflow personnalisées
// par type d'acte entre ActesSignatures (configuration) et Dossiers (usage)
// ═══════════════════════════════════════════════════════════════

import { createContext, useContext, useState, type ReactNode } from "react";
import { workflowTemplates } from "@/components/workflow/workflow-types";

const DEFAULT_STEPS = ["ENQUÊTE", "CONSTITUTION", "RÉDACTION", "SIGNATURE", "PAIEMENT", "FORMALITÉS", "EXPÉDITION", "ARCHIVAGE"];

interface ActeStepsContextType {
  acteSteps: Record<string, string[]>;
  setActeSteps: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  getSteps: (acteLabel: string) => string[];
}

const ActeStepsContext = createContext<ActeStepsContextType | null>(null);

export function ActeStepsProvider({ children }: { children: ReactNode }) {
  const [acteSteps, setActeSteps] = useState<Record<string, string[]>>({});

  const getSteps = (acteLabel: string): string[] => {
    if (acteSteps[acteLabel]) return acteSteps[acteLabel];
    const wf = workflowTemplates[acteLabel];
    if (wf) return wf.steps.map(s => s.label ?? s.key.toUpperCase());
    const key = Object.keys(workflowTemplates).find(k =>
      acteLabel.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(acteLabel.toLowerCase())
    );
    return key ? workflowTemplates[key].steps.map(s => s.label ?? s.key.toUpperCase()) : [...DEFAULT_STEPS];
  };

  return (
    <ActeStepsContext.Provider value={{ acteSteps, setActeSteps, getSteps }}>
      {children}
    </ActeStepsContext.Provider>
  );
}

export function useActeSteps() {
  const ctx = useContext(ActeStepsContext);
  if (!ctx) throw new Error("useActeSteps must be used within ActeStepsProvider");
  return ctx;
}
