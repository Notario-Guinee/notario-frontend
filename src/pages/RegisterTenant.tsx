// ═══════════════════════════════════════════════════════════════
// Page Inscription Tenant — Création d'un nouveau cabinet notarial
// POST /api/auth/register
// Design cohérent avec LoginTenant.tsx
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User, Building2, Phone, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { apiClient } from "@/lib/apiClient";

interface RegisterPayload {
  nomCabinet: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterTenant() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const fr = lang === "FR";

  const [form, setForm] = useState<RegisterPayload>({
    nomCabinet: "",
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
  const [success, setSuccess] = useState(false);

  const update = (field: keyof RegisterPayload, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.nomCabinet || !form.nom || !form.prenom || !form.email || !form.password) {
      setError(fr ? "Veuillez remplir tous les champs obligatoires" : "Please fill in all required fields");
      return;
    }
    if (form.password.length < 8) {
      setError(fr ? "Le mot de passe doit contenir au moins 8 caractères" : "Password must be at least 8 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(fr ? "Les mots de passe ne correspondent pas" : "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/api/auth/register", {
        nomCabinet: form.nomCabinet,
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        telephone: form.telephone || undefined,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setSuccess(true);
      toast.success(fr ? "Inscription réussie ! Vérifiez votre email." : "Registration successful! Check your email.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (fr ? "Erreur lors de l'inscription" : "Registration error"));
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
        className="w-full max-w-[920px] grid grid-cols-1 md:grid-cols-2 rounded-2xl border border-border overflow-hidden shadow-xl"
      >
        {/* Left Panel */}
        <div className="bg-[#1a2e42] p-10 flex flex-col justify-between min-h-[600px] relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white font-bold text-lg shadow-lg">N</div>
              <div>
                <p className="text-white font-medium text-[15px]">Notario</p>
                <p className="text-white/50 text-[11px]">
                  {fr ? "Plateforme notariale SaaS" : "Notarial SaaS Platform"}
                </p>
              </div>
            </div>
            <h2 className="text-white text-[22px] font-medium leading-snug mb-3">
              {fr ? "Créez votre\ncabinet en ligne" : "Create your\nonline office"}
            </h2>
            <p className="text-white/50 text-[13px] leading-relaxed">
              {fr
                ? "Inscrivez-vous pour accéder à la plateforme de gestion notariale la plus moderne d'Afrique."
                : "Register to access the most modern notarial management platform in Africa."}
            </p>
          </div>
          <div className="relative z-10 space-y-2.5 mt-8">
            <div className="h-px bg-white/10 mb-6" />
            {[
              fr ? "Gestion complète des dossiers et actes" : "Complete case and deed management",
              fr ? "Facturation et comptabilité intégrées" : "Integrated billing and accounting",
              fr ? "Archivage numérique sécurisé" : "Secure digital archiving",
            ].map((text) => (
              <div key={text} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-white/50 text-[12px]">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-card p-8 flex flex-col justify-center">
          {!success ? (
            <>
              <div className="mb-5">
                <h3 className="text-lg font-medium text-foreground mb-1">
                  {fr ? "Créer un compte" : "Create an account"}
                </h3>
                <p className="text-[13px] text-muted-foreground">
                  {fr ? "Renseignez les informations de votre cabinet" : "Enter your office information"}
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3">
                {/* Nom du cabinet */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {fr ? "Nom du cabinet" : "Office name"} *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={fr ? "Cabinet Maître Dupont" : "Law Office Name"}
                      value={form.nomCabinet}
                      onChange={(e) => update("nomCabinet", e.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Nom + Prénom */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {fr ? "Nom" : "Last name"} *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={fr ? "Dupont" : "Doe"}
                        value={form.nom}
                        onChange={(e) => update("nom", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {fr ? "Prénom" : "First name"} *
                    </label>
                    <Input
                      placeholder={fr ? "Jean" : "John"}
                      value={form.prenom}
                      onChange={(e) => update("prenom", e.target.value)}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="contact@cabinet.com"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Téléphone */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {fr ? "Téléphone" : "Phone"} ({fr ? "optionnel" : "optional"})
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="+224 6XX XX XX XX"
                      value={form.telephone}
                      onChange={(e) => update("telephone", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Mot de passe + Confirmation */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {fr ? "Mot de passe" : "Password"} *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {fr ? "Confirmer" : "Confirm"} *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={(e) => update("confirmPassword", e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="text-red-500 text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-[#1a2e42] hover:bg-[#243d56] text-white font-medium h-11"
                  disabled={loading}
                >
                  {loading
                    ? (fr ? "Inscription en cours..." : "Registering...")
                    : (fr ? "Créer mon cabinet" : "Create my office")}
                </Button>
              </form>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] text-muted-foreground">{fr ? "ou" : "or"}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="text-center text-xs text-muted-foreground">
                <p>
                  {fr ? "Vous avez déjà un compte ?" : "Already have an account?"}{" "}
                  <button onClick={() => navigate("/login")} className="text-primary hover:underline font-medium">
                    {fr ? "Se connecter" : "Sign in"}
                  </button>
                </p>
              </div>

              <div className="mt-4 rounded-lg bg-muted/50 px-3.5 py-2.5 flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[11px] text-muted-foreground">
                  {fr ? "Inscription sécurisée — Données chiffrées" : "Secure registration — Encrypted data"}
                </span>
              </div>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {fr ? "Inscription réussie !" : "Registration successful!"}
              </h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-1">
                {fr
                  ? "Un email de confirmation a été envoyé à "
                  : "A confirmation email has been sent to "}
                <strong className="text-foreground">{form.email}</strong>
              </p>
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
                {fr
                  ? "Veuillez cliquer sur le lien de votre email pour activer votre compte."
                  : "Please click the link in your email to activate your account."}
              </p>
              <Button onClick={() => navigate("/login")} className="bg-[#1a2e42] hover:bg-[#243d56] text-white font-medium">
                {fr ? "Aller à la connexion" : "Go to login"}
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
