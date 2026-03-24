import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User, Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function RegisterTenant() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const cabinetName = "Cabinet Maître Sylla";
  const subdomain = "sylla.notariale.com";

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Règles de validation du mot de passe — basées exactement sur le backend
  const passwordChecks = [
    { label: "8 caractères minimum", valid: form.password.length >= 8 },
    { label: "1 majuscule", valid: /[A-Z]/.test(form.password) },
    { label: "1 minuscule", valid: /[a-z]/.test(form.password) },
    { label: "1 chiffre", valid: /\d/.test(form.password) },
    { label: "1 caractère spécial (@$!%*?&)", valid: /[@$!%*?&]/.test(form.password) },
  ];
  const passwordValid = passwordChecks.every((c) => c.valid);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError("");
  };

  // Appel réel à POST /api/auth/register
  const handleRegister = async () => {
    if (!form.nom || !form.prenom || !form.email || !form.password || !form.confirmPassword) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }
    if (!passwordValid) {
      setError("Le mot de passe ne respecte pas les critères de sécurité");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          telephone: form.telephone || undefined,
          password: form.password,
          confirmPassword: form.confirmPassword,
          role: "STANDARD",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        // Affiche le premier message d'erreur de validation retourné par le backend
        const firstError = data.errorDetails
          ? Object.values(data.errorDetails)[0]
          : data.message;
        throw new Error(firstError as string);
      }

      // Inscription réussie — redirige vers le login
      navigate("/login?registered=true");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
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
        {/* Left Panel — même style que LoginTenant */}
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
            <h2 className="text-white text-[22px] font-medium leading-snug mb-3">
              Créez votre compte
            </h2>
            <p className="text-[#8ba5be] text-[13px] leading-relaxed">
              Rejoignez votre cabinet notarial et accédez à tous les outils de gestion.
            </p>
          </div>
          <div className="relative z-10 space-y-2.5 mt-8">
            <div className="h-px bg-[#2a4560] mb-6" />
            {["Accès sécurisé à vos dossiers", "Gestion complète des actes", "Collaboration en temps réel"].map((text) => (
              <div key={text} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-[#8ba5be] text-[12px]">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-card p-8 flex flex-col justify-center overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-foreground mb-1">Créer un compte</h3>
            <p className="text-[13px] text-muted-foreground">Remplissez les informations ci-dessous</p>
          </div>

          <div className="space-y-3">
            {/* Nom et Prénom */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nom <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Diallo" value={form.nom} onChange={handleChange("nom")} className="pl-10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Prénom <span className="text-red-500">*</span></label>
                <Input placeholder="Mamadou" value={form.prenom} onChange={handleChange("prenom")} />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="mamadou@cabinet.com" value={form.email} onChange={handleChange("email")} className="pl-10" />
              </div>
            </div>

            {/* Téléphone — optionnel */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Téléphone <span className="text-muted-foreground/50">(optionnel)</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="+224 620 00 00 00" value={form.telephone} onChange={handleChange("telephone")} className="pl-10" />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Mot de passe <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange("password")}
                  className="pl-10 pr-10"
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Indicateurs de force du mot de passe */}
              {form.password && (
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {passwordChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2 className={`h-3 w-3 ${check.valid ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                      <span className={check.valid ? "text-foreground" : "text-muted-foreground"}>{check.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Confirmer le mot de passe <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  className="pl-10 pr-10"
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
                <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Alerte si les mots de passe ne correspondent pas */}
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            {/* Message d'erreur global */}
            {error && (
              <div className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button
              className="w-full bg-[#1a2e42] hover:bg-[#243d56] text-white font-medium h-11"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? "Inscription en cours..." : "Créer mon compte"}
            </Button>
          </div>

          {/* Lien vers le login */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <button onClick={() => navigate("/login")} className="text-primary hover:underline font-medium">
              Se connecter
            </button>
          </p>

          <div className="mt-4 rounded-lg bg-muted/50 px-3.5 py-2.5 flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[11px] text-muted-foreground">
              Espace : <strong className="text-foreground">{subdomain}</strong>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
