// useAnnouncer — Annonce des messages aux lecteurs d'écran via aria-live
// Conforme WCAG 2.1 critère 4.1.3 : Status Messages
import { useEffect, useRef } from "react";

export function useAnnouncer() {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Crée un élément aria-live invisible dans le DOM
    const el = document.createElement("div");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
    el.setAttribute("role", "status");
    el.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0;";
    document.body.appendChild(el);
    announcerRef.current = el;
    return () => el.remove();
  }, []);

  const announce = (message: string) => {
    if (!announcerRef.current) return;
    announcerRef.current.textContent = "";
    // Délai nécessaire pour que les lecteurs d'écran détectent le changement
    setTimeout(() => {
      if (announcerRef.current) announcerRef.current.textContent = message;
    }, 50);
  };

  return { announce };
}
