// ═══════════════════════════════════════════════════════════════
// Types TypeScript — Module Documents
// Définit les types pour la gestion collaborative des documents
// notariaux : versions, collaborateurs, commentaires, activité
// ═══════════════════════════════════════════════════════════════

export type DocumentStatus = 'brouillon' | 'en_revision' | 'valide' | 'archive';
export type DocumentRole = 'lecteur' | 'commentateur' | 'editeur' | 'proprietaire';
export type ChangeType = 'insertion' | 'suppression' | 'modification' | 'formatage' | 'commentaire';
export type DocumentType = 'contrat' | 'acte' | 'courrier' | 'attestation' | 'note' | 'autre';

export interface UserRef {
  id: string;
  nom: string;
  prenom: string;
  initiales: string;
  avatarUrl?: string;
  role: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  versionLabel: string;
  content: string;
  contentSnapshot: string;
  createdAt: Date;
  createdBy: UserRef;
  changesSummary: string;
  isDraft: boolean;
  isMajorVersion: boolean;
  parentVersionId?: string;
  wordCount: number;
  sizeBytes: number;
}

export interface DocumentCollaborator {
  id: string;
  userId: string;
  user: UserRef;
  documentId: string;
  role: DocumentRole;
  invitedAt: Date;
  invitedBy: UserRef;
  acceptedAt?: Date;
  lastViewedAt?: Date;
  lastEditAt?: Date;
  isOnline: boolean;
  cursorColor: string;
  canInviteOthers: boolean;
}

export interface DocumentChange {
  id: string;
  documentId: string;
  versionId: string;
  userId: string;
  user: UserRef;
  changeType: ChangeType;
  description: string;
  diff: string;
  timestamp: Date;
  selectionRange?: { from: number; to: number };
  resolvedAt?: Date;
  resolvedBy?: UserRef;
}

export interface DocumentComment {
  id: string;
  documentId: string;
  content: string;
  author: UserRef;
  createdAt: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
  resolvedBy?: UserRef;
  selectionRange?: { from: number; to: number };
  highlightedText?: string;
  replies: DocumentComment[];
  isResolved: boolean;
  position?: { top: number };
}

export interface NotarioDocument {
  id: string;
  dossierId: string;
  dossierRef: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  currentVersion: DocumentVersion;
  versions: DocumentVersion[];
  collaborators: DocumentCollaborator[];
  changes: DocumentChange[];
  comments: DocumentComment[];
  createdAt: Date;
  createdBy: UserRef;
  updatedAt: Date;
  updatedBy: UserRef;
  tags: string[];
  isLocked: boolean;
  lockedBy?: UserRef;
  lockedAt?: Date;
  templateId?: string;
  metadata: {
    wordCount: number;
    pageCount: number;
    readingTimeMinutes: number;
  };
}
