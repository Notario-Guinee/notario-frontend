// ═══════════════════════════════════════════════════════════════
// Données mock — Module Documents
// 8 documents liés aux dossiers N-2025-101 à N-2025-108
// Utilisateurs : Mamadou Diallo, Aïssatou Keita,
//               Boubacar Diallo, Fatoumata Bah
// ═══════════════════════════════════════════════════════════════

import type {
  NotarioDocument,
  UserRef,
  DocumentVersion,
  DocumentCollaborator,
  DocumentChange,
  DocumentComment,
} from "@/types/documents";

// ─── Utilisateurs de référence ───────────────────────────────

export const userMamadou: UserRef = {
  id: "u1",
  nom: "Diallo",
  prenom: "Mamadou",
  initiales: "MD",
  role: "Notaire Gérant",
};

export const userAissatou: UserRef = {
  id: "u2",
  nom: "Keita",
  prenom: "Aïssatou",
  initiales: "AK",
  role: "Notaire Associée",
};

export const userBoubacar: UserRef = {
  id: "u3",
  nom: "Diallo",
  prenom: "Boubacar",
  initiales: "BD",
  role: "Clerc",
};

export const userFatoumata: UserRef = {
  id: "u4",
  nom: "Bah",
  prenom: "Fatoumata",
  initiales: "FB",
  role: "Clerc",
};

// ─── Helpers ──────────────────────────────────────────────────

function d(iso: string): Date {
  return new Date(iso);
}

function makeVersion(
  id: string,
  docId: string,
  vNum: number,
  vLabel: string,
  createdBy: UserRef,
  createdAt: string,
  isMajor: boolean,
  changesSummary: string,
  parentId?: string
): DocumentVersion {
  return {
    id,
    documentId: docId,
    versionNumber: vNum,
    versionLabel: vLabel,
    content: `<h1>Document version ${vLabel}</h1><p>Contenu de la version ${vLabel} rédigé par ${createdBy.prenom} ${createdBy.nom}.</p>`,
    contentSnapshot: `Version ${vLabel} — ${changesSummary}`,
    createdAt: d(createdAt),
    createdBy,
    changesSummary,
    isDraft: !isMajor,
    isMajorVersion: isMajor,
    parentVersionId: parentId,
    wordCount: 340 + vNum * 45,
    sizeBytes: 12800 + vNum * 1024,
  };
}

function makeCollaborator(
  id: string,
  userId: string,
  user: UserRef,
  docId: string,
  role: DocumentCollaborator["role"],
  invitedBy: UserRef,
  isOnline: boolean,
  color: string
): DocumentCollaborator {
  return {
    id,
    userId,
    user,
    documentId: docId,
    role,
    invitedAt: d("2025-02-01"),
    invitedBy,
    acceptedAt: d("2025-02-02"),
    lastViewedAt: d("2026-03-26"),
    lastEditAt: isOnline ? d("2026-03-27") : d("2026-03-20"),
    isOnline,
    cursorColor: color,
    canInviteOthers: role === "proprietaire" || role === "editeur",
  };
}

function makeChange(
  id: string,
  docId: string,
  versionId: string,
  user: UserRef,
  changeType: DocumentChange["changeType"],
  description: string,
  timestamp: string
): DocumentChange {
  return {
    id,
    documentId: docId,
    versionId,
    userId: user.id,
    user,
    changeType,
    description,
    diff: `+++ ${description}`,
    timestamp: d(timestamp),
  };
}

function makeComment(
  id: string,
  docId: string,
  content: string,
  author: UserRef,
  createdAt: string,
  highlighted?: string,
  isResolved?: boolean,
  replies?: DocumentComment[]
): DocumentComment {
  return {
    id,
    documentId: docId,
    content,
    author,
    createdAt: d(createdAt),
    highlightedText: highlighted,
    replies: replies ?? [],
    isResolved: isResolved ?? false,
    position: { top: Math.floor(Math.random() * 400) + 100 },
  };
}

