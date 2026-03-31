// ═══════════════════════════════════════════════════════════════
// useIntersectionObserver — Détecte l'entrée d'un élément dans le viewport
// Utilisé pour déclencher le chargement de la page suivante
// Retourne une ref à attacher à l'élément sentinelle
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useCallback, type RefObject } from 'react';

interface Options {
  onIntersect: () => void;
  rootMargin?: string;
  threshold?: number;
  enabled?: boolean;
}

export function useIntersectionObserver({
  onIntersect,
  rootMargin = '0px 0px 300px 0px',
  threshold = 0,
  enabled = true,
}: Options): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null);
  const stableOnIntersect = useCallback(onIntersect, [onIntersect]);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) stableOnIntersect();
      },
      { rootMargin, threshold },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [enabled, rootMargin, threshold, stableOnIntersect]);

  return ref;
}
