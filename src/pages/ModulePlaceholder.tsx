// ═══════════════════════════════════════════════════════════════
// Composant ModulePlaceholder — Page temporaire pour modules
// Affiche un message « en construction » pour les routes dont
// le contenu n'est pas encore développé
// ═══════════════════════════════════════════════════════════════

import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Construction } from "lucide-react";

const pathNames: Record<string, string> = {
  "/agenda": "Agenda & Rendez-vous",
  "/paiements": "Paiements & Reçus",
  "/comptes": "Comptes Bancaires",
  "/caisse": "Caisse & Débours",
  "/tarifs": "Moteur de Tarifs",
  "/archives-numeriques": "Archives Numériques (OCR)",
  "/archives-physiques": "Archives Physiques",
  "/modeles": "Modèles de Documents",
  "/messagerie": "Messagerie Interne",
  "/notifications": "Centre de Notifications",
  "/formation": "Espace Formation",
  "/portail": "Portail Client",
  "/cabinet": "Mon Cabinet",
  "/utilisateurs": "Gestion Utilisateurs",
  "/securite": "Sécurité & Audit",
  "/stockage": "Stockage",
  "/admin/tenants": "Gestion des Tenants",
  "/admin/modules": "Modules & Facturation",
  "/admin/leads": "Leads & Démos",
  "/admin/monitoring": "Monitoring Plateforme",
};

export default function ModulePlaceholder() {
  const location = useLocation();
  const name = pathNames[location.pathname] || "Module";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
        <Construction className="h-8 w-8 text-primary" />
      </div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-2">{name}</h1>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        Ce module est en cours de développement. Il sera disponible prochainement avec toutes les fonctionnalités prévues.
      </p>
    </motion.div>
  );
}
