// Mock data with realistic Guinean names and notarial context

export const currentUser = {
  id: "1",
  name: "Maître Mamadou Diallo",
  firstName: "Mamadou",
  role: "Gérant",
  avatar: null,
  cabinet: "Étude Notariale Diallo & Associés",
  email: "m.diallo@notario.gn",
};

export const mockClients = [
  { id: "1", code: "C-1201", nom: "Bah", prenom: "Oumar", type: "Physique" as const, telephone: "+224 62 44 55 66", email: "bah.oumar@email.com", profession: "Commerçant", statut: "Actif" as const, dateInscription: "2024-03-15" },
  { id: "2", code: "C-1202", nom: "SARL Nimba", prenom: "", type: "Morale" as const, telephone: "+224 62 77 88 99", email: "contact@sarlnimba.gn", profession: "Import-Export", statut: "Actif" as const, dateInscription: "2024-01-22" },
  { id: "3", code: "C-1203", nom: "Diallo", prenom: "Famille", type: "Physique" as const, telephone: "+224 62 11 22 33", email: "diallo.famille@email.com", profession: "Propriétaire", statut: "Actif" as const, dateInscription: "2024-08-12" },
  { id: "4", code: "C-1204", nom: "Camara", prenom: "Aïssatou", type: "Physique" as const, telephone: "+224 62 99 88 77", email: "aissatou.camara@email.com", profession: "Médecin", statut: "Prospect" as const, dateInscription: "2024-06-03" },
  { id: "5", code: "C-1205", nom: "Société KankanCorp", prenom: "", type: "Morale" as const, telephone: "+224 62 55 44 33", email: "info@kankancorp.gn", profession: "BTP", statut: "Actif" as const, dateInscription: "2024-07-20" },
  { id: "6", code: "C-1206", nom: "Soumah", prenom: "Fatoumata", type: "Physique" as const, telephone: "+224 62 33 22 11", email: "f.soumah@email.gn", profession: "Avocate", statut: "Actif" as const, dateInscription: "2024-09-10" },
  { id: "7", code: "C-1207", nom: "Condé", prenom: "Mariama", type: "Physique" as const, telephone: "+224 62 22 99 88", email: "m.conde@email.gn", profession: "Entrepreneure", statut: "Inactif" as const, dateInscription: "2024-02-10" },
  { id: "8", code: "C-1208", nom: "Sylla", prenom: "Mohamed", type: "Physique" as const, telephone: "+224 62 88 55 44", email: "m.sylla@email.gn", profession: "Fonctionnaire", statut: "Actif" as const, dateInscription: "2024-01-25" },
];

export interface PartiePrenanteEntry {
  clientCode: string;
  nom: string;
  role: "Acheteur" | "Vendeur" | "Bénéficiaire" | "Mandant" | "Mandataire" | "Preneur" | "Bailleur" | "Donateur" | "Donataire" | "Héritier" | "Autre";
}

export interface Dossier {
  id: string;
  code: string;
  typeActe: string;
  objet: string;
  clients: string[];
  clientDate: string;
  montant: number;
  statut: "En cours" | "En signature" | "En attente pièces" | "Terminé" | "Suspendu" | "Archivé";
  priorite: "Basse" | "Normale" | "Haute" | "Urgente";
  avancement: number;
  nbActes: number;
  nbPieces: number;
  date: string;
  notaire: string;
  parties?: PartiePrenanteEntry[];
}

export const rolesParties = ["Acheteur", "Vendeur", "Bénéficiaire", "Mandant", "Mandataire", "Preneur", "Bailleur", "Donateur", "Donataire", "Héritier", "Autre"] as const;

