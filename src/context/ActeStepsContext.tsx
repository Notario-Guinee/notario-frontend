// ═══════════════════════════════════════════════════════════════
// Contexte ActeSteps — Partage les étapes de workflow personnalisées
// par type d'acte entre ActesSignatures (configuration) et Dossiers (usage)
// ═══════════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { workflowTemplates } from "@/components/workflow/workflow-types";
import { typeActeService } from "@/services/typeActeService";

const DEFAULT_STEPS: WorkflowStepData[] = [
  { label: "ENQUÊTE", description: "Analyse préliminaire du dossier" },
  { label: "CONSTITUTION", description: "Rassemblement des documents nécessaires" },
  { label: "RÉDACTION", description: "Rédaction de l'acte notarial" },
  { label: "SIGNATURE", description: "Signature par les parties" },
  { label: "PAIEMENT", description: "Règlement des honoraires et frais" },
  { label: "FORMALITÉS", description: "Démarches administratives" },
  { label: "EXPÉDITION", description: "Envoi des documents aux parties" },
  { label: "ARCHIVAGE", description: "Classement et conservation" }
];

// ── Types ─────────────────────────────────────────────────────

export interface WorkflowStepData {
  label: string;
  description?: string;
}

interface ActeStepsContextType {
  acteSteps: Record<string, WorkflowStepData[]>;
  setActeSteps: React.Dispatch<React.SetStateAction<Record<string, WorkflowStepData[]>>>;
  getSteps: (acteLabel: string) => WorkflowStepData[];
  getStepLabels: (acteLabel: string) => string[];
}

const ActeStepsContext = createContext<ActeStepsContextType | null>(null);

// ── Helper pour extraire le label d'une étape ─────────────────

function extractStepLabel(step: unknown): string {
  if (typeof step === 'string') return step;
  if (step && typeof step === 'object') {
    if ('label' in step && step.label) return String(step.label);
    if ('key' in step && step.key) return String(step.key);
  }
  return String(step);
}

function extractStepDescription(step: unknown): string | undefined {
  if (step && typeof step === 'object' && 'description' in step && step.description) {
    return String(step.description);
  }
  return undefined;
}

function extractStepData(step: unknown): WorkflowStepData {
  return {
    label: extractStepLabel(step),
    description: extractStepDescription(step)
  };
}

// ── Provider ───────────────────────────────────────────────────

export function ActeStepsProvider({ children }: { children: ReactNode }) {
  const [acteSteps, setActeSteps] = useState<Record<string, WorkflowStepData[]>>({});

  // Charger les étapes depuis le backend au démarrage (types d'actes complets avec workflowConfigJson)
// Dans ActeStepsContext.tsx, dans le useEffect
useEffect(() => {
  const loadSteps = async () => {
    try {
      const allTypes = await typeActeService.getAll();
      console.log("=== TYPES D'ACTES CHARGÉS (DEBUG) ===");
      console.log("Nombre de types:", allTypes.length);
      
      allTypes.forEach((type: TypeActeDto) => {
        console.log(`Type: "${type.nom}"`);
        console.log(`workflowConfigJson:`, type.workflowConfigJson);
      });
      
      const loaded: Record<string, WorkflowStepData[]> = {};
      
      allTypes.forEach((type: TypeActeDto) => {
        const name = type.nom ?? type.libelle ?? "";
        if (!name) return;
        
        const workflowConfig = type.workflowConfigJson;
        if (!workflowConfig) {
          console.log(`⚠️ Pas de workflow pour "${name}"`);
          return;
        }
        
        try {
          const wf = typeof workflowConfig === "string"
            ? JSON.parse(workflowConfig)
            : workflowConfig;
          const rawSteps = (wf as { steps?: unknown[] }).steps;
          if (Array.isArray(rawSteps) && rawSteps.length > 0) {
            loaded[name] = rawSteps.map(extractStepData);
            console.log(`✅ Étapes chargées pour "${name}":`, loaded[name].map(s => s.label));
          }
        } catch (err) {
          console.log(`❌ Erreur parsing workflow pour "${name}":`, err);
        }
      });
      
      console.log("=== FINAL loaded ===", loaded);
      setActeSteps(prev => ({ ...prev, ...loaded }));
    } catch (err) {
      console.error("Erreur chargement des types d'actes:", err);
    }
  };
  
  loadSteps();
}, []);

  const normalize = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const getSteps = (acteLabel: string): WorkflowStepData[] => {
    // 1. Correspondance exacte dans les étapes personnalisées
    if (acteSteps[acteLabel]?.length) return acteSteps[acteLabel];

    // 2. Correspondance normalisée (trim + lowercase + sans accents) dans les étapes personnalisées
    const normalizedSearch = normalize(acteLabel);
    const fuzzyKey = Object.keys(acteSteps).find(k => {
      const nk = normalize(k);
      return nk === normalizedSearch || normalizedSearch.startsWith(nk) || nk.startsWith(normalizedSearch);
    });
    if (fuzzyKey && acteSteps[fuzzyKey]?.length) return acteSteps[fuzzyKey];

    // 3. Correspondance exacte dans les templates
    const wf = workflowTemplates[acteLabel];
    if (wf?.steps?.length) return wf.steps.map(extractStepData);

    // 4. Correspondance approximative dans les templates
    const matchingKey = Object.keys(workflowTemplates).find(key =>
      normalize(acteLabel).includes(normalize(key)) ||
      normalize(key).includes(normalize(acteLabel))
    );
    if (matchingKey && workflowTemplates[matchingKey]?.steps?.length) {
      return workflowTemplates[matchingKey].steps.map(extractStepData);
    }

    // 5. Étapes par défaut
    return [...DEFAULT_STEPS];
  };

  const getStepLabels = (acteLabel: string): string[] => {
    return getSteps(acteLabel).map(s => s.label);
  };

  return (
    <ActeStepsContext.Provider value={{ acteSteps, setActeSteps, getSteps, getStepLabels }}>
      {children}
    </ActeStepsContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────

export function useActeSteps() {
  const ctx = useContext(ActeStepsContext);
  if (!ctx) throw new Error("useActeSteps must be used within ActeStepsProvider");
  return ctx;
}