// ═══════════════════════════════════════════════════════════════
// Page Landing — Page d'accueil publique de la plateforme
// Présente les fonctionnalités de Notario aux prospects avec
// appels à l'action vers la connexion et l'inscription
// ═══════════════════════════════════════════════════════════════

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Scale, Users, FolderOpen, Receipt, BarChart3, Shield, Globe,
  Calendar, MessageSquare, HardDrive, ChevronRight, Check, Star,
} from "lucide-react";
import { useState } from "react";

const features = [
  { icon: Users, title: "Gestion Clients", desc: "Fiches clients complètes, personnes physiques et morales" },
  { icon: FolderOpen, title: "Dossiers & Actes", desc: "Suivi des actes notariaux avec workflow visuel" },
  { icon: Receipt, title: "Facturation", desc: "Création, suivi et relance de factures en GNF" },
  { icon: BarChart3, title: "Synthèse Financière", desc: "Tableaux de bord financiers et rapports détaillés" },
  { icon: Calendar, title: "Agenda", desc: "Planification de rendez-vous et gestion du calendrier" },
  { icon: Shield, title: "Sécurité & Audit", desc: "Journal d'audit complet et gestion des rôles" },
  { icon: MessageSquare, title: "Messagerie", desc: "Communication interne et notifications en temps réel" },
  { icon: Globe, title: "Portail Client", desc: "Accès sécurisé pour vos clients à leurs documents" },
  { icon: HardDrive, title: "Archives OCR", desc: "Numérisation et indexation intelligente des documents" },
];

const plans = [
  { name: "Basique", price: "500 000", features: ["3 utilisateurs", "5 Go stockage", "Gestion clients", "Dossiers & Actes", "Facturation"] },
  { name: "Standard", price: "1 200 000", popular: true, features: ["10 utilisateurs", "20 Go stockage", "Tous modules métier", "Messagerie interne", "Portail client", "Support prioritaire"] },
  { name: "Premium", price: "2 500 000", features: ["Utilisateurs illimités", "100 Go stockage", "Tous modules", "API & intégrations", "Support dédié", "Formation incluse", "Multi-cabinets"] },
];

const faqs = [
  { q: "Comment démarrer avec Notario ?", a: "Demandez une démo gratuite, nous configurons votre cabinet en 24h. Vos données sont importées et votre équipe formée." },
  { q: "Mes données sont-elles sécurisées ?", a: "Vos données sont chiffrées, hébergées en conformité avec les réglementations locales, avec sauvegardes quotidiennes automatiques." },
  { q: "Puis-je utiliser Notario hors ligne ?", a: "Notario fonctionne en mode hors ligne avec synchronisation automatique dès le retour de la connexion." },
  { q: "Comment sont calculés les tarifs notariaux ?", a: "Notre moteur de tarifs intègre les barèmes officiels guinéens et calcule automatiquement les droits, taxes et honoraires." },
];

export default function Landing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Scale className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">Notario</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>Connexion</Button>
            <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
              Demander une démo
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(211_55%_48%/0.08),transparent_60%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-3xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <Star className="h-3 w-3" /> Plateforme #1 pour notaires en Guinée
          </div>
          <h1 className="font-heading text-4xl font-extrabold text-foreground sm:text-5xl lg:text-6xl leading-tight">
            Gérez votre étude notariale avec <span className="text-gradient-blue">excellence</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Solution SaaS complète pour les cabinets de notaires : dossiers, clients, facturation, archives et bien plus. Sécurisé, moderne, fait pour la Guinée.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="bg-primary text-primary-foreground font-semibold text-base px-8 hover:bg-primary/90" onClick={() => navigate("/dashboard")}>
              Demander une démo <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/dashboard")}>
              Découvrir la plateforme
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl font-bold text-foreground">Tout ce qu'il vous faut, en un seul endroit</h2>
            <p className="mt-3 text-muted-foreground">Des modules métiers conçus spécifiquement pour le notariat guinéen</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-6 hover:shadow-glow-blue/30 transition-all group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-heading text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-card/50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl font-bold text-foreground">Tarifs simples et transparents</h2>
            <p className="mt-3 text-muted-foreground">Prix mensuel par cabinet, en Francs Guinéens (GNF)</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`rounded-xl border p-6 ${plan.popular ? "border-primary bg-primary/5 shadow-glow-blue" : "border-border bg-card"}`}
              >
                {plan.popular && (
                  <span className="inline-block rounded-full bg-primary/15 px-3 py-1 text-[10px] font-bold text-primary uppercase tracking-wider mb-3">
                    Populaire
                  </span>
                )}
                <h3 className="font-heading text-lg font-bold text-foreground">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-heading text-3xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">GNF/mois</span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className={`mt-6 w-full ${plan.popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`} variant={plan.popular ? "default" : "outline"}>
                  Commencer
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-heading text-3xl font-bold text-foreground text-center mb-10">Questions fréquentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-4 text-left text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
                >
                  {faq.q}
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-90" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground">Prêt à moderniser votre étude ?</h2>
          <p className="mt-3 text-muted-foreground">Rejoignez les cabinets qui font confiance à Notario</p>
          <Button size="lg" className="mt-8 bg-primary text-primary-foreground font-semibold text-base px-8 hover:bg-primary/90">
            Demander une démo gratuite <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Scale className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-heading text-sm font-bold text-foreground">Notario</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Notario. Tous droits réservés. Conakry, Guinée.</p>
        </div>
      </footer>
    </div>
  );
}
