// ═══════════════════════════════════════════════════════════════
// Page Connexion Universelle — gère les portails admin, tenant et client
// via le paramètre ?portal=admin|tenant|client (défaut: tenant)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/context/AuthContext";

type PortalType = "admin" | "tenant" | "client";

/** Extrait le tenant depuis le sous-domaine. En dev (localhost), retourne "tenant-demo-1". */
function getTenantFromHostname(): string {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "tenant-demo-1";
  const parts = host.split(".");
  return parts.length >= 3 ? parts[0] : "tenant-demo-1";
}

function getTenantId(portal: PortalType): string {
  if (portal === "admin") return "global-admin";
  return getTenantFromHostname();
}

function getDashboardPath(portal: PortalType): string {
  if (portal === "admin") return "/admin/dashboard";
  if (portal === "client") return "/espace-client";
  return "/dashboard";
}

export default function LoginTenant() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const portal = (searchParams.get("portal") as PortalType) || "tenant";
  const { t } = useLanguage();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate(getDashboardPath(portal), { replace: true });
  }, [isAuthenticated, navigate, portal]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(email, password, getTenantId(portal));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  // Couleurs et textes selon le portail
  const leftBg = portal === "admin"
    ? "bg-[#0C1F35]"
    : portal === "client"
    ? "bg-gradient-to-b from-[#1B6B93] to-[#124B67]"
    : "bg-[#1a2e42]";

  const btnBg = portal === "admin"
    ? "bg-[#0C1F35] hover:bg-[#162d47]"
    : portal === "client"
    ? "bg-[#1B6B93] hover:bg-[#155A7A]"
    : "bg-[#1a2e42] hover:bg-[#243d56]";

  const portalLabel = portal === "admin"
    ? "Console Administration"
    : portal === "client"
    ? "Espace Client"
    : "Notario — Espace Cabinet";

  const forgotPortal = portal === "admin" ? "admin" : portal === "client" ? "client" : "tenant";

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[860px] grid grid-cols-1 md:grid-cols-2 rounded-2xl border border-border overflow-hidden shadow-xl"
      >
        {/* Left Panel */}
        <div className={`${leftBg} p-10 flex flex-col justify-between min-h-[540px] relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white font-bold text-lg shadow-lg">N</div>
              <div>
                <p className="text-white font-medium text-[15px]">Notario</p>
                <p className="text-white/50 text-[11px]">{portalLabel}</p>
              </div>
            </div>
            {portal === "admin" && (
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span className="text-[11px] text-white/60 font-medium">Accès restreint</span>
              </div>
            )}
            <h2 className="text-white text-[22px] font-medium leading-snug mb-3 whitespace-pre-line">
              {t("login.tenantWelcome")}
            </h2>
            <p className="text-white/50 text-[13px] leading-relaxed">{t("login.tenantDesc")}</p>
          </div>
          <div className="relative z-10 space-y-2.5 mt-8">
            <div className="h-px bg-white/10 mb-6" />
            {[t("login.tenantSec1"), t("login.tenantSec2"), t("login.tenantSec3")].map((text) => (
              <div key={text} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-white/50 text-[12px]">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-card p-10 flex flex-col justify-center">
          <div className="mb-7">
            {portal === "admin" && (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-base font-medium text-foreground">{t("login.adminTitle")}</p>
                  <p className="text-[12px] text-muted-foreground">{t("login.adminSubtitle")}</p>
                </div>
              </div>
            )}
            {portal === "admin" && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-3 py-2.5 mb-4">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span className="text-[12px] text-amber-700 dark:text-amber-300 leading-snug">{t("login.adminSecurityAlert")}</span>
              </div>
            )}
            {portal !== "admin" && (
              <>
                <h3 className="text-lg font-medium text-foreground mb-1">{t("login.tenantLogin")}</h3>
                <p className="text-[13px] text-muted-foreground">{t("login.tenantIdentifier")}</p>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("login.tenantEmailLabel")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={portal === "admin" ? "admin@notariale.com" : t("login.tenantEmailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("login.password")}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="text-right">
              <button
                onClick={() => navigate(`/forgot-password?portal=${forgotPortal}`)}
                className="text-xs text-primary hover:underline"
              >
                {t("login.forgotPassword")}
              </button>
            </div>

            <Button className={`w-full ${btnBg} text-white font-medium h-11`} onClick={handleLogin} disabled={loading}>
              {loading ? "Connexion en cours..." : t("login.tenantSubmit")}
            </Button>
          </div>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground">{t("login.tenantOr")}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex flex-col items-center gap-1.5 text-center text-xs text-muted-foreground">
            {portal === "tenant" && (
              <>
                <p>
                  {t("login.tenantClientLink")}{" "}
                  <button onClick={() => navigate("/espace-client")} className="text-primary hover:underline font-medium">{t("login.tenantClientAccess")}</button>
                </p>
                <p>
                  Pas encore de compte ?{" "}
                  <button onClick={() => navigate("/register")} className="text-primary hover:underline font-medium">Créer un cabinet</button>
                </p>
              </>
            )}
            {portal === "client" && (
              <p>
                Vous êtes du cabinet ?{" "}
                <button onClick={() => navigate("/login")} className="text-primary hover:underline font-medium">Connexion cabinet</button>
              </p>
            )}
          </div>

          <div className="mt-6 rounded-lg bg-muted/50 px-3.5 py-2.5 flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[11px] text-muted-foreground">{t("login.tenantSecureAccess")}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
