import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function LoginAdmin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
        <div className="bg-[#0C1F35] p-10 flex flex-col justify-between min-h-[600px] relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #378ADD 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-9">
              <div className="w-10 h-10 rounded-xl bg-[#1a3a58] border border-[#2a5070] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="3" width="6" height="6" rx="1.5" fill="#378ADD"/>
                  <rect x="11" y="3" width="6" height="6" rx="1.5" fill="#378ADD" opacity="0.6"/>
                  <rect x="3" y="11" width="6" height="6" rx="1.5" fill="#378ADD" opacity="0.6"/>
                  <rect x="11" y="11" width="6" height="6" rx="1.5" fill="#378ADD"/>
                </svg>
              </div>
              <div>
                <p className="text-[#e8f0f8] font-medium text-[15px]">Notariale SaaS</p>
                <p className="text-[#5a7a96] text-[11px]">admin.notariale.com</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 bg-[#1a3a58] border border-[#2a5070] px-3 py-1.5 rounded-full mb-7">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[11px] text-[#9ab0c8] font-medium">{t("login.adminRestricted")}</span>
            </div>
            <h2 className="text-[#e8f0f8] text-xl font-medium leading-snug mb-3 whitespace-pre-line">
              {t("login.adminConsole")}
            </h2>
            <p className="text-[#5a7a96] text-[13px] leading-relaxed">{t("login.adminDesc")}</p>
          </div>
          <div className="relative z-10">
            <div className="h-px bg-[#1e3a55] mb-6" />
            <div className="space-y-2.5 mb-7">
              {[t("login.adminCap1"), t("login.adminCap2"), t("login.adminCap3"), t("login.adminCap4")].map((text) => (
                <div key={text} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[12px] text-[#7a9ab5]">{text}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-[#1a3a58] border border-[#2a5070] px-3.5 py-2.5">
              <p className="text-[11px] text-[#5a7a96] mb-1">{t("login.adminEnv")}</p>
              <p className="text-[12px] text-[#9ab0c8] font-mono">https://admin.notariale.com</p>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-card p-10 flex flex-col justify-center">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-base font-medium text-foreground">{t("login.adminTitle")}</p>
                <p className="text-[12px] text-muted-foreground">{t("login.adminSubtitle")}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-3 py-2.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="text-[12px] text-amber-700 dark:text-amber-300 leading-snug">{t("login.adminSecurityAlert")}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("login.adminEmail")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="admin@notariale.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("login.password")}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="text-right">
                <button onClick={() => navigate("/forgot-password?portal=admin")} className="text-xs text-primary hover:underline">{t("login.forgotPassword")}</button>
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{t("login.admin2FA")}</span>
                <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">{t("login.admin2FARequired")}</span>
              </div>
              <Input type="text" placeholder="000 000" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="font-mono text-lg text-center tracking-[0.2em]" />
              <p className="text-[11px] text-muted-foreground">{t("login.admin2FADesc")}</p>
            </div>
            <Button className="w-full bg-[#0C1F35] hover:bg-[#162d47] text-white font-medium h-11" onClick={() => navigate("/admin/dashboard")}>
              {t("login.adminAccess")}
            </Button>
          </div>

          <div className="h-px bg-border my-5" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-muted-foreground">{t("login.adminSecure")}</span>
            </div>
            <span className="text-[11px] text-muted-foreground/60">JWT · Bcrypt · RBAC</span>
          </div>
          <div className="mt-4 border-l-2 border-border pl-3 py-2 bg-muted/30 rounded-r-lg">
            <span className="text-[11px] text-muted-foreground">{t("login.adminFooter")}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
