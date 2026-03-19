// ═══════════════════════════════════════════════════════════════
// Types et données du workflow procédural
// Définit les interfaces WorkflowStep / WorkflowConfig,
// les palettes de couleurs, les utilitaires de durée écoulée
// et les modèles de workflow prédéfinis par type d'acte notarial
// ═══════════════════════════════════════════════════════════════

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
// Palette visible sur fond sombre (#313131) ET fond clair — contraste ≥ 4.5:1 sur les deux
export const WORKFLOW_PALETTE = ["#5B9BD5", "#38C0F0", "#F4A300", "#2DD4BF", "#99D04A"];

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

  // ── Actes immobiliers ──────────────────────────────────────────
  "Promesse de vente (compromis)": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "enquete", label: "ENQUÊTE", description: "Vérification des titres et situation juridique", icon: "Search", time: "3 j", status: "pending", button: { actionId: "start_enquete" } },
      { key: "negociation", label: "NÉGOCIATION", description: "Accord sur le prix et conditions suspensives", icon: "Handshake", time: "2 j", status: "pending", button: { actionId: "start_negociation" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de la promesse synallagmatique", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature des parties avec versement du séquestre", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "sequestre", label: "SÉQUESTRE", description: "Consignation du dépôt de garantie", icon: "CreditCard", time: "1 j", status: "pending", button: { actionId: "start_sequestre" } },
      { key: "conditions", label: "LEVÉE CONDITIONS", description: "Levée des conditions suspensives", icon: "CheckCircle2", time: "30 j", status: "pending", button: { actionId: "start_conditions" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Conservation de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Échange de biens immobiliers": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "enquete", label: "ENQUÊTE", description: "Vérification des titres des deux biens", icon: "Search", time: "5 j", status: "pending", button: { actionId: "start_enquete" } },
      { key: "evaluation", label: "ÉVALUATION", description: "Estimation des valeurs et calcul de la soulte", icon: "BarChart2", time: "3 j", status: "pending", button: { actionId: "start_evaluation" } },
      { key: "constitution", label: "CONSTITUTION", description: "Rassemblement des pièces des deux parties", icon: "FolderOpen", time: "3 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte d'échange authentique", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature des parties", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "formalites", label: "FORMALITÉS", description: "Enregistrement et mutation foncière", icon: "Stamp", time: "10 j", status: "pending", button: { actionId: "start_formalites" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage définitif", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Donation immobilière": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "constitution", label: "CONSTITUTION", description: "Pièces d'identité, titres de propriété et justificatifs", icon: "FolderOpen", time: "3 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "evaluation", label: "ÉVALUATION", description: "Estimation de la valeur vénale du bien", icon: "BarChart2", time: "3 j", status: "pending", button: { actionId: "start_evaluation" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de donation", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du donateur et du donataire", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement fiscal et paiement des droits", icon: "Stamp", time: "7 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "publicite", label: "PUBLICITÉ", description: "Publication foncière et mutation du titre", icon: "Send", time: "5 j", status: "pending", button: { actionId: "start_publicite" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Conservation de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Bail emphytéotique": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "constitution", label: "CONSTITUTION", description: "Documents du bien et des parties", icon: "FolderOpen", time: "3 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "negociation", label: "NÉGOCIATION", description: "Accord sur la durée, canon et clauses spécifiques", icon: "Handshake", time: "5 j", status: "pending", button: { actionId: "start_negociation" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction du bail emphytéotique", icon: "PenLine", time: "3 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature bailleur et preneur", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement fiscal obligatoire", icon: "Stamp", time: "7 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "publicite", label: "PUBLICITÉ", description: "Publication foncière", icon: "Send", time: "5 j", status: "pending", button: { actionId: "start_publicite" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage du bail", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Constitution d'hypothèque": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "constitution", label: "CONSTITUTION", description: "Pièces relatives au bien et au créancier", icon: "FolderOpen", time: "3 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "evaluation", label: "ÉVALUATION", description: "Estimation de la valeur du bien hypothéqué", icon: "BarChart2", time: "3 j", status: "pending", button: { actionId: "start_evaluation" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte constitutif d'hypothèque", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du débiteur et du créancier", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "inscription", label: "INSCRIPTION", description: "Inscription au livre foncier — Conservation des hypothèques", icon: "Stamp", time: "14 j", status: "pending", button: { actionId: "start_inscription" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Mainlevée d'hypothèque": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "verification", label: "VÉRIFICATION", description: "Vérification de l'extinction de la créance", icon: "Search", time: "2 j", status: "pending", button: { actionId: "start_verification" } },
      { key: "constitution", label: "CONSTITUTION", description: "Pièces justificatives du remboursement", icon: "FolderOpen", time: "2 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de mainlevée", icon: "PenLine", time: "1 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du créancier", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "radiation", label: "RADIATION", description: "Radiation de l'inscription hypothécaire", icon: "Stamp", time: "10 j", status: "pending", button: { actionId: "start_radiation" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage de l'acte de mainlevée", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Attestation de propriété": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "enquete", label: "ENQUÊTE", description: "Vérification de la chaîne des titres de propriété", icon: "Search", time: "5 j", status: "pending", button: { actionId: "start_enquete" } },
      { key: "constitution", label: "CONSTITUTION", description: "Collecte des titres antérieurs et pièces d'identité", icon: "FolderOpen", time: "3 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'attestation notariée", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature par le notaire et le propriétaire", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement et légalisation", icon: "Stamp", time: "5 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage de l'attestation", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Morcellement / lotissement": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "enquete", label: "ENQUÊTE", description: "Vérification du titre foncier et des servitudes", icon: "Search", time: "5 j", status: "pending", button: { actionId: "start_enquete" } },
      { key: "bornage", label: "BORNAGE", description: "Opérations de bornage et délimitation des lots", icon: "MapPin", time: "7 j", status: "pending", button: { actionId: "start_bornage" } },
      { key: "plan", label: "PLAN CADASTRAL", description: "Établissement du plan de lotissement par le géomètre", icon: "Map", time: "10 j", status: "pending", button: { actionId: "start_plan" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de morcellement", icon: "PenLine", time: "3 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature de l'acte", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "publicite", label: "PUBLICITÉ", description: "Publicité foncière et immatriculation des lots", icon: "Send", time: "14 j", status: "pending", button: { actionId: "start_publicite" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage du dossier de lotissement", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Mise en copropriété": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "enquete", label: "ENQUÊTE", description: "Vérification du titre de l'immeuble et situation juridique", icon: "Search", time: "5 j", status: "pending", button: { actionId: "start_enquete" } },
      { key: "constitution", label: "CONSTITUTION", description: "Pièces techniques et plan de l'immeuble", icon: "FolderOpen", time: "5 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "etat_descriptif", label: "ÉTAT DESCRIPTIF", description: "Rédaction de l'état descriptif de division en lots", icon: "FileText", time: "7 j", status: "pending", button: { actionId: "start_etat_descriptif" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction du règlement de copropriété", icon: "PenLine", time: "5 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature par le propriétaire", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "publicite", label: "PUBLICITÉ", description: "Publication au bureau des hypothèques", icon: "Send", time: "14 j", status: "pending", button: { actionId: "start_publicite" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Règlement de copropriété": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "constitution", label: "CONSTITUTION", description: "Collecte des documents de l'immeuble et des copropriétaires", icon: "FolderOpen", time: "3 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction du règlement de copropriété", icon: "PenLine", time: "7 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature par tous les copropriétaires", icon: "FileSignature", time: "3 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement du règlement", icon: "Stamp", time: "7 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "notification", label: "NOTIFICATION", description: "Notification aux copropriétaires et syndicat", icon: "Bell", time: "2 j", status: "pending", button: { actionId: "start_notification" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Conservation au rang des minutes", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },

  // ── Actes de famille ───────────────────────────────────────────
  "Contrat de mariage": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "consultation", label: "CONSULTATION", description: "Entretien avec les futurs époux sur les régimes matrimoniaux", icon: "Users", time: "1 j", status: "pending", button: { actionId: "start_consultation" } },
      { key: "constitution", label: "CONSTITUTION", description: "Pièces d'identité, actes de naissance et documents patrimoniaux", icon: "FolderOpen", time: "2 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction du contrat de mariage notarié", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "lecture", label: "LECTURE", description: "Lecture de l'acte aux futurs époux", icon: "Eye", time: "1 j", status: "pending", button: { actionId: "start_lecture" } },
      { key: "signature", label: "SIGNATURE", description: "Signature des futurs époux avant le mariage", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement et mention sur l'acte de mariage", icon: "Stamp", time: "3 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Conservation de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Changement de régime matrimonial": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "consultation", label: "CONSULTATION", description: "Entretien avec les époux sur le changement de régime", icon: "Users", time: "1 j", status: "pending", button: { actionId: "start_consultation" } },
      { key: "avis_tribunal", label: "AVIS TRIBUNAL", description: "Information des enfants majeurs et homologation judiciaire si nécessaire", icon: "Gavel", time: "30 j", status: "pending", button: { actionId: "start_avis_tribunal" } },
      { key: "constitution", label: "CONSTITUTION", description: "Inventaire du patrimoine commun et pièces requises", icon: "FolderOpen", time: "5 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de changement de régime", icon: "PenLine", time: "3 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature des époux", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "publicite", label: "PUBLICITÉ", description: "Publication légale et mention en marge des actes d'état civil", icon: "Send", time: "14 j", status: "pending", button: { actionId: "start_publicite" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Donation entre époux": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "constitution", label: "CONSTITUTION", description: "Pièces d'identité, acte de mariage et documents patrimoniaux", icon: "FolderOpen", time: "2 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de la donation entre époux", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "lecture", label: "LECTURE", description: "Lecture de l'acte aux époux", icon: "Eye", time: "1 j", status: "pending", button: { actionId: "start_lecture" } },
      { key: "signature", label: "SIGNATURE", description: "Signature des époux", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement et paiement des droits", icon: "Stamp", time: "5 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Conservation au rang des minutes", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Testament authentique": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "consultation", label: "CONSULTATION", description: "Entretien confidentiel avec le testateur", icon: "Users", time: "1 j", status: "pending", button: { actionId: "start_consultation" } },
      { key: "dictee", label: "DICTÉE", description: "Dictée du testament par le testateur en présence des témoins", icon: "Mic", time: "1 j", status: "pending", button: { actionId: "start_dictee" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte testamentaire authentique", icon: "PenLine", time: "1 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "lecture", label: "LECTURE", description: "Lecture du testament au testateur et aux témoins", icon: "Eye", time: "1 j", status: "pending", button: { actionId: "start_lecture" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du testateur, témoins et notaire", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement et dépôt au fichier central des dispositions de dernières volontés", icon: "Stamp", time: "3 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Conservation secrète de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Révocation de testament": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "consultation", label: "CONSULTATION", description: "Entretien avec le testateur et vérification du testament antérieur", icon: "Users", time: "1 j", status: "pending", button: { actionId: "start_consultation" } },
      { key: "constitution", label: "CONSTITUTION", description: "Pièces d'identité et référence du testament révoqué", icon: "FolderOpen", time: "1 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de révocation expresse", icon: "PenLine", time: "1 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du testateur", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement de la révocation", icon: "Stamp", time: "3 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "notification", label: "NOTIFICATION", description: "Mise à jour du fichier central des dispositions de dernières volontés", icon: "Bell", time: "2 j", status: "pending", button: { actionId: "start_notification" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Conservation de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Reconnaissance d'enfant": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "constitution", label: "CONSTITUTION", description: "Pièces d'identité du déclarant et acte de naissance de l'enfant", icon: "FolderOpen", time: "1 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "verification", label: "VÉRIFICATION", description: "Vérification de l'absence de reconnaissance antérieure", icon: "Search", time: "1 j", status: "pending", button: { actionId: "start_verification" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de reconnaissance", icon: "PenLine", time: "1 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du déclarant", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement et mention sur l'acte de naissance", icon: "Stamp", time: "5 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Adoption": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "constitution", label: "CONSTITUTION", description: "Pièces d'identité, actes de naissance et documents familiaux", icon: "FolderOpen", time: "5 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "enquete", label: "ENQUÊTE SOCIALE", description: "Enquête sociale sur la situation de la famille adoptante", icon: "Search", time: "30 j", status: "pending", button: { actionId: "start_enquete" } },
      { key: "jugement", label: "JUGEMENT", description: "Obtention du jugement d'adoption par le tribunal compétent", icon: "Gavel", time: "60 j", status: "pending", button: { actionId: "start_jugement" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte notarié d'adoption", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature des parties et du notaire", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "transcription", label: "TRANSCRIPTION", description: "Transcription sur les registres d'état civil", icon: "Stamp", time: "10 j", status: "pending", button: { actionId: "start_transcription" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Autorisation parentale notariée": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "constitution", label: "CONSTITUTION", description: "Pièces d'identité des parents et de l'enfant", icon: "FolderOpen", time: "1 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "verification", label: "VÉRIFICATION", description: "Vérification de l'autorité parentale et de la minorité", icon: "Search", time: "1 j", status: "pending", button: { actionId: "start_verification" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'autorisation parentale notariée", icon: "PenLine", time: "1 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du ou des parents", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement de l'acte", icon: "Stamp", time: "2 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Conservation de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },

  // ── Actes de succession ────────────────────────────────────────
  "Acte de notoriété (héritiers)": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "enquete", label: "ENQUÊTE", description: "Identification des héritiers légaux et testament éventuel", icon: "Search", time: "7 j", status: "pending", button: { actionId: "start_enquete" } },
      { key: "devolution", label: "DÉVOLUTION", description: "Établissement de l'ordre successoral et des quotes-parts", icon: "Users", time: "3 j", status: "pending", button: { actionId: "start_devolution" } },
      { key: "constitution", label: "CONSTITUTION", description: "Acte de décès, livret de famille, pièces des héritiers", icon: "FolderOpen", time: "5 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de notoriété", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature par les héritiers déclarants", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement et délivrance des expéditions", icon: "Stamp", time: "5 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage définitif", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Déclaration de succession": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "inventaire", label: "INVENTAIRE", description: "Recensement de l'actif et du passif successoral", icon: "List", time: "7 j", status: "pending", button: { actionId: "start_inventaire" } },
      { key: "evaluation", label: "ÉVALUATION", description: "Estimation de la valeur des biens successoraux", icon: "BarChart2", time: "5 j", status: "pending", button: { actionId: "start_evaluation" } },
      { key: "constitution", label: "CONSTITUTION", description: "Documents des héritiers et de la succession", icon: "FolderOpen", time: "3 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de la déclaration de succession", icon: "PenLine", time: "3 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature par les héritiers déclarants", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "depot_fisc", label: "DÉPÔT FISC", description: "Dépôt auprès de la Direction des Impôts et paiement des droits", icon: "Stamp", time: "14 j", status: "pending", button: { actionId: "start_depot_fisc" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage de la minute et des pièces", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Partage successoral": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "inventaire", label: "INVENTAIRE", description: "Inventaire complet des biens à partager", icon: "List", time: "7 j", status: "pending", button: { actionId: "start_inventaire" } },
      { key: "evaluation", label: "ÉVALUATION", description: "Évaluation de chaque bien de la succession", icon: "BarChart2", time: "7 j", status: "pending", button: { actionId: "start_evaluation" } },
      { key: "negociation", label: "NÉGOCIATION", description: "Accord entre héritiers sur la composition des lots", icon: "Handshake", time: "14 j", status: "pending", button: { actionId: "start_negociation" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de partage notarié", icon: "PenLine", time: "5 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature de tous les co-héritiers", icon: "FileSignature", time: "2 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement fiscal et paiement des droits de partage", icon: "Stamp", time: "10 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Conservation de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Liquidation de succession": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "inventaire", label: "INVENTAIRE", description: "Inventaire et évaluation de l'actif et du passif", icon: "List", time: "10 j", status: "pending", button: { actionId: "start_inventaire" } },
      { key: "evaluation", label: "ÉVALUATION", description: "Détermination de la valeur liquidative nette", icon: "BarChart2", time: "7 j", status: "pending", button: { actionId: "start_evaluation" } },
      { key: "liquidation", label: "LIQUIDATION", description: "Apurement du passif et calcul des droits de chaque héritier", icon: "Calculator", time: "7 j", status: "pending", button: { actionId: "start_liquidation" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de liquidation-partage", icon: "PenLine", time: "5 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature des héritiers", icon: "FileSignature", time: "2 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "formalites", label: "FORMALITÉS", description: "Enregistrement, mutations foncières et paiement des droits", icon: "Stamp", time: "14 j", status: "pending", button: { actionId: "start_formalites" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage définitif du dossier", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Attestation de propriété successorale": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "enquete", label: "ENQUÊTE", description: "Vérification de la dévolution successorale", icon: "Search", time: "5 j", status: "pending", button: { actionId: "start_enquete" } },
      { key: "devolution", label: "DÉVOLUTION", description: "Constatation de la qualité d'héritier et des droits", icon: "Users", time: "3 j", status: "pending", button: { actionId: "start_devolution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'attestation de propriété successorale", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du notaire et des héritiers", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement et mutation des titres", icon: "Stamp", time: "10 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage de l'attestation", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Inventaire des biens": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "convocation", label: "CONVOCATION", description: "Convocation des héritiers ou parties concernées", icon: "Bell", time: "3 j", status: "pending", button: { actionId: "start_convocation" } },
      { key: "description", label: "DESCRIPTION", description: "Description détaillée et physique des biens mobiliers et immobiliers", icon: "List", time: "5 j", status: "pending", button: { actionId: "start_description" } },
      { key: "evaluation", label: "ÉVALUATION", description: "Estimation de la valeur de chaque bien par le notaire ou expert", icon: "BarChart2", time: "5 j", status: "pending", button: { actionId: "start_evaluation" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction du procès-verbal d'inventaire", icon: "PenLine", time: "3 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature des parties présentes", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "depot", label: "DÉPÔT", description: "Dépôt au rang des minutes du notaire", icon: "Stamp", time: "2 j", status: "pending", button: { actionId: "start_depot" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage du procès-verbal d'inventaire", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },

  // ── Actes commerciaux et sociétés ──────────────────────────────
  "Création de société (statuts)": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "constitution", label: "CONSTITUTION", description: "Collecte des pièces des associés et apports", icon: "FolderOpen", time: "3 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION STATUTS", description: "Rédaction des statuts et PV de constitution", icon: "PenLine", time: "5 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature des statuts par tous les associés", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement fiscal des statuts", icon: "Stamp", time: "7 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "immatriculation", label: "IMMATRICULATION", description: "Immatriculation au RCCM (Registre du Commerce)", icon: "Building2", time: "14 j", status: "pending", button: { actionId: "start_immatriculation" } },
      { key: "publication", label: "PUBLICATION", description: "Publication au Journal Officiel et avis de constitution", icon: "Newspaper", time: "14 j", status: "pending", button: { actionId: "start_publication" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage des statuts et du dossier constitutif", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Modification des statuts": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "deliberation", label: "DÉLIBÉRATION", description: "Assemblée générale extraordinaire et décision de modification", icon: "Users", time: "3 j", status: "pending", button: { actionId: "start_deliberation" } },
      { key: "constitution", label: "CONSTITUTION", description: "PV d'AG, statuts en vigueur et pièces modificatives", icon: "FolderOpen", time: "2 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction des statuts modifiés et de l'acte notarié", icon: "PenLine", time: "3 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature des associés et du notaire", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement de la modification", icon: "Stamp", time: "7 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "publication", label: "PUBLICATION", description: "Publication légale au Journal Officiel", icon: "Newspaper", time: "14 j", status: "pending", button: { actionId: "start_publication" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage des statuts modifiés", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Cession de parts sociales": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "enquete", label: "ENQUÊTE", description: "Vérification du registre des associés et des clauses d'agrément", icon: "Search", time: "2 j", status: "pending", button: { actionId: "start_enquete" } },
      { key: "constitution", label: "CONSTITUTION", description: "Statuts, registre des parts et pièces des parties", icon: "FolderOpen", time: "2 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de cession de parts", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "notification", label: "NOTIFICATION", description: "Notification ou signification aux gérants de la société", icon: "Bell", time: "3 j", status: "pending", button: { actionId: "start_notification" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du cédant et du cessionnaire", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement fiscal et mise à jour du registre des associés", icon: "Stamp", time: "7 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage de l'acte de cession", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Cession de fonds de commerce": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "enquete", label: "ENQUÊTE", description: "Vérification des inscriptions sur le fonds et situation fiscale", icon: "Search", time: "5 j", status: "pending", button: { actionId: "start_enquete" } },
      { key: "evaluation", label: "ÉVALUATION", description: "Évaluation du fonds de commerce et de ses éléments", icon: "BarChart2", time: "5 j", status: "pending", button: { actionId: "start_evaluation" } },
      { key: "constitution", label: "CONSTITUTION", description: "Documents du cédant, bilan, bail et licences", icon: "FolderOpen", time: "3 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de cession du fonds de commerce", icon: "PenLine", time: "3 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du cédant et du cessionnaire", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "publicite", label: "PUBLICITÉ", description: "Publication légale et purge des oppositions créanciers", icon: "Send", time: "14 j", status: "pending", button: { actionId: "start_publicite" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage de l'acte de cession", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Dissolution de société": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "deliberation", label: "DÉLIBÉRATION", description: "Assemblée générale extraordinaire votant la dissolution", icon: "Users", time: "3 j", status: "pending", button: { actionId: "start_deliberation" } },
      { key: "constitution", label: "CONSTITUTION", description: "PV d'AG, statuts, bilan de dissolution et pièces fiscales", icon: "FolderOpen", time: "3 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de dissolution notarié", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature des associés et du liquidateur désigné", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "liquidation", label: "LIQUIDATION", description: "Opérations de liquidation et apurement des dettes", icon: "Calculator", time: "30 j", status: "pending", button: { actionId: "start_liquidation" } },
      { key: "radiation", label: "RADIATION", description: "Radiation du RCCM et clôture des comptes fiscaux", icon: "Trash2", time: "14 j", status: "pending", button: { actionId: "start_radiation" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage du dossier de dissolution", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Procès-verbal d'assemblée": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "convocation", label: "CONVOCATION", description: "Envoi des convocations avec ordre du jour aux associés", icon: "Bell", time: "15 j", status: "pending", button: { actionId: "start_convocation" } },
      { key: "tenue_ag", label: "TENUE AG", description: "Tenue de l'assemblée générale et délibérations", icon: "Users", time: "1 j", status: "pending", button: { actionId: "start_tenue_ag" } },
      { key: "redaction", label: "RÉDACTION PV", description: "Rédaction du procès-verbal notarié de l'assemblée", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature des associés présents et du notaire", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement fiscal du PV", icon: "Stamp", time: "7 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage du procès-verbal", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Nomination de dirigeants": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "deliberation", label: "DÉLIBÉRATION", description: "Décision de l'assemblée ou du conseil d'administration", icon: "Users", time: "1 j", status: "pending", button: { actionId: "start_deliberation" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de nomination notarié", icon: "PenLine", time: "1 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du dirigeant nommé et des associés", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement de la nomination", icon: "Stamp", time: "5 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "publication", label: "PUBLICATION", description: "Publication légale et mise à jour du RCCM", icon: "Newspaper", time: "10 j", status: "pending", button: { actionId: "start_publication" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage de l'acte de nomination", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },

  // ── Actes financiers ───────────────────────────────────────────
  "Prêt notarié": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "constitution", label: "CONSTITUTION", description: "Pièces du prêteur, de l'emprunteur et du bien en garantie", icon: "FolderOpen", time: "3 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "evaluation", label: "ÉVAL. GARANTIE", description: "Évaluation du bien donné en garantie hypothécaire", icon: "BarChart2", time: "3 j", status: "pending", button: { actionId: "start_evaluation" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de prêt avec constitution d'hypothèque", icon: "PenLine", time: "3 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du prêteur et de l'emprunteur", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "inscription", label: "INSCRIPTION", description: "Inscription de l'hypothèque à la Conservation foncière", icon: "Stamp", time: "14 j", status: "pending", button: { actionId: "start_inscription" } },
      { key: "deblocage", label: "DÉBLOCAGE FONDS", description: "Déblocage des fonds par le notaire séquestre", icon: "CreditCard", time: "1 j", status: "pending", button: { actionId: "start_deblocage" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Reconnaissance de dette": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "constitution", label: "CONSTITUTION", description: "Pièces d'identité des parties et justificatifs de la dette", icon: "FolderOpen", time: "1 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "verification", label: "VÉRIFICATION", description: "Vérification du montant et des modalités de remboursement", icon: "Search", time: "1 j", status: "pending", button: { actionId: "start_verification" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de reconnaissance de dette", icon: "PenLine", time: "1 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du débiteur en présence du notaire", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement de l'acte", icon: "Stamp", time: "3 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Conservation de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Constitution de garantie (hypothèque, nantissement)": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "evaluation", label: "ÉVALUATION", description: "Évaluation du bien ou droit donné en garantie", icon: "BarChart2", time: "3 j", status: "pending", button: { actionId: "start_evaluation" } },
      { key: "constitution", label: "CONSTITUTION", description: "Documents du débiteur, créancier et bien en garantie", icon: "FolderOpen", time: "3 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de constitution de garantie", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature des parties", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "inscription", label: "INSCRIPTION", description: "Inscription au registre compétent (foncier ou RCCM)", icon: "Stamp", time: "14 j", status: "pending", button: { actionId: "start_inscription" } },
      { key: "notification", label: "NOTIFICATION", description: "Notification aux tiers concernés", icon: "Bell", time: "2 j", status: "pending", button: { actionId: "start_notification" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Mainlevée de garantie": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "verification", label: "VÉRIF. PAIEMENT", description: "Vérification de l'extinction totale de la dette garantie", icon: "Search", time: "2 j", status: "pending", button: { actionId: "start_verification" } },
      { key: "constitution", label: "CONSTITUTION", description: "Justificatifs de remboursement et acte constitutif de garantie", icon: "FolderOpen", time: "2 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de mainlevée de garantie", icon: "PenLine", time: "1 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du créancier", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "radiation", label: "RADIATION", description: "Radiation de l'inscription au registre compétent", icon: "Stamp", time: "10 j", status: "pending", button: { actionId: "start_radiation" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Archivage de la mainlevée", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Acte de cautionnement": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "constitution", label: "CONSTITUTION", description: "Pièces du créancier, du débiteur et de la caution", icon: "FolderOpen", time: "2 j", status: "pending", button: { actionId: "start_constitution" } },
      { key: "analyse", label: "ANALYSE RISQUE", description: "Évaluation de la solvabilité de la caution", icon: "BarChart2", time: "3 j", status: "pending", button: { actionId: "start_analyse" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de cautionnement notarié", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "signature", label: "SIGNATURE", description: "Signature de la caution, du débiteur et du créancier", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement de l'acte de cautionnement", icon: "Stamp", time: "3 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Conservation de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },

  // ── Actes administratifs et divers ─────────────────────────────
  "Procuration (mandat)": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "consultation", label: "CONSULTATION", description: "Entretien avec le mandant sur l'étendue des pouvoirs", icon: "Users", time: "1 j", status: "pending", button: { actionId: "start_consultation" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de la procuration avec délimitation des pouvoirs", icon: "PenLine", time: "1 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "lecture", label: "LECTURE", description: "Lecture de l'acte au mandant", icon: "Eye", time: "1 j", status: "pending", button: { actionId: "start_lecture" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du mandant", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement si nécessaire selon la nature des pouvoirs", icon: "Stamp", time: "2 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Conservation de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Légalisation de signature": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "verification", label: "VÉRIF. IDENTITÉ", description: "Vérification de l'identité du signataire par pièce officielle", icon: "Search", time: "1 j", status: "pending", button: { actionId: "start_verification" } },
      { key: "comparution", label: "COMPARUTION", description: "Comparution physique du signataire devant le notaire", icon: "Users", time: "1 j", status: "pending", button: { actionId: "start_comparution" } },
      { key: "signature", label: "SIGNATURE", description: "Apposition de la signature en présence du notaire", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "legalisation", label: "LÉGALISATION", description: "Apposition du cachet et de la mention de légalisation", icon: "Stamp", time: "1 j", status: "pending", button: { actionId: "start_legalisation" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Enregistrement dans le registre de légalisation", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Certification conforme de documents": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "verification", label: "VÉRIF. ORIGINAL", description: "Vérification de l'authenticité du document original", icon: "Search", time: "1 j", status: "pending", button: { actionId: "start_verification" } },
      { key: "certification", label: "CERTIFICATION", description: "Apposition de la mention de conformité et du cachet notarial", icon: "CheckCircle2", time: "1 j", status: "pending", button: { actionId: "start_certification" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du notaire certifiant la conformité", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "remise", label: "REMISE", description: "Remise de la copie certifiée conforme au demandeur", icon: "Send", time: "1 j", status: "pending", button: { actionId: "start_remise" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Enregistrement dans le registre des certifications", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Déclaration sur l'honneur": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "consultation", label: "CONSULTATION", description: "Entretien avec le déclarant sur l'objet de la déclaration", icon: "Users", time: "1 j", status: "pending", button: { actionId: "start_consultation" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de la déclaration notariée", icon: "PenLine", time: "1 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "lecture", label: "LECTURE", description: "Lecture de la déclaration au comparant", icon: "Eye", time: "1 j", status: "pending", button: { actionId: "start_lecture" } },
      { key: "signature", label: "SIGNATURE", description: "Signature du déclarant devant le notaire", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement de l'acte", icon: "Stamp", time: "2 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Conservation de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Convention entre parties": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "consultation", label: "CONSULTATION", description: "Entretien avec les parties sur l'objet et les conditions", icon: "Users", time: "1 j", status: "pending", button: { actionId: "start_consultation" } },
      { key: "negociation", label: "NÉGOCIATION", description: "Accord des parties sur les termes et clauses de la convention", icon: "Handshake", time: "5 j", status: "pending", button: { actionId: "start_negociation" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de la convention notariée", icon: "PenLine", time: "2 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "lecture", label: "LECTURE", description: "Lecture de la convention à toutes les parties", icon: "Eye", time: "1 j", status: "pending", button: { actionId: "start_lecture" } },
      { key: "signature", label: "SIGNATURE", description: "Signature de toutes les parties contractantes", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement fiscal de la convention", icon: "Stamp", time: "5 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Conservation de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
  "Acte de transaction": {
    layout: "horizontal", palette: WORKFLOW_PALETTE,
    steps: [
      { key: "consultation", label: "CONSULTATION", description: "Entretien avec les parties sur le litige à régler", icon: "Users", time: "1 j", status: "pending", button: { actionId: "start_consultation" } },
      { key: "negociation", label: "NÉGOCIATION", description: "Conciliation et accord transactionnel entre les parties", icon: "Handshake", time: "7 j", status: "pending", button: { actionId: "start_negociation" } },
      { key: "redaction", label: "RÉDACTION", description: "Rédaction de l'acte de transaction notarié", icon: "PenLine", time: "3 j", status: "pending", button: { actionId: "start_redaction" } },
      { key: "lecture", label: "LECTURE", description: "Lecture et explication de l'acte aux parties", icon: "Eye", time: "1 j", status: "pending", button: { actionId: "start_lecture" } },
      { key: "signature", label: "SIGNATURE", description: "Signature de toutes les parties", icon: "FileSignature", time: "1 j", status: "pending", button: { actionId: "start_signature" } },
      { key: "enregistrement", label: "ENREGISTREMENT", description: "Enregistrement de la transaction", icon: "Stamp", time: "5 j", status: "pending", button: { actionId: "start_enregistrement" } },
      { key: "archivage", label: "ARCHIVAGE", description: "Conservation de la minute", icon: "Archive", time: "1 j", status: "pending", button: { actionId: "start_archivage" } },
    ],
  },
};
