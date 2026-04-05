// ═══════════════════════════════════════════════════════════════
// Page ActivationCompte — Vérification d'email / activation
//
// Accessible via /activer?token=<TOKEN_UNIQUE>
// Étapes :
//  1. Montage → POST /api/auth/verify-email?token=...
//  2. Si erreur → état "error"
//  3. Si succès → état "success" + bouton vers /login
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  UserCheck, AlertTriangle, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { apiClient } from "@/lib/apiClient";

// ─────────────────────────────────────────────────────────────────────────────

type Phase = "loading" | "error" | "success";

export default function ActivationCompte() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Lecture du token depuis l'URL (?token=...)
  const token = searchParams.get("token") ?? "";

  // ── Phase globale du flux ─────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("loading");

  // ── Vérification et activation du compte au montage ───────────────────────
  useEffect(() => {
    if (!token) {
      setPhase("error");
      return;
    }
    apiClient
      .post(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => {
        setPhase("success");
        toast.success("Votre compte a été activé avec succès !");
      })
      .catch(() => {
        setPhase("error");
      });
  }, [token]);

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
            <h1 className="text-2xl font-bold text-white">Activation de votre compte</h1>
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
                  Vérification du lien d'activation…
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
                  Lien invalide ou expiré
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Ce lien d'activation n'est plus valide. Il a peut-être déjà été
                  utilisé ou a expiré. Contactez votre administrateur pour en recevoir
                  un nouveau.
                </p>
                <Button variant="outline" onClick={() => navigate("/login")}>
                  Retour à la connexion
                </Button>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════
                État 3 : Succès — compte activé
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
                <h2 className="text-lg font-semibold text-foreground">Compte activé !</h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Votre compte a été activé avec succès. Vous pouvez maintenant vous
                  connecter avec votre nouveau mot de passe.
                </p>
                <Button
                  onClick={() => navigate("/login")}
                  className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Se connecter
                </Button>
              </motion.div>
            )}

          </div>
        </div>
      </motion.div>
    </div>
  );
}
