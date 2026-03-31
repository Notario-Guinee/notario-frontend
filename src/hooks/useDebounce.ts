// ═══════════════════════════════════════════════════════════════
// useDebounce — Retarde la propagation d'une valeur
// Evite les appels trop fréquents (saisie de recherche, etc.)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
