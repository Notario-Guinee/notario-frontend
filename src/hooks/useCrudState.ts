// ═══════════════════════════════════════════════════════════════
// useCrudState — Hook générique pour le pattern modal/form/CRUD
// Centralise les états répétés dans les pages de gestion
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

export interface UseCrudStateOptions<T extends { id: string }, F> {
  initialForm: F;
  onCreate: (form: F) => void;
  onUpdate: (item: T) => void;
  onDelete: (id: string) => void;
}

export interface UseCrudStateResult<T extends { id: string }, F> {
  // Modaux
  showCreate: boolean;
  openCreate: () => void;
  closeCreate: () => void;
  // Form
  form: F;
  setForm: Dispatch<SetStateAction<F>>;
  updateForm: (patch: Partial<F>) => void;
  resetForm: () => void;
  // Item en cours d'édition/suppression
  editing: T | null;
  setEditing: (item: T | null) => void;
  deleting: T | null;
  setDeleting: (item: T | null) => void;
  // Handlers
  handleCreate: () => void;
  handleUpdate: () => void;
  handleDelete: () => void;
  // Loading
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
}

export function useCrudState<T extends { id: string }, F = Partial<T>>(
  options: UseCrudStateOptions<T, F>
): UseCrudStateResult<T, F> {
  const { initialForm, onCreate, onUpdate, onDelete } = options;

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<F>(initialForm);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreate = useCallback(() => setShowCreate(true), []);
  const closeCreate = useCallback(() => setShowCreate(false), []);

  const resetForm = useCallback(() => {
    setForm(initialForm);
  }, [initialForm]);

  const updateForm = useCallback((patch: Partial<F>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleCreate = useCallback(() => {
    onCreate(form);
  }, [onCreate, form]);

  const handleUpdate = useCallback(() => {
    if (editing) {
      onUpdate(editing);
    }
  }, [onUpdate, editing]);

  const handleDelete = useCallback(() => {
    if (deleting) {
      onDelete(deleting.id);
    }
  }, [onDelete, deleting]);

  return {
    // Modaux
    showCreate,
    openCreate,
    closeCreate,
    // Form
    form,
    setForm,
    updateForm,
    resetForm,
    // Items
    editing,
    setEditing,
    deleting,
    setDeleting,
    // Handlers
    handleCreate,
    handleUpdate,
    handleDelete,
    // Loading
    isSubmitting,
    setIsSubmitting,
  };
}