export const mockDossiers: Dossier[] = [
  { id: "1", code: "N-2025-101", typeActe: "Vente immobilière", objet: "Vente – Villa", clients: ["Bah Oumar", "Fam. Diallo"], clientDate: "15/03/2024", montant: 3200000, statut: "En cours", priorite: "Normale", avancement: 65, nbActes: 2, nbPieces: 8, date: "2024-03-15", notaire: "Maître Notario", parties: [{ clientCode: "C-1201", nom: "Bah Oumar", role: "Acheteur" }, { clientCode: "C-1203", nom: "Fam. Diallo", role: "Vendeur" }] },
  { id: "2", code: "N-2025-102", typeActe: "Succession", objet: "Succession", clients: ["Sylla F."], clientDate: "22/01/2024", montant: 1500000, statut: "En attente pièces", priorite: "Haute", avancement: 35, nbActes: 1, nbPieces: 3, date: "2024-01-22", notaire: "Maître Notario", parties: [{ clientCode: "C-1208", nom: "Sylla Mohamed", role: "Héritier" }] },
  { id: "3", code: "N-2025-103", typeActe: "Constitution société", objet: "Constitution", clients: ["SARL Nimba"], clientDate: "08/04/2024", montant: 200000, statut: "En signature", priorite: "Normale", avancement: 90, nbActes: 3, nbPieces: 12, date: "2024-04-08", notaire: "Maître Notario", parties: [{ clientCode: "C-1202", nom: "SARL Nimba", role: "Bénéficiaire" }] },
  { id: "4", code: "N-2025-104", typeActe: "Vente immobilière", objet: "Vente immobilière", clients: ["Fam. Diallo"], clientDate: "12/08/2024", montant: 4500000, statut: "En cours", priorite: "Urgente", avancement: 45, nbActes: 1, nbPieces: 6, date: "2024-08-12", notaire: "Maître Notario", parties: [{ clientCode: "C-1203", nom: "Fam. Diallo", role: "Vendeur" }] },
  { id: "5", code: "N-2025-105", typeActe: "Donation", objet: "Donation", clients: ["Camara A."], clientDate: "03/06/2024", montant: 800000, statut: "En signature", priorite: "Normale", avancement: 80, nbActes: 2, nbPieces: 5, date: "2024-06-03", notaire: "Maître Notario", parties: [{ clientCode: "C-1204", nom: "Camara Aïssatou", role: "Donateur" }] },
  { id: "6", code: "N-2025-106", typeActe: "Constitution société", objet: "Statuts SARL", clients: ["Société KankanCorp"], clientDate: "20/07/2024", montant: 200000, statut: "En attente pièces", priorite: "Basse", avancement: 25, nbActes: 0, nbPieces: 2, date: "2024-07-20", notaire: "Maître Notario", parties: [{ clientCode: "C-1205", nom: "Société KankanCorp", role: "Bénéficiaire" }] },
];

export interface KanbanTask {
  id: string;
  titre: string;
  description: string;
  assignee: string;
  deadline: string;
  priorite: "Haute" | "Normale" | "Basse" | "Urgente";
  dossier?: string;
  tags: string[];
}

export const mockKanbanTasks: KanbanTask[] = [
  { id: "k1", titre: "Préparer acte A-8842", description: "Rédiger l'acte de vente pour le dossier N-2025-101", assignee: "Maître Notario", deadline: "14/08/2025", priorite: "Haute", dossier: "N-2025-101", tags: ["acte", "vente"] },
  { id: "k2", titre: "Demander pièce identité", description: "Contacter le client pour obtenir sa carte d'identité", assignee: "Aïssatou Conté", deadline: "17/08/2025", priorite: "Normale", dossier: "N-2025-102", tags: ["client", "pièces"] },
  { id: "k3", titre: "Archivage dossier 2024", description: "Classer et archiver les dossiers de 2024", assignee: "Aïssatou Conté", deadline: "24/08/2025", priorite: "Basse", tags: ["archives", "classement"] },
  { id: "k4", titre: "Signature A-8843", description: "Finaliser la signature électronique de l'acte", assignee: "Maître Notario", deadline: "13/08/2025", priorite: "Urgente", dossier: "N-2025-103", tags: ["signature", "électronique"] },
  { id: "k5", titre: "Révision statuts SARL", description: "Vérifier et valider les statuts de la société", assignee: "Maître Notario", deadline: "15/08/2025", priorite: "Haute", dossier: "N-2025-104", tags: ["statuts", "entreprise"] },
  { id: "k6", titre: "Consultation client", description: "Rendez-vous avec nouveau client pour consultation", assignee: "Maître Notario", deadline: "12/08/2025", priorite: "Normale", tags: ["consultation", "client"] },
  { id: "k7", titre: "Facture F-2025-231", description: "Générer et envoyer la facture au client", assignee: "Aïssatou Conté", deadline: "09/08/2025", priorite: "Normale", dossier: "N-2025-103", tags: ["facture", "paiement"] },
  { id: "k8", titre: "Mise à jour modèles", description: "Actualiser les modèles de documents", assignee: "Aïssatou Conté", deadline: "07/08/2025", priorite: "Basse", tags: ["modèles", "mise à jour"] },
];

