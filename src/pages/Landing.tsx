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
import { useLanguage } from "@/context/LanguageContext";

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    { icon: Users, title: t("landing.feat.clients.title"), desc: t("landing.feat.clients.desc") },
    { icon: FolderOpen, title: t("landing.feat.dossiers.title"), desc: t("landing.feat.dossiers.desc") },
    { icon: Receipt, title: t("landing.feat.facturation.title"), desc: t("landing.feat.facturation.desc") },
    { icon: BarChart3, title: t("landing.feat.synthese.title"), desc: t("landing.feat.synthese.desc") },
    { icon: Calendar, title: t("landing.feat.agenda.title"), desc: t("landing.feat.agenda.desc") },
    { icon: Shield, title: t("landing.feat.securite.title"), desc: t("landing.feat.securite.desc") },
    { icon: MessageSquare, title: t("landing.feat.messagerie.title"), desc: t("landing.feat.messagerie.desc") },
    { icon: Globe, title: t("landing.feat.portail.title"), desc: t("landing.feat.portail.desc") },
    { icon: HardDrive, title: t("landing.feat.archives.title"), desc: t("landing.feat.archives.desc") },
  ];

  const plans = [
    {
      nameKey: "landing.plan.basic.name",
      price: "500 000",
      featKeys: ["landing.plan.basic.feat1", "landing.plan.basic.feat2", "landing.plan.basic.feat3", "landing.plan.basic.feat4", "landing.plan.basic.feat5"],
    },
    {
      nameKey: "landing.plan.standard.name",
      price: "1 200 000",
      popular: true,
      featKeys: ["landing.plan.standard.feat1", "landing.plan.standard.feat2", "landing.plan.standard.feat3", "landing.plan.standard.feat4", "landing.plan.standard.feat5", "landing.plan.standard.feat6"],
    },
    {
      nameKey: "landing.plan.premium.name",
      price: "2 500 000",
      featKeys: ["landing.plan.premium.feat1", "landing.plan.premium.feat2", "landing.plan.premium.feat3", "landing.plan.premium.feat4", "landing.plan.premium.feat5", "landing.plan.premium.feat6", "landing.plan.premium.feat7"],
    },
  ];

  const faqs = [
    { qKey: "landing.faq1.q", aKey: "landing.faq1.a" },
    { qKey: "landing.faq2.q", aKey: "landing.faq2.a" },
    { qKey: "landing.faq3.q", aKey: "landing.faq3.a" },
    { qKey: "landing.faq4.q", aKey: "landing.faq4.a" },
  ];

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
            <a href="#features" className="hover:text-foreground transition-colors">{t("landing.navFeatures")}</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">{t("landing.navPricing")}</a>
            <a href="#faq" className="hover:text-foreground transition-colors">{t("landing.navFaq")}</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>{t("landing.navLogin")}</Button>
            <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
              {t("landing.navDemo")}
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
            <Star className="h-3 w-3" /> {t("landing.heroBadge")}
          </div>
          <h1 className="font-heading text-4xl font-extrabold text-foreground sm:text-5xl lg:text-6xl leading-tight">
            {t("landing.heroTitle")} <span className="text-gradient-blue">{t("landing.heroTitleHighlight")}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            {t("landing.heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="bg-primary text-primary-foreground font-semibold text-base px-8 hover:bg-primary/90" onClick={() => navigate("/dashboard")}>
              {t("landing.heroCta")} <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/dashboard")}>
              {t("landing.heroExplore")}
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl font-bold text-foreground">{t("landing.featuresTitle")}</h2>
            <p className="mt-3 text-muted-foreground">{t("landing.featuresSubtitle")}</p>
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
            <h2 className="font-heading text-3xl font-bold text-foreground">{t("landing.pricingTitle")}</h2>
            <p className="mt-3 text-muted-foreground">{t("landing.pricingSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <motion.div
                key={plan.nameKey}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`rounded-xl border p-6 ${plan.popular ? "border-primary bg-primary/5 shadow-glow-blue" : "border-border bg-card"}`}
              >
                {plan.popular && (
                  <span className="inline-block rounded-full bg-primary/15 px-3 py-1 text-[10px] font-bold text-primary uppercase tracking-wider mb-3">
                    {t("landing.pricingPopular")}
                  </span>
                )}
                <h3 className="font-heading text-lg font-bold text-foreground">{t(plan.nameKey)}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-heading text-3xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{t("landing.pricingPerMonth")}</span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {plan.featKeys.map((fk) => (
                    <li key={fk} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      {t(fk)}
                    </li>
                  ))}
                </ul>
                <Button className={`mt-6 w-full ${plan.popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`} variant={plan.popular ? "default" : "outline"}>
                  {t("landing.pricingCta")}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-heading text-3xl font-bold text-foreground text-center mb-10">{t("landing.faqTitle")}</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-4 text-left text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
                >
                  {t(faq.qKey)}
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-90" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground">{t(faq.aKey)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground">{t("landing.ctaTitle")}</h2>
          <p className="mt-3 text-muted-foreground">{t("landing.ctaSubtitle")}</p>
          <Button size="lg" className="mt-8 bg-primary text-primary-foreground font-semibold text-base px-8 hover:bg-primary/90">
            {t("landing.ctaBtn")} <ChevronRight className="ml-1 h-4 w-4" />
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
          <p className="text-xs text-muted-foreground">{t("landing.footerRights")}</p>
        </div>
      </footer>
    </div>
  );
}
