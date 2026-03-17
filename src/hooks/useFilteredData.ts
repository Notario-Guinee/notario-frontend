// ═══════════════════════════════════════════════════════════════
// useFilteredData — Hook générique pour la recherche et le filtrage
// Centralise la logique search + filter présente dans les pages
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";

export interface UseFilteredDataOptions<T> {
  /** Retourne les champs textuels à inclure dans la recherche */
  searchFields: (item: T) => string[];
  /** Filtre additionnel optionnel (ex. filtre par statut) */
  filterFn?: (item: T, filterValue: string) => boolean;
  /** Fonction de recherche custom — par défaut : includes insensible à la casse */
  searchFn?: (text: string, query: string) => boolean;
}

export interface UseFilteredDataResult<T> {
  filtered: T[];
  search: string;
  setSearch: (v: string) => void;
  filter: string;
  setFilter: (v: string) => void;
  count: number;
}

const defaultSearchFn = (text: string, query: string): boolean =>
  text.toLowerCase().includes(query.toLowerCase());

export function useFilteredData<T>(
  data: T[],
  options: UseFilteredDataOptions<T>
): UseFilteredDataResult<T> {
  const { searchFields, filterFn, searchFn = defaultSearchFn } = options;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    return data.filter((item) => {
      // Filtre additionnel
      if (filterFn && filter !== "all") {
        if (!filterFn(item, filter)) return false;
      }

      // Filtre de recherche textuelle
      if (search.trim()) {
        const fields = searchFields(item);
        return fields.some((field) => searchFn(field, search));
      }

      return true;
    });
  }, [data, search, filter, searchFields, filterFn, searchFn]);

  return {
    filtered,
    search,
    setSearch,
    filter,
    setFilter,
    count: filtered.length,
  };
}