export const mockFactures = [
  { id: "1", numero: "FAC-2026-001", client: "Camara Fatoumata", montant: 3500000, statut: "Payée" as const, dateEmission: "2026-02-20", dossier: "DOS-2026-001" },
  { id: "2", numero: "FAC-2026-002", client: "SCI Les Palmiers", montant: 1800000, statut: "Émise" as const, dateEmission: "2026-02-25", dossier: "DOS-2026-002" },
  { id: "3", numero: "FAC-2026-003", client: "SARL Guinée Invest", montant: 950000, statut: "En retard" as const, dateEmission: "2026-01-15", dossier: "DOS-2026-003" },
  { id: "4", numero: "FAC-2026-004", client: "Soumah Aissatou", montant: 7200000, statut: "Payée" as const, dateEmission: "2025-12-15", dossier: "DOS-2025-048" },
  { id: "5", numero: "FAC-2026-005", client: "Condé Mariama", montant: 2100000, statut: "Brouillon" as const, dateEmission: "2026-03-06", dossier: "DOS-2026-004" },
  { id: "6", numero: "FAC-2026-006", client: "Barry Ousmane", montant: 5500000, statut: "Payée" as const, dateEmission: "2025-11-25", dossier: "DOS-2025-045" },
];

export const mockRevenueData = [
  { mois: "Avr", revenus: 12500000, depenses: 4200000 },
  { mois: "Mai", revenus: 18200000, depenses: 5800000 },
  { mois: "Juin", revenus: 15800000, depenses: 3900000 },
  { mois: "Jul", revenus: 22100000, depenses: 6100000 },
  { mois: "Aoû", revenus: 19500000, depenses: 5500000 },
  { mois: "Sep", revenus: 24300000, depenses: 7200000 },
  { mois: "Oct", revenus: 21800000, depenses: 6800000 },
  { mois: "Nov", revenus: 28500000, depenses: 8100000 },
  { mois: "Déc", revenus: 32100000, depenses: 9500000 },
  { mois: "Jan", revenus: 26700000, depenses: 7800000 },
  { mois: "Fév", revenus: 29800000, depenses: 8400000 },
  { mois: "Mar", revenus: 31200000, depenses: 9100000 },
];

export const mockActivities = [
  { id: "1", action: "Nouveau dossier créé", detail: "DOS-2026-004 — Donation", user: "Me Diallo", time: "Il y a 2h", type: "dossier" as const },
  { id: "2", action: "Facture payée", detail: "FAC-2026-001 — 3 500 000 GNF", user: "Comptable", time: "Il y a 3h", type: "paiement" as const },
  { id: "3", action: "Client ajouté", detail: "Condé Mariama", user: "Me Keita", time: "Il y a 5h", type: "client" as const },
  { id: "4", action: "Document signé", detail: "Acte de vente — DOS-2026-001", user: "Me Diallo", time: "Hier", type: "signature" as const },
  { id: "5", action: "Rendez-vous confirmé", detail: "Bah Ibrahima — 10 Mars 10h00", user: "Secrétariat", time: "Hier", type: "rdv" as const },
  { id: "6", action: "Paiement reçu", detail: "Orange Money — 5 500 000 GNF", user: "Comptable", time: "Il y a 2j", type: "paiement" as const },
];

export const mockTasks = [
  { id: "1", titre: "Rédiger acte de vente DOS-2026-001", assignee: "Me Diallo", deadline: "12 Mars", priorite: "Haute" as const, dossier: "DOS-2026-001" },
  { id: "2", titre: "Vérifier documents SCI Les Palmiers", assignee: "Me Keita", deadline: "14 Mars", priorite: "Moyenne" as const, dossier: "DOS-2026-002" },
  { id: "3", titre: "Relancer facture FAC-2026-003", assignee: "Comptable", deadline: "10 Mars", priorite: "Haute" as const, dossier: "DOS-2026-003" },
];

export const mockAgendaToday = [
  { id: "1", heure: "09:00", titre: "RDV Camara Fatoumata", lieu: "Bureau", duree: "1h" },
  { id: "2", heure: "11:00", titre: "Signature acte — DOS-2026-002", lieu: "Salle de conférence", duree: "30min" },
  { id: "3", heure: "14:30", titre: "Consultation Bah Ibrahima", lieu: "Bureau", duree: "45min" },
  { id: "4", heure: "16:00", titre: "Réunion équipe", lieu: "Salle de conférence", duree: "1h" },
];

export const formatGNF = (amount: number): string => {
  return new Intl.NumberFormat('fr-GN', { style: 'decimal' }).format(amount) + ' GNF';
};
