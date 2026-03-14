// Workflow Procedural - JSON Schema types

export interface WorkflowStep {
  key: string;
  label: string;
  description: string;
  icon: string; // lucide icon name
  time: string; // estimated e.g. "2 j", "4 h"
  status: "pending" | "active" | "completed";
  startedAt?: string; // ISO date when step was started
  completedAt?: string; // ISO date when step was completed
  button?: {
    actionId: string;
    label?: string;
  };
}

export interface WorkflowConfig {
  layout: "horizontal" | "vertical";
  palette: string[]; // hex colors cycling
  steps: WorkflowStep[];
}

// Default palette
export const WORKFLOW_PALETTE = ["#2E4057", "#2AA3D6", "#F4A300", "#28A89E", "#87BF3C"];

// Helper: compute elapsed days from a date string
export function getElapsedDays(startedAt?: string): number {
  if (!startedAt) return 0;
  const start = new Date(startedAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function formatElapsed(startedAt?: string): string {
  const days = getElapsedDays(startedAt);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "1 jour";
  return `${days} jours`;
}

// Predefined workflows per type d'acte
export const workflowTemplates: Record<string, WorkflowConfig> = {
  "Vente immobilière": {
    layout: "horizontal",
    palette: WORKFLOW_PALETTE,
    steps: [
      { key: "enquete", label: "ENQUÊTE", description: "Vérification des titres et état des lieux", icon: "Search", time: "3 j", status: "completed", startedAt: new Date(Date.now() - 10 * 86400000).toISOString(), completedAt: new Date(Date.now() - 7 * 86400000).toISOString(), button: { actionId: "start_enquete" } },
      { key: "constitution", label: "CONSTITUTION", description: "Rassemblement des pièces du dossier", icon: "FolderOpen", time: "5 j", status: "completed", startedAt: new Date(Date.now() - 7 * 86400000).toISOString(), completedAt: new Date(Date.now() - 2 * 86400000).toISOString(), button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte authentique", icon: "PenLine", time: "2 j", status: "active", startedAt: new Date(Date.now() - 2 * 86400000).toISOString(), button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature par les parties prenantes", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "paiement", label: "PAIEMENT", description: "Règlement des frais et honoraires", icon: "CreditCard", time: "1 j", status: "pending", button: { actionId: "start_paiement" } },
      { key: "formalites", label: "FORMALITÉS", description: "Enregistrement et publicité foncière", icon: "Stamp", time: "7 j", status: "pending", button: { actionId: "start_formalites" } },
      { key: "expedition", label: "EXPÉDITION", description: "Délivrance des copies authentiques", icon: "Send", time: "2 j", status: "pending", button: { actionId: "start_expedition" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Classement et conservation définitive", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Vente de terrain": {
    layout: "horizontal",
    palette: WORKFLOW_PALETTE,
    steps: [
      { key: "enquete", label: "ENQUÊTE", description: "Vérification du titre foncier", icon: "Search", time: "5 j", status: "pending", button: { actionId: "start_enquete" } },
      { key: "constitution", label: "CONSTITUTION", description: "Collecte des pièces nécessaires", icon: "FolderOpen", time: "3 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de vente", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature des parties", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "formalites", label: "FORMALITÉS", description: "Mutation foncière et taxes", icon: "Stamp", time: "10 j", status: "pending", button: { actionId: "start_formalites" } },
      { key: "expedition", label: "EXPÉDITION", description: "Remise des copies", icon: "Send", time: "2 j", status: "pending", button: { actionId: "start_expedition" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage du dossier", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Constitution société": {
    layout: "horizontal",
    palette: WORKFLOW_PALETTE,
    steps: [
      { key: "constitution", label: "CONSTITUTION", description: "Rassemblement des pièces constitutives", icon: "FolderOpen", time: "3 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction des statuts et PV", icon: "PenLine", time: "4 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature des associés", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "paiement", label: "PAIEMENT", description: "Paiement des frais notariaux", icon: "CreditCard", time: "1 j", status: "pending", button: { actionId: "start_paiement" } },
      { key: "publication", label: "PUBLICATION", description: "Publication au Journal Officiel", icon: "Newspaper", time: "14 j", status: "pending", button: { actionId: "start_publication" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage du dossier société", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Succession": {
    layout: "horizontal",
    palette: WORKFLOW_PALETTE,
    steps: [
      { key: "enquete", label: "ENQUÊTE", description: "Identification des héritiers et biens", icon: "Search", time: "7 j", status: "pending", button: { actionId: "start_enquete" } },
      { key: "constitution", label: "CONSTITUTION", description: "Collecte des documents successoraux", icon: "FolderOpen", time: "5 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de notoriété", icon: "PenLine", time: "3 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature par les héritiers", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "formalites", label: "FORMALITÉS", description: "Enregistrement et mutation", icon: "Stamp", time: "10 j", status: "pending", button: { actionId: "start_formalites" } },
      { key: "expedition", label: "EXPÉDITION", description: "Remise des copies aux héritiers", icon: "Send", time: "2 j", status: "pending", button: { actionId: "start_expedition" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage définitif", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Donation": {
    layout: "horizontal",
    palette: WORKFLOW_PALETTE,
    steps: [
      { key: "constitution", label: "CONSTITUTION", description: "Pièces d'identité et titres", icon: "FolderOpen", time: "3 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de donation", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature donateur et donataire", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "paiement", label: "PAIEMENT", description: "Paiement des droits", icon: "CreditCard", time: "1 j", status: "pending", button: { actionId: "start_paiement" } },
      { key: "formalites", label: "FORMALITÉS", description: "Enregistrement fiscal", icon: "Stamp", time: "7 j", status: "pending", button: { actionId: "start_formalites" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Conservation de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Bail commercial": {
    layout: "horizontal",
    palette: WORKFLOW_PALETTE,
    steps: [
      { key: "constitution", label: "CONSTITUTION", description: "Documents des parties et du bien", icon: "FolderOpen", time: "3 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction du bail notarié", icon: "PenLine", time: "3 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature bailleur et preneur", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "formalites", label: "FORMALITÉS", description: "Enregistrement du bail", icon: "Stamp", time: "5 j", status: "pending", button: { actionId: "start_formalites" } },
      { key: "expedition", label: "EXPÉDITION", description: "Remise des copies", icon: "Send", time: "2 j", status: "pending", button: { actionId: "start_expedition" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Hypothèque": {
    layout: "horizontal",
    palette: WORKFLOW_PALETTE,
    steps: [
      { key: "enquete", label: "ENQUÊTE", description: "Vérification de la situation hypothécaire", icon: "Search", time: "5 j", status: "pending", button: { actionId: "start_enquete" } },
      { key: "constitution", label: "CONSTITUTION", description: "Collecte des pièces", icon: "FolderOpen", time: "3 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte d'hypothèque", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature des parties", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "formalites", label: "FORMALITÉS", description: "Inscription hypothécaire", icon: "Stamp", time: "14 j", status: "pending", button: { actionId: "start_formalites" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage du dossier", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Procuration": {
    layout: "horizontal",
    palette: WORKFLOW_PALETTE,
    steps: [
      { key: "constitution", label: "CONSTITUTION", description: "Vérification des identités", icon: "FolderOpen", time: "1 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de la procuration", icon: "PenLine", time: "1 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du mandant", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "expedition", label: "EXPÉDITION", description: "Remise au mandataire", icon: "Send", time: "1 j", status: "pending", button: { actionId: "start_expedition" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Conservation de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
};
