// ═══════════════════════════════════════════════════════════════
// Hook useIsMobile — Détecte si l'écran est en mode mobile
// Surveille les changements de largeur via MediaQueryList
// Point de rupture : 768px (valeur MOBILE_BREAKPOINT)
// ═══════════════════════════════════════════════════════════════

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