// ─── Document 1 — N-2025-101 Acte de vente ───────────────────

const doc1Id = "doc-101";
const doc1V1 = makeVersion("v1-1", doc1Id, 1, "1.0", userMamadou, "2025-03-15", true, "Rédaction initiale de l'acte de vente");
const doc1V2 = makeVersion("v1-2", doc1Id, 2, "1.1", userAissatou, "2025-03-20", false, "Corrections clauses résolutoires", "v1-1");
const doc1V3 = makeVersion("v1-3", doc1Id, 3, "2.0", userMamadou, "2025-04-01", true, "Version finale après révision complète", "v1-2");

const doc1: NotarioDocument = {
  id: doc1Id,
  dossierId: "1",
  dossierRef: "N-2025-101",
  title: "Acte de vente — Villa Coleah",
  type: "acte",
  status: "valide",
  currentVersion: doc1V3,
  versions: [doc1V1, doc1V2, doc1V3],
  collaborators: [
    makeCollaborator("c1-1", "u1", userMamadou, doc1Id, "proprietaire", userMamadou, true, "#3b82f6"),
    makeCollaborator("c1-2", "u2", userAissatou, doc1Id, "editeur", userMamadou, true, "#10b981"),
    makeCollaborator("c1-3", "u3", userBoubacar, doc1Id, "commentateur", userMamadou, false, "#f59e0b"),
  ],
  changes: [
    makeChange("ch1-1", doc1Id, "v1-1", userMamadou, "insertion", "Rédaction des clauses de propriété", "2025-03-15T09:00:00"),
    makeChange("ch1-2", doc1Id, "v1-1", userMamadou, "modification", "Mise à jour du prix de cession", "2025-03-16T14:30:00"),
    makeChange("ch1-3", doc1Id, "v1-2", userAissatou, "modification", "Correction des conditions suspensives", "2025-03-20T10:00:00"),
    makeChange("ch1-4", doc1Id, "v1-2", userAissatou, "commentaire", "Annotation sur la clause de garantie", "2025-03-21T11:00:00"),
    makeChange("ch1-5", doc1Id, "v1-3", userMamadou, "formatage", "Mise en forme finale du document", "2025-04-01T08:00:00"),
  ],
  comments: [
    makeComment("cm1-1", doc1Id, "La clause résolutoire doit mentionner le délai de 30 jours.", userAissatou, "2025-03-20T10:15:00", "clause résolutoire"),
    makeComment("cm1-2", doc1Id, "Vérifier le numéro de titre foncier avant signature.", userBoubacar, "2025-03-22T14:00:00", "titre foncier TF-4521"),
    makeComment("cm1-3", doc1Id, "Montant des honoraires conforme au barème.", userMamadou, "2025-04-01T09:00:00", "honoraires", true),
    makeComment("cm1-4", doc1Id, "Ajouter la référence cadastrale parcelle 18-B.", userFatoumata, "2025-03-25T15:30:00", "référence cadastrale"),
  ],
  createdAt: d("2025-03-15"),
  createdBy: userMamadou,
  updatedAt: d("2025-04-01"),
  updatedBy: userMamadou,
  tags: ["vente", "immobilier", "villa", "coleah"],
  isLocked: false,
  metadata: { wordCount: 1250, pageCount: 4, readingTimeMinutes: 5 },
};

// ─── Document 2 — N-2025-102 Attestation de succession ────────

const doc2Id = "doc-102";
const doc2V1 = makeVersion("v2-1", doc2Id, 1, "1.0", userMamadou, "2025-01-22", true, "Rédaction de l'attestation de succession");
const doc2V2 = makeVersion("v2-2", doc2Id, 2, "1.1", userBoubacar, "2025-02-10", false, "Ajout de la liste des héritiers", "v2-1");

