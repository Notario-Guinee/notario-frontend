// ═══════════════════════════════════════════════════════════════
// Page Mot de passe oublié — Récupération de compte
// Formulaire de demande de réinitialisation par email, affiche
// une confirmation après envoi du lien de réinitialisation
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, ShieldCheck, User, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type PortalType = "admin" | "tenant" | "client";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const portal = (searchParams.get("portal") as PortalType) || "tenant";

  const configs: Record<PortalType, {
    titleKey: string; subtitleKey: string; descKey: string; backLabelKey: string; backPath: string;
    accentColor: string; accentHover: string; icon: React.ElementType;
    leftBg: string; leftTitleKey: string; leftDescKey: string;
  }> = {
    admin: {
      titleKey: "forgot.adminTitle", subtitleKey: "forgot.adminSubtitle", descKey: "forgot.adminDesc",
      backLabelKey: "forgot.adminBack", backPath: "/admin/login",
      accentColor: "bg-[#0C1F35]", accentHover: "hover:bg-[#162d47]", icon: ShieldCheck,
      leftBg: "bg-[#0C1F35]", leftTitleKey: "forgot.adminLeftTitle", leftDescKey: "forgot.adminLeftDesc",
    },
    tenant: {
      titleKey: "forgot.tenantTitle", subtitleKey: "forgot.tenantSubtitle", descKey: "forgot.tenantDesc",
      backLabelKey: "forgot.tenantBack", backPath: "/login",
      accentColor: "bg-[#1a2e42]", accentHover: "hover:bg-[#243d56]", icon: KeyRound,
      leftBg: "bg-[#1a2e42]", leftTitleKey: "forgot.tenantLeftTitle", leftDescKey: "forgot.tenantLeftDesc",
    },
    client: {
      titleKey: "forgot.clientTitle", subtitleKey: "forgot.clientSubtitle", descKey: "forgot.clientDesc",
      backLabelKey: "forgot.clientBack", backPath: "/client/login",
      accentColor: "bg-[#1B6B93]", accentHover: "hover:bg-[#155A7A]", icon: User,
      leftBg: "bg-gradient-to-b from-[#1B6B93] to-[#124B67]", leftTitleKey: "forgot.clientLeftTitle", leftDescKey: "forgot.clientLeftDesc",
    },
  };

  const config = configs[portal] || configs.tenant;
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error(t("forgot.errorEmpty")); return; }
    setSubmitted(true);
    toast.success(t("forgot.successToast"));
  };

  const Icon = config.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-[860px] grid grid-cols-1 md:grid-cols-2 rounded-2xl border border-border overflow-hidden shadow-xl">
        {/* Left */}
        <div className={`${config.leftBg} p-10 flex flex-col justify-between min-h-[480px] relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium text-[15px]">Notariale SaaS</p>
                <p className="text-white/40 text-[11px]">{t(config.subtitleKey)}</p>
              </div>
            </div>
            <h2 className="text-white text-[22px] font-medium leading-snug mb-3 whitespace-pre-line">{t(config.leftTitleKey)}</h2>
            <p className="text-white/50 text-[13px] leading-relaxed">{t(config.leftDescKey)}</p>
          </div>
          <div className="relative z-10">
            <div className="h-px bg-white/10 mb-6" />
            <div className="space-y-2.5">
              {[t("forgot.sec1"), t("forgot.sec2"), t("forgot.sec3")].map((text) => (
                <div key={text} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-white/50 text-[12px]">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="bg-card p-10 flex flex-col justify-center">
          {!submitted ? (
            <>
              <div className="mb-7">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-full ${config.accentColor}/10 flex items-center justify-center`}>
                    <KeyRound className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-foreground">{t(config.titleKey)}</p>
                    <p className="text-[12px] text-muted-foreground">{t(config.subtitleKey)}</p>
                  </div>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{t(config.descKey)}</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t("forgot.emailLabel")}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder={t("forgot.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" autoFocus />
                  </div>
                </div>
                <Button type="submit" className={`w-full ${config.accentColor} ${config.accentHover} text-white font-medium h-11`}>
                  {t("forgot.submit")}
                </Button>
              </form>
              <div className="h-px bg-border my-6" />
              <button onClick={() => navigate(config.backPath)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto">
                <ArrowLeft className="h-3.5 w-3.5" />
                {t(config.backLabelKey)}
              </button>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">{t("forgot.successTitle")}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">
                {t("forgot.successDesc")} <strong className="text-foreground">{email}</strong>{t("forgot.successDesc2")}
              </p>
              <p className="text-[12px] text-muted-foreground mb-6">{t("forgot.checkSpam")}</p>
              <div className="space-y-3">
                <Button variant="outline" className="w-full" onClick={() => { setSubmitted(false); setEmail(""); }}>
                  {t("forgot.resend")}
                </Button>
                <button onClick={() => navigate(config.backPath)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t(config.backLabelKey)}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
