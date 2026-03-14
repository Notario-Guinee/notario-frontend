// ═══════════════════════════════════════════════════════════════
// Barre supérieure (TopBar) — Affiche le fil d'Ariane, le statut
// en ligne, le sélecteur de langue, le thème, les manuels,
// les notifications et le menu utilisateur
// ═══════════════════════════════════════════════════════════════

import { Bell, Wifi, WifiOff, Sun, Moon, User, Settings, LogOut, HelpCircle, Shield, Globe, BookDown } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { currentUser } from "@/data/mockData";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [online] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  // Correspondance chemin → nom de page traduit
  const pathNames: Record<string, string> = {
    "/dashboard": t("nav.dashboard"),
    "/clients": t("nav.clients"),
    "/dossiers": t("nav.dossiers"),
    "/agenda": t("nav.agenda"),
    "/kanban": t("nav.kanban"),
    "/factures": t("nav.factures"),
    "/paiements": t("nav.paiements"),
    "/comptes": t("nav.comptes"),
    "/caisse": t("nav.caisse"),
    "/synthese": t("nav.synthese"),
    "/tarifs": t("nav.tarifs"),
    "/archives-numeriques": t("nav.archivesNumeriques"),
    "/archives-physiques": t("nav.archivesPhysiques"),
    "/modeles": t("nav.modeles"),
    "/messagerie": t("nav.messagerie"),
    "/notifications": t("nav.notifications"),
    "/formation": t("nav.formation"),
    "/portail": t("nav.portail"),
    "/cabinet": t("nav.cabinet"),
    "/types-actions": t("nav.typesActions"),
    "/actes": t("nav.actesSignatures"),
    "/administration": "Administration",
  };

  const pageName = pathNames[location.pathname] || "Notario";

  /** Simuler le téléchargement d'un manuel utilisateur */
  const handleDownloadManual = (language: string) => {
    toast.info(`📖 ${t("action.download")}...`);
    setTimeout(() => toast.success(`${language === "FR" ? "Manuel" : "Manual"} (${language}) ✓`), 1500);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 backdrop-blur-md px-6">
      {/* Fil d'Ariane */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Notario</span>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">{pageName}</span>
      </div>

      <div className="ml-auto" />

      {/* Indicateur de connexion */}
      <div className="hidden sm:flex items-center gap-1.5">
        {online ? (
          <Wifi className="h-4 w-4 text-success" />
        ) : (
          <WifiOff className="h-4 w-4 text-destructive" />
        )}
        <span className="text-xs text-muted-foreground">{online ? t("topbar.online") : t("topbar.offline")}</span>
      </div>

      {/* Sélecteur de langue */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors text-xs font-medium text-muted-foreground hover:text-foreground">
            <Globe className="h-4 w-4" />
            <span>{lang}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => { setLang("FR"); toast.info("Langue : Français"); }}>
            <span className="mr-2">🇫🇷</span> Français
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setLang("EN"); toast.info("Language: English"); }}>
            <span className="mr-2">🇬🇧</span> English
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Bascule de thème clair/sombre */}
      <button
        onClick={toggleTheme}
        className="rounded-lg p-2 hover:bg-muted transition-colors"
        aria-label={t("topbar.theme")}
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
        ) : (
          <Moon className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
        )}
      </button>

      {/* Téléchargement des manuels utilisateur */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-lg p-2 hover:bg-muted transition-colors" aria-label={t("topbar.manuals")}>
            <BookDown className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{t("topbar.manuals")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleDownloadManual("FR")}>
            <span className="mr-2">🇫🇷</span> {t("topbar.manualFR")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownloadManual("EN")}>
            <span className="mr-2">🇬🇧</span> {t("topbar.manualEN")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Bouton de notifications avec badge */}
      <button className="relative rounded-lg p-2 hover:bg-muted transition-colors" aria-label="Notifications" onClick={() => navigate("/notifications")}>
        <Bell className="h-5 w-5 text-muted-foreground" />
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
          5
        </span>
      </button>

      {/* Menu déroulant du profil utilisateur */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 font-heading text-xs font-bold text-primary cursor-pointer hover:bg-primary/30 transition-colors shrink-0 outline-none">
            {currentUser.firstName.charAt(0)}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{currentUser.name}</span>
              <span className="text-xs text-muted-foreground">{currentUser.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/cabinet")}>
            <User className="mr-2 h-4 w-4" /> {t("topbar.profile")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/cabinet")}>
            <Settings className="mr-2 h-4 w-4" /> {t("topbar.settings")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/administration?tab=securite")}>
            <Shield className="mr-2 h-4 w-4" /> {t("topbar.security")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/formation")}>
            <HelpCircle className="mr-2 h-4 w-4" /> {t("topbar.help")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => toast.info(lang === "FR" ? "Déconnexion..." : "Signing out...")}>
            <LogOut className="mr-2 h-4 w-4" /> {t("topbar.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