const doc2: NotarioDocument = {
  id: doc2Id,
  dossierId: "2",
  dossierRef: "N-2025-102",
  title: "Attestation de succession — Famille Sylla",
  type: "attestation",
  status: "en_revision",
  currentVersion: doc2V2,
  versions: [doc2V1, doc2V2],
  collaborators: [
    makeCollaborator("c2-1", "u1", userMamadou, doc2Id, "proprietaire", userMamadou, false, "#3b82f6"),
    makeCollaborator("c2-2", "u3", userBoubacar, doc2Id, "editeur", userMamadou, true, "#8b5cf6"),
    makeCollaborator("c2-3", "u4", userFatoumata, doc2Id, "commentateur", userMamadou, false, "#ec4899"),
  ],
  changes: [
    makeChange("ch2-1", doc2Id, "v2-1", userMamadou, "insertion", "Création de l'attestation de succession", "2025-01-22T09:00:00"),
    makeChange("ch2-2", doc2Id, "v2-1", userMamadou, "modification", "Correction de l'identité du défunt", "2025-01-25T11:00:00"),
    makeChange("ch2-3", doc2Id, "v2-2", userBoubacar, "insertion", "Ajout des 3 héritiers légaux", "2025-02-10T10:00:00"),
    makeChange("ch2-4", doc2Id, "v2-2", userBoubacar, "modification", "Mise à jour des quotes-parts", "2025-02-12T14:00:00"),
    makeChange("ch2-5", doc2Id, "v2-2", userFatoumata, "commentaire", "Note sur les pièces manquantes", "2025-02-15T09:30:00"),
    makeChange("ch2-6", doc2Id, "v2-2", userMamadou, "formatage", "Ajustement de la mise en page", "2025-02-20T16:00:00"),
  ],
  comments: [
    makeComment("cm2-1", doc2Id, "Il manque la copie d'acte de naissance de Mohamed Sylla.", userFatoumata, "2025-02-15T09:30:00", "Mohamed Sylla"),
    makeComment("cm2-2", doc2Id, "La quote-part de la veuve doit être recalculée selon le droit guinéen.", userAissatou, "2025-02-18T11:00:00", "quote-part de la veuve"),
    makeComment("cm2-3", doc2Id, "Référencer le jugement d'hérédité n°42/2025.", userBoubacar, "2025-02-20T14:00:00"),
  ],
  createdAt: d("2025-01-22"),
  createdBy: userMamadou,
  updatedAt: d("2025-02-20"),
  updatedBy: userBoubacar,
  tags: ["succession", "attestation", "héritiers"],
  isLocked: false,
  metadata: { wordCount: 680, pageCount: 2, readingTimeMinutes: 3 },
};

// ─── Document 3 — N-2025-103 Statuts SARL ─────────────────────

const doc3Id = "doc-103";
const doc3V1 = makeVersion("v3-1", doc3Id, 1, "1.0", userAissatou, "2025-04-08", true, "Rédaction des statuts constitutifs");
const doc3V2 = makeVersion("v3-2", doc3Id, 2, "1.1", userAissatou, "2025-04-15", false, "Ajout des clauses de gérance", "v3-1");
const doc3V3 = makeVersion("v3-3", doc3Id, 3, "1.2", userBoubacar, "2025-04-22", false, "Correction de l'objet social", "v3-2");
const doc3V4 = makeVersion("v3-4", doc3Id, 4, "2.0", userAissatou, "2025-05-05", true, "Version finale signée", "v3-3");

