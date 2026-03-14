// ═══════════════════════════════════════════════════════════════
// Page d'inscription client — Formulaire public accessible via
// un lien envoyé par le cabinet pour créer un compte espace client
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus, CheckCircle, Shield, FileText, MessageSquare } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

export default function InscriptionClient() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const cabinetName = searchParams.get("cabinet") || "Cabinet Maître Sylla";
  const fr = lang === "FR";

  const [form, setForm] = useState({
    prenom: "", nom: "", email: "", telephone: "", adresse: "",
    password: "", confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const passwordChecks = [
    { label: fr ? "8 caractères minimum" : "8 characters minimum", valid: form.password.length >= 8 },
    { label: fr ? "Une majuscule" : "One uppercase letter", valid: /[A-Z]/.test(form.password) },
    { label: fr ? "Une minuscule" : "One lowercase letter", valid: /[a-z]/.test(form.password) },
    { label: fr ? "Un chiffre" : "One number", valid: /[0-9]/.test(form.password) },
    { label: fr ? "Un caractère spécial" : "One special character", valid: /[^A-Za-z0-9]/.test(form.password) },
  ];
  const allValid = passwordChecks.every(c => c.valid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.prenom || !form.nom || !form.email || !form.telephone || !form.password) {
      toast.error(fr ? "Veuillez remplir tous les champs obligatoires" : "Please fill in all required fields");
      return;
    }
    if (!allValid) {
      toast.error(fr ? "Le mot de passe ne respecte pas les critères" : "Password does not meet requirements");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error(fr ? "Les mots de passe ne correspondent pas" : "Passwords do not match");
      return;
    }
    // TODO: appel API réel
    setSubmitted(true);
    toast.success(fr ? "Compte créé avec succès !" : "Account created successfully!");
  };

  const features = [
    { icon: FileText, label: fr ? "Suivez vos dossiers en temps réel" : "Track your cases in real time" },
    { icon: Shield, label: fr ? "Documents sécurisés et accessibles" : "Secure and accessible documents" },
    { icon: MessageSquare, label: fr ? "Communication directe avec le cabinet" : "Direct communication with the office" },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B6B93]/10 via-background to-[#1B6B93]/5 p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{fr ? "Compte créé avec succès !" : "Account created successfully!"}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {fr ? "Vous pouvez maintenant vous connecter à votre espace client pour suivre vos dossiers et communiquer avec votre cabinet." : "You can now log in to your client portal to track your cases and communicate with your office."}
          </p>
          <Button onClick={() => navigate("/client/login")} className="w-full bg-[#1B6B93] hover:bg-[#155A7A]">
            {fr ? "Accéder à la connexion" : "Go to login"}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B6B93]/10 via-background to-[#1B6B93]/5 p-4">
      <div className="absolute top-4 right-4"><LanguageSwitcher /></div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card border border-border rounded-2xl shadow-xl max-w-4xl w-full overflow-hidden grid grid-cols-1 md:grid-cols-5">
        {/* Left panel */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#1B6B93] to-[#134e6a] p-8 text-white flex flex-col justify-center">
          <h2 className="text-xl font-bold mb-2">{cabinetName}</h2>
          <p className="text-white/80 text-sm mb-6">{fr ? "Créez votre espace client pour accéder à vos dossiers notariaux" : "Create your client portal to access your notarial cases"}</p>
          <div className="space-y-4">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                <f.icon className="h-5 w-5 text-white/90 shrink-0" />
                <span className="text-sm text-white/90">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div className="md:col-span-3 p-8">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="h-5 w-5 text-[#1B6B93]" />
            <h1 className="text-xl font-bold text-foreground">{fr ? "Créer mon compte" : "Create my account"}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{fr ? "Prénom" : "First name"} *</Label>
                <Input value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} placeholder={fr ? "Votre prénom" : "Your first name"} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{fr ? "Nom" : "Last name"} *</Label>
                <Input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder={fr ? "Votre nom" : "Your last name"} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{fr ? "Adresse e-mail" : "Email address"} *</Label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@exemple.com" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{fr ? "Téléphone" : "Phone"} *</Label>
              <Input value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} placeholder="+224 6XX XX XX XX" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{fr ? "Adresse" : "Address"} ({fr ? "facultatif" : "optional"})</Label>
              <Input value={form.adresse} onChange={e => setForm(p => ({ ...p, adresse: e.target.value }))} placeholder={fr ? "Votre adresse" : "Your address"} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{fr ? "Mot de passe" : "Password"} *</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{fr ? "Confirmer le mot de passe" : "Confirm password"} *</Label>
              <div className="relative">
                <Input type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="••••••••" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {form.password && (
              <div className="grid grid-cols-2 gap-1.5">
                {passwordChecks.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <CheckCircle className={`h-3.5 w-3.5 ${c.valid ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                    <span className={c.valid ? "text-emerald-600" : "text-muted-foreground"}>{c.label}</span>
                  </div>
                ))}
              </div>
            )}

            <Button type="submit" className="w-full bg-[#1B6B93] hover:bg-[#155A7A]" disabled={!allValid || form.password !== form.confirmPassword || !form.prenom || !form.nom || !form.email}>
              <UserPlus className="h-4 w-4 mr-2" /> {fr ? "Créer mon compte" : "Create my account"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {fr ? "Déjà un compte ?" : "Already have an account?"}{" "}
              <button type="button" onClick={() => navigate("/client/login")} className="text-[#1B6B93] hover:underline font-medium">
                {fr ? "Se connecter" : "Log in"}
              </button>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
