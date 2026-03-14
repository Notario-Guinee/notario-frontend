import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User, FileText, FolderOpen, MessageSquare, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function LoginPortailClient() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const cabinetName = "Cabinet Maître Sylla";
  const subdomain = "sylla.notariale.com";

  const features = [
    { icon: FolderOpen, label: t("login.clientFeature1") },
    { icon: FileText, label: t("login.clientFeature2") },
    { icon: MessageSquare, label: t("login.clientFeature3") },
    { icon: Bell, label: t("login.clientFeature4") },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f4f8] to-[#e2e8f0] p-4 relative">
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
        <div className="bg-gradient-to-b from-[#1B6B93] to-[#124B67] p-10 flex flex-col justify-between min-h-[560px] relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white font-bold text-lg">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-white font-medium text-[15px]">{cabinetName}</p>
                <p className="text-white/50 text-[11px]">{t("login.clientPortal")} — {subdomain}</p>
              </div>
            </div>
            <h2 className="text-white text-[22px] font-medium leading-snug mb-3 whitespace-pre-line">{t("login.clientTitle")}</h2>
            <p className="text-white/60 text-[13px] leading-relaxed">{t("login.clientDesc")}</p>
          </div>
          <div className="relative z-10 mt-8">
            <div className="h-px bg-white/15 mb-6" />
            <div className="grid grid-cols-2 gap-3">
              {features.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 rounded-lg bg-white/8 border border-white/10 px-3 py-2.5">
                  <Icon className="h-3.5 w-3.5 text-white/70 shrink-0" />
                  <span className="text-[11px] text-white/70 leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-card p-10 flex flex-col justify-center">
          <div className="mb-7">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#1B6B93]/10 flex items-center justify-center">
                <User className="h-4 w-4 text-[#1B6B93]" />
              </div>
              <span className="text-xs font-semibold text-[#1B6B93] uppercase tracking-wider">{t("login.clientSpace")}</span>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">{t("login.clientSubmitLabel")}</h3>
            <p className="text-[13px] text-muted-foreground">{t("login.clientSubmitDesc")}</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("login.clientEmail")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder={t("forgot.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("login.password")}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <button onClick={() => navigate("/forgot-password?portal=client")} className="text-xs text-[#1B6B93] hover:underline">{t("login.forgotPassword")}</button>
            </div>
            <Button className="w-full bg-[#1B6B93] hover:bg-[#155A7A] text-white font-medium h-11" onClick={() => navigate("/espace-client")}>
              {t("login.clientSubmit")}
            </Button>
          </div>
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground">{t("login.tenantOr")}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {t("login.clientStaffLink")}{" "}
            <button onClick={() => navigate("/login")} className="text-[#1B6B93] hover:underline font-medium">{t("login.clientStaffAccess")}</button>
          </p>
          <div className="mt-6 rounded-lg bg-muted/50 px-3.5 py-2.5 flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[11px] text-muted-foreground">
              {t("login.clientPortalIndicator")} — <strong className="text-foreground">{cabinetName}</strong>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