const doc3: NotarioDocument = {
  id: doc3Id,
  dossierId: "3",
  dossierRef: "N-2025-103",
  title: "Statuts SARL Nimba Import-Export",
  type: "contrat",
  status: "valide",
  currentVersion: doc3V4,
  versions: [doc3V1, doc3V2, doc3V3, doc3V4],
  collaborators: [
    makeCollaborator("c3-1", "u2", userAissatou, doc3Id, "proprietaire", userAissatou, true, "#10b981"),
    makeCollaborator("c3-2", "u1", userMamadou, doc3Id, "editeur", userAissatou, false, "#3b82f6"),
    makeCollaborator("c3-3", "u3", userBoubacar, doc3Id, "editeur", userAissatou, true, "#8b5cf6"),
    makeCollaborator("c3-4", "u4", userFatoumata, doc3Id, "lecteur", userAissatou, false, "#ec4899"),
  ],
  changes: [
    makeChange("ch3-1", doc3Id, "v3-1", userAissatou, "insertion", "Rédaction de l'objet social et du capital", "2025-04-08T09:00:00"),
    makeChange("ch3-2", doc3Id, "v3-2", userAissatou, "insertion", "Ajout des articles sur la gérance", "2025-04-15T10:00:00"),
    makeChange("ch3-3", doc3Id, "v3-2", userMamadou, "modification", "Modification du siège social", "2025-04-16T14:00:00"),
    makeChange("ch3-4", doc3Id, "v3-3", userBoubacar, "modification", "Reformulation de l'objet social", "2025-04-22T11:00:00"),
    makeChange("ch3-5", doc3Id, "v3-4", userAissatou, "formatage", "Numérotation des articles et mise en page finale", "2025-05-05T09:00:00"),
    makeChange("ch3-6", doc3Id, "v3-4", userAissatou, "modification", "Mention des associés et parts sociales", "2025-05-05T10:00:00"),
    makeChange("ch3-7", doc3Id, "v3-4", userMamadou, "commentaire", "Validation de la conformité légale", "2025-05-06T09:00:00"),
  ],
  comments: [
    makeComment("cm3-1", doc3Id, "L'objet social doit inclure les activités d'import selon le RCCM.", userMamadou, "2025-04-16T14:00:00", "objet social"),
    makeComment("cm3-2", doc3Id, "Le capital social minimum est de 1 000 000 GNF pour une SARL.", userAissatou, "2025-04-17T09:00:00", "capital social minimum"),
    makeComment("cm3-3", doc3Id, "Ajouter la clause de cession de parts à des tiers.", userBoubacar, "2025-04-20T15:00:00"),
    makeComment("cm3-4", doc3Id, "Conforme aux dispositions de l'OHADA.", userMamadou, "2025-05-06T09:00:00", "dispositions de l'OHADA", true),
    makeComment("cm3-5", doc3Id, "Prévoir une clause d'agrément pour les cessions entre associés.", userFatoumata, "2025-04-25T11:00:00"),
  ],
  createdAt: d("2025-04-08"),
  createdBy: userAissatou,
  updatedAt: d("2025-05-06"),
  updatedBy: userMamadou,
  tags: ["statuts", "sarl", "société", "nimba"],
  isLocked: false,
  metadata: { wordCount: 2100, pageCount: 7, readingTimeMinutes: 8 },
};

// ─── Document 4 — N-2025-104 Contrat de vente ─────────────────

const doc4Id = "doc-104";
const doc4V1 = makeVersion("v4-1", doc4Id, 1, "1.0", userMamadou, "2025-08-12", true, "Première version du contrat de vente");
const doc4V2 = makeVersion("v4-2", doc4Id, 2, "1.1", userFatoumata, "2025-08-20", false, "Ajout des conditions de paiement", "v4-1");

