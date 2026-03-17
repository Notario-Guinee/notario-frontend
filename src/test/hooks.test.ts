// ═══════════════════════════════════════════════════════════════
// Tests unitaires pour useFilteredData et useCrudState
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFilteredData } from "@/hooks/useFilteredData";
import { useCrudState } from "@/hooks/useCrudState";

// ─── Données de test ────────────────────────────────────────────

interface Person {
  id: string;
  nom: string;
  email: string;
  statut: string;
}

const people: Person[] = [
  { id: "1", nom: "Dupont", email: "dupont@example.com", statut: "Actif" },
  { id: "2", nom: "Martin", email: "martin@example.com", statut: "Inactif" },
  { id: "3", nom: "Bernard", email: "bernard@example.com", statut: "Actif" },
  { id: "4", nom: "DURAND", email: "durand@example.com", statut: "Inactif" },
];

// ─── useFilteredData ────────────────────────────────────────────

describe("useFilteredData", () => {
  const searchFields = (p: Person) => [p.nom, p.email];

  it("retourne tous les items sans filtre ni recherche", () => {
    const { result } = renderHook(() =>
      useFilteredData(people, { searchFields })
    );
    expect(result.current.filtered).toHaveLength(4);
    expect(result.current.count).toBe(4);
  });

  it("filtre une liste d'objets par champ de recherche", () => {
    const { result } = renderHook(() =>
      useFilteredData(people, { searchFields })
    );
    act(() => {
      result.current.setSearch("dupont");
    });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].nom).toBe("Dupont");
  });

  it("la recherche est insensible à la casse", () => {
    const { result } = renderHook(() =>
      useFilteredData(people, { searchFields })
    );
    act(() => {
      result.current.setSearch("DUP");
    });
    // "Dupont" et "DURAND" contiennent "dup"/"dur" — seulement "Dupont" contient "dup"
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].nom).toBe("Dupont");
  });

  it("la recherche sur 'du' retourne Dupont et DURAND", () => {
    const { result } = renderHook(() =>
      useFilteredData(people, { searchFields })
    );
    act(() => {
      result.current.setSearch("du");
    });
    expect(result.current.filtered).toHaveLength(2);
    const noms = result.current.filtered.map((p) => p.nom);
    expect(noms).toContain("Dupont");
    expect(noms).toContain("DURAND");
  });

  it("le filtre additionnel fonctionne", () => {
    const filterFn = (p: Person, val: string) => p.statut === val;
    const { result } = renderHook(() =>
      useFilteredData(people, { searchFields, filterFn })
    );
    act(() => {
      result.current.setFilter("Actif");
    });
    expect(result.current.filtered).toHaveLength(2);
    expect(result.current.filtered.every((p) => p.statut === "Actif")).toBe(true);
  });

  it("count correspond à filtered.length", () => {
    const { result } = renderHook(() =>
      useFilteredData(people, { searchFields })
    );
    act(() => {
      result.current.setSearch("martin");
    });
    expect(result.current.count).toBe(result.current.filtered.length);
    expect(result.current.count).toBe(1);
  });

  it("setSearch change les résultats", () => {
    const { result } = renderHook(() =>
      useFilteredData(people, { searchFields })
    );
    act(() => {
      result.current.setSearch("bernard");
    });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].nom).toBe("Bernard");

    act(() => {
      result.current.setSearch("");
    });
    expect(result.current.filtered).toHaveLength(4);
  });

  it("setFilter change les résultats", () => {
    const filterFn = (p: Person, val: string) => p.statut === val;
    const { result } = renderHook(() =>
      useFilteredData(people, { searchFields, filterFn })
    );
    act(() => {
      result.current.setFilter("Inactif");
    });
    expect(result.current.filtered).toHaveLength(2);
    expect(result.current.filtered.every((p) => p.statut === "Inactif")).toBe(true);

    act(() => {
      result.current.setFilter("all");
    });
    expect(result.current.filtered).toHaveLength(4);
  });

  it("une searchFn personnalisée est utilisée si fournie", () => {
    // Recherche exacte (commence par)
    const searchFn = (text: string, query: string) =>
      text.toLowerCase().startsWith(query.toLowerCase());
    const { result } = renderHook(() =>
      useFilteredData(people, { searchFields, searchFn })
    );
    act(() => {
      result.current.setSearch("dup");
    });
    // "Dupont" commence par "dup", "DURAND" commence par "dur" → pas "dup"
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].nom).toBe("Dupont");
  });

  it("combine search et filterFn en même temps", () => {
    const filterFn = (p: Person, val: string) => p.statut === val;
    const { result } = renderHook(() =>
      useFilteredData(people, { searchFields, filterFn })
    );
    act(() => {
      result.current.setFilter("Actif");
      result.current.setSearch("bernard");
    });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].nom).toBe("Bernard");
  });
});

