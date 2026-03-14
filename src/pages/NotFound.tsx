// ═══════════════════════════════════════════════════════════════
// Page 404 — Affichée lorsque l'utilisateur accède à une route
// inexistante. Propose un lien de retour vers le tableau de bord.
// ═══════════════════════════════════════════════════════════════

import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Composant de page introuvable (404)
 * Affiche un message clair et un bouton de retour au tableau de bord
 */
const NotFound = () => {
  const location = useLocation();
  const { lang } = useLanguage();
  const fr = lang === "FR";

  // Journaliser l'erreur 404 pour le débogage
  useEffect(() => {
    console.error("404 — Route introuvable :", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-6xl font-heading font-bold text-primary">404</p>
        <h1 className="text-xl font-heading font-semibold text-foreground">
          {fr ? "Page introuvable" : "Page not found"}
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {fr
            ? `La page "${location.pathname}" n'existe pas ou a été déplacée.`
            : `The page "${location.pathname}" doesn't exist or has been moved.`}
        </p>
        <Button asChild className="mt-2 gap-2">
          <Link to="/dashboard">
            <Home className="h-4 w-4" />
            {fr ? "Retour au tableau de bord" : "Back to dashboard"}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