const doc4: NotarioDocument = {
  id: doc4Id,
  dossierId: "4",
  dossierRef: "N-2025-104",
  title: "Contrat de vente immobilière — Famille Diallo",
  type: "contrat",
  status: "brouillon",
  currentVersion: doc4V2,
  versions: [doc4V1, doc4V2],
  collaborators: [
    makeCollaborator("c4-1", "u1", userMamadou, doc4Id, "proprietaire", userMamadou, true, "#3b82f6"),
    makeCollaborator("c4-2", "u4", userFatoumata, doc4Id, "editeur", userMamadou, true, "#ec4899"),
    makeCollaborator("c4-3", "u2", userAissatou, doc4Id, "commentateur", userMamadou, false, "#10b981"),
  ],
  changes: [
    makeChange("ch4-1", doc4Id, "v4-1", userMamadou, "insertion", "Structure initiale du contrat", "2025-08-12T09:00:00"),
    makeChange("ch4-2", doc4Id, "v4-1", userMamadou, "modification", "Désignation précise du bien immobilier", "2025-08-14T11:00:00"),
    makeChange("ch4-3", doc4Id, "v4-2", userFatoumata, "insertion", "Ajout du calendrier de paiement", "2025-08-20T10:00:00"),
    makeChange("ch4-4", doc4Id, "v4-2", userFatoumata, "modification", "Correction du montant total", "2025-08-21T14:00:00"),
  ],
  comments: [
    makeComment("cm4-1", doc4Id, "Vérifier la conformité du titre foncier avec le cadastre.", userAissatou, "2025-08-22T09:00:00", "titre foncier"),
    makeComment("cm4-2", doc4Id, "Le délai de réflexion de 10 jours doit être mentionné.", userMamadou, "2025-08-23T11:00:00", "délai de réflexion"),
    makeComment("cm4-3", doc4Id, "Ajouter les coordonnées GPS du terrain.", userFatoumata, "2025-08-24T15:00:00"),
    makeComment("cm4-4", doc4Id, "Prévoir une clause pénale en cas de retard de paiement.", userAissatou, "2025-08-25T10:00:00", "clause pénale"),
  ],
  createdAt: d("2025-08-12"),
  createdBy: userMamadou,
  updatedAt: d("2025-08-21"),
  updatedBy: userFatoumata,
  tags: ["vente", "immobilier", "famille-diallo", "urgente"],
  isLocked: false,
  metadata: { wordCount: 890, pageCount: 3, readingTimeMinutes: 4 },
};

// ─── Document 5 — N-2025-105 Acte de donation ─────────────────

const doc5Id = "doc-105";
const doc5V1 = makeVersion("v5-1", doc5Id, 1, "1.0", userAissatou, "2025-06-03", true, "Rédaction de l'acte de donation");
const doc5V2 = makeVersion("v5-2", doc5Id, 2, "1.1", userBoubacar, "2025-06-10", false, "Précision des biens donnés", "v5-1");
const doc5V3 = makeVersion("v5-3", doc5Id, 3, "2.0", userAissatou, "2025-06-25", true, "Version signée et enregistrée", "v5-2");

const doc5: NotarioDocument = {
  id: doc5Id,
  dossierId: "5",
  dossierRef: "N-2025-105",
  title: "Acte de donation — Camara Aïssatou",
  type: "acte",
  status: "valide",
  currentVersion: doc5V3,
  versions: [doc5V1, doc5V2, doc5V3],
  collaborators: [
    makeCollaborator("c5-1", "u2", userAissatou, doc5Id, "proprietaire", userAissatou, false, "#10b981"),
    makeCollaborator("c5-2", "u3", userBoubacar, doc5Id, "editeur", userAissatou, true, "#8b5cf6"),
    makeCollaborator("c5-3", "u1", userMamadou, doc5Id, "lecteur", userAissatou, false, "#3b82f6"),
  ],
  changes: [
    makeChange("ch5-1", doc5Id, "v5-1", userAissatou, "insertion", "Rédaction des clauses de donation", "2025-06-03T09:00:00"),
    makeChange("ch5-2", doc5Id, "v5-2", userBoubacar, "modification", "Description détaillée des biens donnés", "2025-06-10T10:00:00"),
    makeChange("ch5-3", doc5Id, "v5-2", userBoubacar, "insertion", "Ajout des conditions de la donation", "2025-06-12T14:00:00"),
    makeChange("ch5-4", doc5Id, "v5-3", userAissatou, "modification", "Intégration des signatures et références", "2025-06-25T09:00:00"),
    makeChange("ch5-5", doc5Id, "v5-3", userAissatou, "formatage", "Mise en forme officielle", "2025-06-25T10:00:00"),
  ],
  comments: [
    makeComment("cm5-1", doc5Id, "Préciser si la donation est avec ou sans charges.", userMamadou, "2025-06-08T11:00:00", "donation avec ou sans charges"),
    makeComment("cm5-2", doc5Id, "Valeur vénale des biens à évaluer par expert.", userAissatou, "2025-06-09T09:00:00", "valeur vénale"),
    makeComment("cm5-3", doc5Id, "Droits de donation à liquider avant signature.", userBoubacar, "2025-06-15T14:00:00", "droits de donation", true),
    makeComment("cm5-4", doc5Id, "Acte conforme aux dispositions du Code civil applicable.", userAissatou, "2025-06-25T11:00:00", undefined, true),
  ],
  createdAt: d("2025-06-03"),
  createdBy: userAissatou,
  updatedAt: d("2025-06-25"),
  updatedBy: userAissatou,
  tags: ["donation", "acte", "camara"],
  isLocked: false,
  metadata: { wordCount: 1050, pageCount: 3, readingTimeMinutes: 4 },
};

