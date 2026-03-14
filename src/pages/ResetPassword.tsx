import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type PortalType = "admin" | "tenant" | "client";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const portal = (searchParams.get("portal") as PortalType) || "tenant";
  const { t } = useLanguage();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const configs: Record<PortalType, { title: string; gradient: string; loginPath: string }> = {
    admin: {
      title: "Notariale SaaS — Admin",
      gradient: "from-slate-900 via-slate-800 to-slate-700",
      loginPath: "/admin/login",
    },
    tenant: {
      title: "Notariale SaaS",
      gradient: "from-blue-900 via-blue-800 to-indigo-900",
      loginPath: "/login",
    },
    client: {
      title: "Espace Client",
      gradient: "from-emerald-900 via-teal-800 to-emerald-700",
      loginPath: "/client/login",
    },
  };

  const config = configs[portal];

  const passwordChecks = [
    { label: t("reset.minLength"), valid: password.length >= 8 },
    { label: t("reset.hasUpper"), valid: /[A-Z]/.test(password) },
    { label: t("reset.hasLower"), valid: /[a-z]/.test(password) },
    { label: t("reset.hasNumber"), valid: /\d/.test(password) },
    { label: t("reset.hasSpecial"), valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const allValid = passwordChecks.every((c) => c.valid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) {
      toast.error(t("reset.requirementsNotMet"));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("reset.mismatch"));
      return;
    }
    // TODO: call supabase.auth.updateUser({ password })
    setSubmitted(true);
    toast.success(t("reset.success"));
  };

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
          {/* Header */}
          <div className={`bg-gradient-to-r ${config.gradient} p-8 text-center`}>
            <ShieldCheck className="h-12 w-12 text-white/90 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-white">{t("reset.title")}</h1>
            <p className="text-white/70 text-sm mt-1">{config.title}</p>
          </div>

          <div className="p-8">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-sm text-muted-foreground">{t("reset.instructions")}</p>

                {/* New password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t("reset.newPassword")}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password strength checklist */}
                <div className="grid grid-cols-2 gap-1.5">
                  {passwordChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-1.5 text-xs">
                      <CheckCircle2
                        className={`h-3.5 w-3.5 ${check.valid ? "text-green-500" : "text-muted-foreground/40"}`}
                      />
                      <span className={check.valid ? "text-foreground" : "text-muted-foreground"}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t("reset.confirmPassword")}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">{t("reset.mismatch")}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={!allValid || !confirmPassword}>
                  {t("reset.submit")}
                </Button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-4"
              >
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{t("reset.successTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("reset.successDesc")}</p>
                <Button onClick={() => navigate(config.loginPath)} className="mt-2">
                  {t("reset.backToLogin")}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
