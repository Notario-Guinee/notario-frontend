// ═══════════════════════════════════════════════════════════════
// Hook custom useDocument — gestion locale des documents notariaux
// Versions, collaborateurs, audit, auto-save et présence
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  NotarioDocument,
  DocumentVersion,
  DocumentCollaborator,
  DocumentChange,
  DocumentRole,
  ChangeType,
} from '@/types/documents';
import { mockDocuments } from '@/data/documentsData';

// ─── Charge un document depuis les données mock ───────────────

export function useDocument(documentId: string) {
  const [document, setDocument] = useState<NotarioDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    // Simulation délai réseau
    const t = setTimeout(() => {
      const doc = mockDocuments.find(d => d.id === documentId) ?? null;
      if (doc) {
        setDocument(doc);
      } else {
        setError('Document introuvable');
      }
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [documentId]);

  return { document, setDocument, isLoading, error };
}

// ─── Gestion des versions ─────────────────────────────────────

export function useDocumentVersions(documentId: string) {
  const { document, setDocument } = useDocument(documentId);
  const versions = document?.versions ?? [];

  const createVersion = useCallback(
    (label: string, notes: string, isMajor: boolean) => {
      if (!document) return;
      const lastVersion = document.versions[document.versions.length - 1];
      const newVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;
      const newVersion: DocumentVersion = {
        id: `v-${documentId}-${Date.now()}`,
        documentId,
        versionNumber: newVersionNumber,
        versionLabel: label,
        content: document.currentVersion.content,
        contentSnapshot: notes,
        createdAt: new Date(),
        createdBy: document.updatedBy,
        changesSummary: notes,
        isDraft: !isMajor,
        isMajorVersion: isMajor,
        parentVersionId: lastVersion?.id,
        wordCount: document.metadata.wordCount,
        sizeBytes: 12800 + newVersionNumber * 1024,
      };
      setDocument({
        ...document,
        versions: [newVersion, ...document.versions],
        currentVersion: newVersion,
        updatedAt: new Date(),
      });
    },
    [document, setDocument, documentId]
  );

  const restoreVersion = useCallback(
    (versionId: string) => {
      if (!document) return;
      const version = document.versions.find(v => v.id === versionId);
      if (!version) return;
      setDocument({
        ...document,
        currentVersion: version,
        updatedAt: new Date(),
      });
    },
    [document, setDocument]
  );

  return { versions, createVersion, restoreVersion };
}

// ─── Gestion des collaborateurs ───────────────────────────────

export function useDocumentCollaborators(documentId: string) {
  const { document, setDocument } = useDocument(documentId);
  const collaborators = document?.collaborators ?? [];

  const invite = useCallback(
    (userId: string, role: DocumentRole) => {
      if (!document) return;
      // Vérifie si le collaborateur existe déjà
      if (document.collaborators.some(c => c.userId === userId)) return;
      const newCollaborator: DocumentCollaborator = {
        id: `collab-${documentId}-${Date.now()}`,
        userId,
        user: {
          id: userId,
          nom: '',
          prenom: '',
          initiales: userId.substring(0, 2).toUpperCase(),
          role: role,
        },
        documentId,
        role,
        invitedAt: new Date(),
        invitedBy: document.updatedBy,
        isOnline: false,
        cursorColor: '#6366f1',
        canInviteOthers: role === 'proprietaire' || role === 'editeur',
      };
      setDocument({
        ...document,
        collaborators: [...document.collaborators, newCollaborator],
      });
    },
    [document, setDocument, documentId]
  );

  const revoke = useCallback(
    (collaboratorId: string) => {
      if (!document) return;
      setDocument({
        ...document,
        collaborators: document.collaborators.filter(c => c.id !== collaboratorId),
      });
    },
    [document, setDocument]
  );

  const updateRole = useCallback(
    (collaboratorId: string, role: DocumentRole) => {
      if (!document) return;
      setDocument({
        ...document,
        collaborators: document.collaborators.map(c =>
          c.id === collaboratorId
            ? { ...c, role, canInviteOthers: role === 'proprietaire' || role === 'editeur' }
            : c
        ),
      });
    },
    [document, setDocument]
  );

  return { collaborators, invite, revoke, updateRole };
}

// ─── Journal d'audit ──────────────────────────────────────────

export function useDocumentAudit(documentId: string) {
  const { document } = useDocument(documentId);
  const changes = document?.changes ?? [];

  const filterChanges = useCallback(
    (opts: { userId?: string; type?: ChangeType; since?: Date }) => {
      return changes.filter(c => {
        if (opts.userId && c.userId !== opts.userId) return false;
        if (opts.type && c.changeType !== opts.type) return false;
        if (opts.since && c.timestamp < opts.since) return false;
        return true;
      });
    },
    [changes]
  );

  return { changes, filterChanges };
}

// ─── Auto-save avec debounce ──────────────────────────────────

export function useAutoSave(documentId: string, getContent: () => string) {
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveNow = useCallback(() => {
    setIsSaving(true);
    // Simulation sauvegarde (accès au contenu via getContent si nécessaire)
    void getContent;
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
      setIsDirty(false);
    }, 600);
  }, [getContent]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveNow();
    }, 2000);
  }, [saveNow]);

  // Auto-save toutes les 30s si dirty
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) saveNow();
    }, 30000);
    return () => clearInterval(interval);
  }, [isDirty, saveNow]);

  // Nettoyage du debounce au démontage
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { lastSaved, isSaving, isDirty, markDirty, saveNow };
}

// ─── Présence collaborateurs simulée ─────────────────────────

export function useCollaboratorPresence(documentId: string) {
  const { document } = useDocument(documentId);
  const onlineCollaborators = document?.collaborators.filter(c => c.isOnline) ?? [];
  // Curseurs simulés avec positions aléatoires (stables par collaborateur)
  const cursors = onlineCollaborators.map(c => ({
    collaboratorId: c.id,
    color: c.cursorColor,
    name: `${c.user.prenom} ${c.user.nom}`,
    position: Math.floor(Math.random() * 500) + 50,
  }));
  return { onlineCollaborators, cursors };
}