// ─── Document 6 — N-2025-106 Note interne ─────────────────────

const doc6Id = "doc-106";
const doc6V1 = makeVersion("v6-1", doc6Id, 1, "1.0", userFatoumata, "2025-07-20", false, "Note de suivi KankanCorp");
const doc6V2 = makeVersion("v6-2", doc6Id, 2, "1.1", userFatoumata, "2025-07-28", false, "Mise à jour après réunion", "v6-1");

const doc6: NotarioDocument = {
  id: doc6Id,
  dossierId: "6",
  dossierRef: "N-2025-106",
  title: "Note de suivi — Société KankanCorp",
  type: "note",
  status: "brouillon",
  currentVersion: doc6V2,
  versions: [doc6V1, doc6V2],
  collaborators: [
    makeCollaborator("c6-1", "u4", userFatoumata, doc6Id, "proprietaire", userFatoumata, true, "#ec4899"),
    makeCollaborator("c6-2", "u2", userAissatou, doc6Id, "editeur", userFatoumata, false, "#10b981"),
  ],
  changes: [
    makeChange("ch6-1", doc6Id, "v6-1", userFatoumata, "insertion", "Création de la note de suivi", "2025-07-20T09:00:00"),
    makeChange("ch6-2", doc6Id, "v6-1", userAissatou, "modification", "Ajout des observations juridiques", "2025-07-22T11:00:00"),
    makeChange("ch6-3", doc6Id, "v6-2", userFatoumata, "modification", "Mise à jour post-réunion du 28 juillet", "2025-07-28T15:00:00"),
    makeChange("ch6-4", doc6Id, "v6-2", userFatoumata, "insertion", "Liste des pièces manquantes", "2025-07-29T10:00:00"),
    makeChange("ch6-5", doc6Id, "v6-2", userAissatou, "commentaire", "Recommandation de délai supplémentaire", "2025-07-30T09:00:00"),
  ],
  comments: [
    makeComment("cm6-1", doc6Id, "KankanCorp doit fournir le registre de commerce avant le 15 août.", userAissatou, "2025-07-30T09:00:00", "registre de commerce"),
    makeComment("cm6-2", doc6Id, "Vérifier la conformité des statuts existants.", userFatoumata, "2025-07-31T11:00:00", "conformité des statuts"),
    makeComment("cm6-3", doc6Id, "Prévoir une réunion de validation en août.", userFatoumata, "2025-08-01T14:00:00"),
  ],
  createdAt: d("2025-07-20"),
  createdBy: userFatoumata,
  updatedAt: d("2025-07-29"),
  updatedBy: userFatoumata,
  tags: ["note", "suivi", "kankancorp"],
  isLocked: false,
  metadata: { wordCount: 420, pageCount: 1, readingTimeMinutes: 2 },
};

// ─── Document 7 — N-2025-107 Courrier ─────────────────────────