// ─── useCrudState ────────────────────────────────────────────────

interface Item {
  id: string;
  name: string;
}

interface ItemForm {
  name: string;
  description: string;
}

const initialForm: ItemForm = { name: "", description: "" };

describe("useCrudState", () => {
  const buildHook = () => {
    const onCreate = vi.fn();
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    const hook = renderHook(() =>
      useCrudState<Item, ItemForm>({
        initialForm,
        onCreate,
        onUpdate,
        onDelete,
      })
    );
    return { ...hook, onCreate, onUpdate, onDelete };
  };

  it("showCreate vaut false par défaut", () => {
    const { result } = buildHook();
    expect(result.current.showCreate).toBe(false);
  });

  it("openCreate passe showCreate à true", () => {
    const { result } = buildHook();
    act(() => {
      result.current.openCreate();
    });
    expect(result.current.showCreate).toBe(true);
  });

  it("closeCreate passe showCreate à false", () => {
    const { result } = buildHook();
    act(() => {
      result.current.openCreate();
    });
    expect(result.current.showCreate).toBe(true);
    act(() => {
      result.current.closeCreate();
    });
    expect(result.current.showCreate).toBe(false);
  });

  it("resetForm remet le formulaire à initialForm", () => {
    const { result } = buildHook();
    act(() => {
      result.current.setForm({ name: "Test", description: "Desc" });
    });
    expect(result.current.form.name).toBe("Test");
    act(() => {
      result.current.resetForm();
    });
    expect(result.current.form).toEqual(initialForm);
  });

  it("updateForm merge correctement les champs", () => {
    const { result } = buildHook();
    act(() => {
      result.current.setForm({ name: "Alpha", description: "Beta" });
    });
    act(() => {
      result.current.updateForm({ description: "Gamma" });
    });
    expect(result.current.form.name).toBe("Alpha");
    expect(result.current.form.description).toBe("Gamma");
  });

  it("updateForm ne modifie que les champs fournis", () => {
    const { result } = buildHook();
    act(() => {
      result.current.updateForm({ name: "Nouveau" });
    });
    expect(result.current.form.name).toBe("Nouveau");
    expect(result.current.form.description).toBe(""); // inchangé
  });

  it("handleCreate appelle onCreate avec le form courant", () => {
    const { result, onCreate } = buildHook();
    act(() => {
      result.current.setForm({ name: "Facture A", description: "Desc A" });
    });
    act(() => {
      result.current.handleCreate();
    });
    expect(onCreate).toHaveBeenCalledOnce();
    expect(onCreate).toHaveBeenCalledWith({ name: "Facture A", description: "Desc A" });
  });

  it("handleDelete appelle onDelete avec l'id du deleting", () => {
    const { result, onDelete } = buildHook();
    const item: Item = { id: "42", name: "A supprimer" };
    act(() => {
      result.current.setDeleting(item);
    });
    act(() => {
      result.current.handleDelete();
    });
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith("42");
  });

  it("handleDelete ne fait rien si deleting est null", () => {
    const { result, onDelete } = buildHook();
    act(() => {
      result.current.handleDelete();
    });
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("handleUpdate appelle onUpdate avec l'item editing", () => {
    const { result, onUpdate } = buildHook();
    const item: Item = { id: "7", name: "A modifier" };
    act(() => {
      result.current.setEditing(item);
    });
    act(() => {
      result.current.handleUpdate();
    });
    expect(onUpdate).toHaveBeenCalledOnce();
    expect(onUpdate).toHaveBeenCalledWith(item);
  });

  it("handleUpdate ne fait rien si editing est null", () => {
    const { result, onUpdate } = buildHook();
    act(() => {
      result.current.handleUpdate();
    });
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("isSubmitting est false par défaut et peut être modifié", () => {
    const { result } = buildHook();
    expect(result.current.isSubmitting).toBe(false);
    act(() => {
      result.current.setIsSubmitting(true);
    });
    expect(result.current.isSubmitting).toBe(true);
  });

  it("editing et deleting sont null par défaut", () => {
    const { result } = buildHook();
    expect(result.current.editing).toBeNull();
    expect(result.current.deleting).toBeNull();
  });

  it("setEditing et setDeleting fonctionnent correctement", () => {
    const { result } = buildHook();
    const item: Item = { id: "10", name: "Item" };
    act(() => {
      result.current.setEditing(item);
      result.current.setDeleting(item);
    });
    expect(result.current.editing).toEqual(item);
    expect(result.current.deleting).toEqual(item);
    act(() => {
      result.current.setEditing(null);
      result.current.setDeleting(null);
    });
    expect(result.current.editing).toBeNull();
    expect(result.current.deleting).toBeNull();
  });
});
