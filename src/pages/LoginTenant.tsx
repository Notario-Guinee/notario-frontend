import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/context/AuthContext";

export default function LoginTenant() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cabinetName = "Cabinet Maître Sylla";
  const subdomain = "sylla.notariale.com";

  // Appel réel au backend — remplace l'ancien navigate("/dashboard") direct
  const handleLogin = async () => {
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="bg-[#1a2e42] p-10 flex flex-col justify-between min-h-[540px] relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-[#2AA3D6] flex items-center justify-center text-white font-bold text-lg shadow-lg">N</div>
              <div>
                <p className="text-white font-medium text-[15px]">{cabinetName}</p>
                <p className="text-[#8ba5be] text-[11px]">{subdomain}</p>
              </div>
            </div>
            <h2 className="text-white text-[22px] font-medium leading-snug mb-3 whitespace-pre-line">{t("login.tenantWelcome")}</h2>
            <p className="text-[#8ba5be] text-[13px] leading-relaxed">{t("login.tenantDesc")}</p>
          </div>
          <div className="relative z-10 space-y-2.5 mt-8">
            <div className="h-px bg-[#2a4560] mb-6" />
            {[t("login.tenantSec1"), t("login.tenantSec2"), t("login.tenantSec3")].map((text) => (
              <div key={text} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-[#8ba5be] text-[12px]">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-card p-10 flex flex-col justify-center">
          <div className="mb-7">
            <h3 className="text-lg font-medium text-foreground mb-1">{t("login.tenantLogin")}</h3>
            <p className="text-[13px] text-muted-foreground">{t("login.tenantIdentifier")}</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("login.tenantEmailLabel")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder={t("login.tenantEmailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("login.password")}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Message d'erreur affiché si le login échoue */}
            {error && (
              <div className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="text-right">
              <button onClick={() => navigate("/forgot-password?portal=tenant")} className="text-xs text-primary hover:underline">{t("login.forgotPassword")}</button>
            </div>
            <Button
              className="w-full bg-[#1a2e42] hover:bg-[#243d56] text-white font-medium h-11"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Connexion en cours..." : t("login.tenantSubmit")}
            </Button>
          </div>
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground">{t("login.tenantOr")}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {t("login.tenantClientLink")}{" "}
            <button onClick={() => navigate("/client/login")} className="text-primary hover:underline font-medium">{t("login.tenantClientAccess")}</button>
          </p>
          <div className="mt-6 rounded-lg bg-muted/50 px-3.5 py-2.5 flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[11px] text-muted-foreground">
              {t("login.tenantSpace")} : <strong className="text-foreground">{subdomain}</strong>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