const doc7Id = "doc-107";
const doc7V1 = makeVersion("v7-1", doc7Id, 1, "1.0", userBoubacar, "2025-09-05", true, "Rédaction du courrier de mise en demeure");
const doc7V2 = makeVersion("v7-2", doc7Id, 2, "1.1", userMamadou, "2025-09-08", false, "Corrections suite relecture notaire", "v7-1");
const doc7V3 = makeVersion("v7-3", doc7Id, 3, "2.0", userMamadou, "2025-09-10", true, "Courrier finalisé et signé", "v7-2");

const doc7: NotarioDocument = {
  id: doc7Id,
  dossierId: "7",
  dossierRef: "N-2025-107",
  title: "Courrier de mise en demeure — Bah Ibrahim",
  type: "courrier",
  status: "archive",
  currentVersion: doc7V3,
  versions: [doc7V1, doc7V2, doc7V3],
  collaborators: [
    makeCollaborator("c7-1", "u1", userMamadou, doc7Id, "proprietaire", userMamadou, false, "#3b82f6"),
    makeCollaborator("c7-2", "u3", userBoubacar, doc7Id, "editeur", userMamadou, false, "#8b5cf6"),
    makeCollaborator("c7-3", "u4", userFatoumata, doc7Id, "lecteur", userMamadou, false, "#ec4899"),
  ],
  changes: [
    makeChange("ch7-1", doc7Id, "v7-1", userBoubacar, "insertion", "Rédaction initiale de la mise en demeure", "2025-09-05T09:00:00"),
    makeChange("ch7-2", doc7Id, "v7-1", userBoubacar, "modification", "Précision du montant de la créance", "2025-09-06T11:00:00"),
    makeChange("ch7-3", doc7Id, "v7-2", userMamadou, "modification", "Reformulation des délais légaux", "2025-09-08T10:00:00"),
    makeChange("ch7-4", doc7Id, "v7-2", userMamadou, "formatage", "En-tête officielle du cabinet", "2025-09-08T11:00:00"),
    makeChange("ch7-5", doc7Id, "v7-3", userMamadou, "modification", "Signature et date d'expédition", "2025-09-10T09:00:00"),
    makeChange("ch7-6", doc7Id, "v7-3", userFatoumata, "commentaire", "Archivage du courrier envoyé", "2025-09-11T14:00:00"),
  ],
  comments: [
    makeComment("cm7-1", doc7Id, "Délai de réponse : 8 jours à compter de la réception.", userMamadou, "2025-09-08T10:00:00", "délai de réponse"),
    makeComment("cm7-2", doc7Id, "Envoyer en recommandé avec accusé de réception.", userBoubacar, "2025-09-09T09:00:00", "recommandé avec accusé"),
    makeComment("cm7-3", doc7Id, "Courrier expédié le 10/09/2025.", userFatoumata, "2025-09-10T16:00:00", undefined, true),
    makeComment("cm7-4", doc7Id, "Conserver copie pour le dossier.", userMamadou, "2025-09-11T09:00:00", undefined, true),
    makeComment("cm7-5", doc7Id, "Accusé de réception reçu le 12/09.", userFatoumata, "2025-09-12T10:00:00", undefined, true),
  ],
  createdAt: d("2025-09-05"),
  createdBy: userBoubacar,
  updatedAt: d("2025-09-11"),
  updatedBy: userFatoumata,
  tags: ["courrier", "mise-en-demeure", "archivé"],
  isLocked: true,
  lockedBy: userMamadou,
  lockedAt: d("2025-09-10"),
  metadata: { wordCount: 380, pageCount: 1, readingTimeMinutes: 2 },
};

// ─── Document 8 — N-2025-108 Procuration ──────────────────────

const doc8Id = "doc-108";
const doc8V1 = makeVersion("v8-1", doc8Id, 1, "1.0", userAissatou, "2025-10-01", true, "Rédaction de la procuration générale");
const doc8V2 = makeVersion("v8-2", doc8Id, 2, "1.1", userAissatou, "2025-10-08", false, "Limitation des pouvoirs au patrimoine immobilier", "v8-1");

