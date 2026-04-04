// ═══════════════════════════════════════════════════════════════
// TopBar — Barre supérieure fixe
// Fil d'Ariane, accessibilité (taille du texte), langue, thème,
// manuels, notifications, profil utilisateur
// ═══════════════════════════════════════════════════════════════

import {
  Bell, Wifi, WifiOff, Sun, Moon, User, Settings, LogOut,
  HelpCircle, Shield, Globe, BookDown, X, Check, AlertTriangle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Options de taille ──────────────────────────────────────────

const FONT_OPTIONS = [
  { value: 100 as const, label: '100 %', rootPx: '14px', letterClass: 'text-base' },
  { value: 150 as const, label: '150 %', rootPx: '17px', letterClass: 'text-xl'  },
  { value: 200 as const, label: '200 %', rootPx: '20px', letterClass: 'text-3xl' },
] as const;

type FontScale = 100 | 150 | 200;

// ═══════════════════════════════════════════════════════════════

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [online]  = useState(true);
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t }   = useLanguage();
  const { user, logout }       = useAuth();

  // ─── Signalement technique ──────────────────────────────────
  const [showReport, setShowReport]         = useState(false);
  const [reportMsg, setReportMsg]           = useState('');
  const [reportTech, setReportTech]         = useState(true);
  const [reportSending, setReportSending]   = useState(false);

  const handleSendReport = () => {
    if (!reportMsg.trim()) return;
    setReportSending(true);
    setTimeout(() => {
      setReportSending(false);
      setShowReport(false);
      setReportMsg('');
      toast.success(t('topbar.reportSent'));
    }, 1400);
  };

  // ─── Taille du texte ────────────────────────────────────────
  const [showFontPanel, setShowFontPanel] = useState(false);
  const [fontScale, setFontScale] = useState<FontScale>(() => {
    const saved = localStorage.getItem('notario_font_scale');
    return (saved ? parseInt(saved) : 100) as FontScale;
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef   = useRef<HTMLButtonElement>(null);

  // Applique la taille de police sur la racine HTML
  useEffect(() => {
    const opt = FONT_OPTIONS.find(o => o.value === fontScale);
    if (opt) document.documentElement.style.fontSize = opt.rootPx;
    localStorage.setItem('notario_font_scale', String(fontScale));
  }, [fontScale]);

  // Ferme le panneau sur clic extérieur
  useEffect(() => {
    if (!showFontPanel) return;
    const handleClick = (e: MouseEvent) => {
      if (
        !panelRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) setShowFontPanel(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showFontPanel]);

  // ─── Noms de pages ──────────────────────────────────────────
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
    "/administration": t("nav.administration"),
  };

  const pageName = pathNames[location.pathname] || "Notario";

  const handleDownloadManual = (language: string) => {
    toast.info(`📖 ${t("action.download")}...`);
    setTimeout(() => toast.success(`${t("topbar.manualLabel")} (${language}) ✓`), 1500);
  };

  return (
    <>
      {/* ── Barre principale ── */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 backdrop-blur-md px-6">

        {/* Fil d'Ariane */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Notario</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">{pageName}</span>
        </div>

        <div className="ml-auto" />

        {/* Indicateur connexion */}
        <div className="hidden sm:flex items-center gap-1.5">
          {online
            ? <Wifi className="h-4 w-4 text-success" />
            : <WifiOff className="h-4 w-4 text-destructive" />}
          <span className="text-xs text-muted-foreground">
            {online ? t("topbar.online") : t("topbar.offline")}
          </span>
        </div>

        {/* ── Bouton AA taille du texte ── */}
        <button
          ref={btnRef}
          onClick={() => setShowFontPanel(v => !v)}
          aria-label={t('topbar.fontSize')}
          aria-expanded={showFontPanel}
          className={cn(
            'flex items-center gap-0.5 rounded-lg px-2 py-1.5 transition-all duration-150',
            'text-muted-foreground hover:text-foreground hover:bg-muted',
            showFontPanel && 'bg-muted text-foreground',
          )}
        >
          <span className="font-bold tracking-tight text-sm leading-none">AA</span>
          <span className={cn(
            'text-xs font-bold leading-none transition-transform duration-200 select-none',
            showFontPanel ? 'rotate-0' : '',
          )}>
            {showFontPanel ? '−' : '+'}
          </span>
          {fontScale !== 100 && (
            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          )}
        </button>

        {/* Langue */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors text-xs font-medium text-muted-foreground hover:text-foreground">
              <Globe className="h-4 w-4" />
              <span>{lang}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => { setLang("FR"); toast.info(t("topbar.langSwitchFR")); }}>
              <span className="mr-2">🇫🇷</span> {t("topbar.langFR")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setLang("EN"); toast.info(t("topbar.langSwitchEN")); }}>
              <span className="mr-2">🇬🇧</span> English
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Thème */}
        <button onClick={toggleTheme} className="rounded-lg p-2 hover:bg-muted transition-colors" aria-label={t("topbar.theme")}>
          {theme === "dark"
            ? <Sun className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            : <Moon className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />}
        </button>

        {/* Manuels */}
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

        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 hover:bg-muted transition-colors"
          aria-label={t('topbar.notifications')}
          onClick={() => navigate("/notifications")}
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            5
          </span>
        </button>

        {/* Profil */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 font-heading text-xs font-bold text-primary cursor-pointer hover:bg-primary/30 transition-colors shrink-0 outline-none">
              {user?.initiales ?? "U"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{user?.nomComplet ?? "Utilisateur"}</span>
                <span className="text-xs text-muted-foreground">{user?.email ?? ""}</span>
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
            <DropdownMenuItem onClick={() => setShowReport(true)}>
              <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" /> {t('topbar.reportIssue')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => { logout(); navigate("/login"); }}
            >
              <LogOut className="mr-2 h-4 w-4" /> {t("topbar.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* ── Panneau taille du texte ── */}
      <div
        ref={panelRef}
        className={cn(
          'sticky top-16 z-20 overflow-hidden transition-all duration-300 ease-in-out',
          showFontPanel ? 'max-h-56 opacity-100' : 'max-h-0 opacity-0 pointer-events-none',
        )}
      >
        <div className="bg-card border-b border-border shadow-lg">
          <div className="max-w-2xl mx-auto px-6 py-5">

            {/* En-tête du panneau */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground leading-tight">
                  {t('topbar.fontSize')}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t('topbar.fontSizeDesc')}
                </p>
              </div>
              <button
                onClick={() => setShowFontPanel(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 ml-4"
                aria-label={t('action.close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Options de taille */}
            <div className="flex items-end gap-8">
              {FONT_OPTIONS.map(opt => {
                const isActive = fontScale === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setFontScale(opt.value); }}
                    className="flex flex-col items-center gap-2 group"
                    aria-label={`${t('topbar.fontSize')} ${opt.label}`}
                    aria-pressed={isActive}
                  >
                    {/* Carré avec lettre A */}
                    <div className={cn(
                      'h-12 w-12 flex items-center justify-center rounded-md border-2 transition-all duration-150',
                      'font-bold text-primary',
                      isActive
                        ? 'border-primary bg-primary/15 shadow-[0_0_0_3px_rgba(var(--primary),.15)]'
                        : 'border-border bg-muted/40 group-hover:border-primary/40 group-hover:bg-muted',
                      opt.letterClass,
                    )}>
                      A
                    </div>

                    {/* Label pourcentage */}
                    <div className="flex flex-col items-center gap-1">
                      <span className={cn(
                        'text-xs font-medium transition-colors',
                        isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                      )}>
                        {opt.label}
                      </span>

                      {/* Barre de sélection */}
                      <div className={cn(
                        'h-0.5 rounded-full transition-all duration-300',
                        isActive ? 'w-8 bg-primary' : 'w-0 bg-transparent',
                      )} />
                    </div>

                    {/* Checkmark discret */}
                    {isActive && (
                      <Check className="h-3 w-3 text-primary absolute -mt-0.5 opacity-0" />
                    )}
                  </button>
                );
              })}

              {/* Boutons +/- rapides */}
              <div className="ml-auto flex items-center gap-2 pb-1">
                <button
                  onClick={() => setFontScale(v => v === 200 ? 150 : v === 150 ? 100 : 100)}
                  disabled={fontScale === 100}
                  className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted transition-all disabled:opacity-30 disabled:cursor-not-allowed text-lg font-light"
                  aria-label={t('topbar.fontSizeDecrease')}
                >
                  −
                </button>
                <button
                  onClick={() => setFontScale(v => v === 100 ? 150 : v === 150 ? 200 : 200)}
                  disabled={fontScale === 200}
                  className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted transition-all disabled:opacity-30 disabled:cursor-not-allowed text-lg font-light"
                  aria-label={t('topbar.fontSizeIncrease')}
                >
                  +
                </button>
                {fontScale !== 100 && (
                  <button
                    onClick={() => setFontScale(100)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 ml-1"
                  >
                    {t('topbar.fontSizeReset')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Signaler un problème ── */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-7 w-7 text-amber-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold leading-tight">
                  {t('topbar.reportTitle')}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  {t('topbar.reportDesc')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Info box */}
          <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">{t('topbar.reportCanDo')}</p>
            <ul className="list-disc list-inside space-y-0.5 text-sm">
              <li>{t('topbar.reportItem1')}</li>
              <li>{t('topbar.reportItem2')}</li>
              <li>{t('topbar.reportItem3')}</li>
            </ul>
          </div>

          {/* Textarea */}
          <Textarea
            placeholder={t('topbar.reportPlaceholder')}
            value={reportMsg}
            onChange={e => setReportMsg(e.target.value)}
            rows={4}
            className="resize-none"
          />

          {/* Checkbox rapport technique */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-0.5">
              <input
                type="checkbox"
                checked={reportTech}
                onChange={e => setReportTech(e.target.checked)}
                className="rounded border-border h-4 w-4 accent-primary"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {t('topbar.reportSendTech')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('topbar.reportNoPersonal')}
              </p>
            </div>
          </label>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReport(false)}>{t('action.cancel')}</Button>
            <Button
              onClick={handleSendReport}
              disabled={!reportMsg.trim() || reportSending}
              className="gap-2"
            >
              {reportSending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />}
              {t('topbar.reportSendEmail')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
