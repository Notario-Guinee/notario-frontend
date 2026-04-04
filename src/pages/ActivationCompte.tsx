// ═══════════════════════════════════════════════════════════════
// Page ActivationCompte — Flux invitation / magic link
//
// Accessible via /activer?token=<TOKEN_UNIQUE>
// Étapes :
//  1. Montage → validation du token auprès de l'API (simulée)
//  2. Si token invalide/expiré → état "error"
//  3. Si token valide → formulaire de création de mot de passe
//  4. Soumission → état "success" + bouton vers /login
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Lock, Eye, EyeOff, CheckCircle2, ShieldCheck,
  UserCheck, AlertTriangle, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

// ── Simulation d'appel API : validation du token ─────────────────────────────
// Remplacer par un vrai appel fetch / Supabase en production.
async function validateToken(token: string): Promise<{ valid: boolean; email?: string; nom?: string }> {
  await new Promise(r => setTimeout(r, 1200)); // latence simulée
  if (!token || token === "expired" || token === "invalid") return { valid: false };
  // Token accepté → on retourne les infos de l'utilisateur invité
  return { valid: true, email: "utilisateur@cabinet.gn", nom: "Mamadou Diallo" };
}

// ── Simulation d'appel API : activation du compte ────────────────────────────
async function activateAccount(_token: string, _password: string): Promise<void> {
  await new Promise(r => setTimeout(r, 1000));
  // En production : POST /api/activate avec { token, password }
}

// ─────────────────────────────────────────────────────────────────────────────

type Phase = "loading" | "error" | "form" | "success";

export default function ActivationCompte() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  // Lecture du token depuis l'URL (?token=...)
  const token = searchParams.get("token") ?? "";

  // ── Règles de validation (labels traduits) ────────────────────────────────
  const PASSWORD_RULES = [
    { id: "length", label: t("activation.ruleLength"), test: (p: string) => p.length >= 12 },
    { id: "upper",  label: t("activation.ruleUpper"),  test: (p: string) => /[A-Z]/.test(p) },
    { id: "digit",  label: t("activation.ruleDigit"),  test: (p: string) => /\d/.test(p) },
    { id: "special",label: t("activation.ruleSpecial"),test: (p: string) => /[!@#$%^&*()\-_=+\[\]{};':",.<>/?\\|`~]/.test(p) },
  ];

  // ── Calcul de la force en fonction du nombre de critères validés ──────────
  const getStrength = (password: string, score: number) => {
    if (!password) return null;
    if (score === 1) return { label: t("activation.strengthWeak"),     barClass: "w-1/4 bg-destructive",  textClass: "text-destructive" };
    if (score === 2) return { label: t("activation.strengthMedium"),   barClass: "w-2/4 bg-orange-400",   textClass: "text-orange-400" };
    if (score === 3) return { label: t("activation.strengthStrong"),   barClass: "w-3/4 bg-blue-500",     textClass: "text-blue-500" };
    return             { label: t("activation.strengthVeryStrong"), barClass: "w-full bg-success",     textClass: "text-success" };
  };

  // ── Phase globale du flux ─────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("loading");
  const [tokenInfo, setTokenInfo] = useState<{ email: string; nom: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Champs du formulaire ──────────────────────────────────────────────────
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Validation en temps réel ──────────────────────────────────────────────
  const checks = PASSWORD_RULES.map(r => ({ ...r, valid: r.test(password) }));
  const score = checks.filter(c => c.valid).length;
  const allValid = score === PASSWORD_RULES.length;
  const matches = password.length > 0 && password === confirm;
  const strength = getStrength(password, score);

  // ── Vérification du token au montage du composant ─────────────────────────
  useEffect(() => {
    if (!token) {
      setPhase("error");
      return;
    }
    validateToken(token).then(result => {
      if (result.valid && result.email && result.nom) {
        setTokenInfo({ email: result.email, nom: result.nom });
        setPhase("form");
      } else {
        setPhase("error");
      }
    });
  }, [token]);

  // ── Soumission du formulaire ──────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allValid || !matches) return;
    setIsSubmitting(true);
    try {
      await activateAccount(token, password);
      setPhase("success");
      toast.success(t("activation.toastSuccess"));
    } catch {
      toast.error(t("activation.toastError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <LanguageSwitcher className="absolute top-4 right-4 z-20" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">

          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-8 text-center">
            <UserCheck className="h-12 w-12 text-white/90 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-white">{t("activation.pageTitle")}</h1>
            <p className="text-white/70 text-sm mt-1">Notario — Cabinet notarial</p>
          </div>

          <div className="p-8">

            {/* ══════════════════════════════════════════
                État 1 : Vérification du token en cours
            ══════════════════════════════════════════ */}
            {phase === "loading" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {t("activation.loading")}
                </p>
              </div>
            )}

            {/* ══════════════════════════════════════════
                État 2 : Token invalide ou expiré
            ══════════════════════════════════════════ */}
            {phase === "error" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-4"
              >
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {t("activation.invalidTitle")}
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {t("activation.invalidDesc")}
                </p>
                <Button variant="outline" onClick={() => navigate("/login")}>
                  {t("activation.backToLogin")}
                </Button>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════
                État 3 : Formulaire de création de mdp
            ══════════════════════════════════════════ */}
            {phase === "form" && (
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Accueil personnalisé avec les infos de l'invité */}
                {tokenInfo && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
                    <p className="text-sm font-medium text-foreground">
                      {t("activation.welcome")} {tokenInfo.nom}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tokenInfo.email}
                    </p>
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  {t("activation.setPasswordDesc")}
                </p>

                {/* ── Champ : Nouveau mot de passe ── */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {t("activation.newPassword")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Barre de force — visible dès qu'on tape */}
                  {password && strength && (
                    <div className="space-y-1 pt-1">
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strength.barClass}`}
                        />
                      </div>
                      <p className={`text-[11px] font-medium ${strength.textClass}`}>
                        {t("activation.strength")} {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Checklist des critères en temps réel ── */}
                <div className="grid grid-cols-2 gap-1.5">
                  {checks.map(c => (
                    <div key={c.id} className="flex items-center gap-1.5 text-xs">
                      <CheckCircle2
                        className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                          c.valid ? "text-success" : "text-muted-foreground/40"
                        }`}
                      />
                      <span className={c.valid ? "text-foreground" : "text-muted-foreground"}>
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* ── Champ : Confirmation ── */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {t("activation.confirmPassword")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className={`pl-10 pr-10 ${
                        confirm && !matches ? "border-destructive focus-visible:ring-destructive" : ""
                      }`}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Feedback correspondance */}
                  {confirm && !matches && (
                    <p className="text-xs text-destructive">
                      {t("activation.noMatch")}
                    </p>
                  )}
                  {matches && (
                    <p className="text-xs text-success flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t("activation.match")}
                    </p>
                  )}
                </div>

                {/* ── Bouton de soumission — grisé tant que les critères ne sont pas tous validés ── */}
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!allValid || !matches || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t("activation.activating")}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      {t("activation.activateBtn")}
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* ══════════════════════════════════════════
                État 4 : Succès — compte activé
            ══════════════════════════════════════════ */}
            {phase === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-4"
              >
                <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{t("activation.successTitle")}</h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {t("activation.successDesc")}
                </p>
                <Button
                  onClick={() => navigate("/login")}
                  className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {t("activation.signIn")}
                </Button>
              </motion.div>
            )}

          </div>
        </div>
      </motion.div>
    </div>
  );
}