const doc8: NotarioDocument = {
  id: doc8Id,
  dossierId: "8",
  dossierRef: "N-2025-108",
  title: "Procuration générale — Soumah Fatoumata",
  type: "acte",
  status: "en_revision",
  currentVersion: doc8V2,
  versions: [doc8V1, doc8V2],
  collaborators: [
    makeCollaborator("c8-1", "u2", userAissatou, doc8Id, "proprietaire", userAissatou, true, "#10b981"),
    makeCollaborator("c8-2", "u1", userMamadou, doc8Id, "editeur", userAissatou, true, "#3b82f6"),
    makeCollaborator("c8-3", "u3", userBoubacar, doc8Id, "commentateur", userAissatou, false, "#8b5cf6"),
    makeCollaborator("c8-4", "u4", userFatoumata, doc8Id, "lecteur", userAissatou, false, "#ec4899"),
  ],
  changes: [
    makeChange("ch8-1", doc8Id, "v8-1", userAissatou, "insertion", "Rédaction des clauses de la procuration", "2025-10-01T09:00:00"),
    makeChange("ch8-2", doc8Id, "v8-1", userMamadou, "modification", "Précision de l'identité du mandataire", "2025-10-02T11:00:00"),
    makeChange("ch8-3", doc8Id, "v8-2", userAissatou, "modification", "Limitation aux actes immobiliers uniquement", "2025-10-08T10:00:00"),
    makeChange("ch8-4", doc8Id, "v8-2", userMamadou, "commentaire", "Vérification de la capacité juridique", "2025-10-09T14:00:00"),
    makeChange("ch8-5", doc8Id, "v8-2", userBoubacar, "formatage", "Mise en page selon modèle officiel", "2025-10-10T09:00:00"),
    makeChange("ch8-6", doc8Id, "v8-2", userAissatou, "modification", "Ajout de la durée de validité", "2025-10-12T11:00:00"),
    makeChange("ch8-7", doc8Id, "v8-2", userMamadou, "insertion", "Clause révocatoire", "2025-10-14T15:00:00"),
    makeChange("ch8-8", doc8Id, "v8-2", userFatoumata, "commentaire", "Document en attente de validation finale", "2025-10-15T09:00:00"),
  ],
  comments: [
    makeComment("cm8-1", doc8Id, "Vérifier l'identité complète du mandant avant signature.", userMamadou, "2025-10-02T11:00:00", "identité du mandant"),
    makeComment("cm8-2", doc8Id, "La procuration doit être limitée dans le temps (1 an max).", userAissatou, "2025-10-08T10:00:00", "limitée dans le temps"),
    makeComment("cm8-3", doc8Id, "Faire légaliser la signature auprès du consul si mandant à l'étranger.", userBoubacar, "2025-10-11T14:00:00", "légaliser la signature"),
    makeComment("cm8-4", doc8Id, "Inclure une liste exhaustive des actes autorisés.", userMamadou, "2025-10-13T09:00:00", "liste exhaustive"),
    makeComment("cm8-5", doc8Id, "En attente du retour du client sur les pouvoirs étendus.", userAissatou, "2025-10-15T11:00:00"),
    makeComment("cm8-6", doc8Id, "Transmettre une copie au mandataire après signature.", userFatoumata, "2025-10-15T14:00:00"),
  ],
  createdAt: d("2025-10-01"),
  createdBy: userAissatou,
  updatedAt: d("2025-10-15"),
  updatedBy: userMamadou,
  tags: ["procuration", "mandant", "immobilier"],
  isLocked: false,
  metadata: { wordCount: 760, pageCount: 2, readingTimeMinutes: 3 },
};

// ─── Export ───────────────────────────────────────────────────

export const mockDocuments: NotarioDocument[] = [
  doc1, doc2, doc3, doc4, doc5, doc6, doc7, doc8,
];
