// ═══════════════════════════════════════════════════════════════
// Composant ModulePlaceholder — Page temporaire pour modules
// Affiche un message « en construction » pour les routes dont
// le contenu n'est pas encore développé
// ═══════════════════════════════════════════════════════════════

import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Construction } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const pathKeys: Record<string, string> = {
  "/agenda": "placeholder.path.agenda",
  "/paiements": "placeholder.path.paiements",
  "/comptes": "placeholder.path.comptes",
  "/caisse": "placeholder.path.caisse",
  "/tarifs": "placeholder.path.tarifs",
  "/archives-numeriques": "placeholder.path.archivesNumeriques",
  "/archives-physiques": "placeholder.path.archivesPhysiques",
  "/modeles": "placeholder.path.modeles",
  "/messagerie": "placeholder.path.messagerie",
  "/notifications": "placeholder.path.notifications",
  "/formation": "placeholder.path.formation",
  "/portail": "placeholder.path.portail",
  "/cabinet": "placeholder.path.cabinet",
  "/utilisateurs": "placeholder.path.utilisateurs",
  "/securite": "placeholder.path.securite",
  "/stockage": "placeholder.path.stockage",
  "/admin/tenants": "placeholder.path.adminTenants",
  "/admin/modules": "placeholder.path.adminModules",
  "/admin/leads": "placeholder.path.adminLeads",
  "/admin/monitoring": "placeholder.path.adminMonitoring",
};

export default function ModulePlaceholder() {
  const { t } = useLanguage();
  const location = useLocation();
  const key = pathKeys[location.pathname];
  const name = key ? t(key) : "Module";

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
        {t("placeholder.underDev")}
      </p>
    </motion.div>
  );
}
