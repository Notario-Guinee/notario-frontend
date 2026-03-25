// ═══════════════════════════════════════════════════════════════
// Page Admin Facturation — Gestion de la facturation SaaS
// Suivi des abonnements, génération des factures mensuelles aux
// tenants et envoi par email ou messagerie
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Receipt, Mail, MessageSquare, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const initialInvoices = [
  { id: "1", cabinet: "Étude Diallo & Associés", email: "diallo@notariale.gn", tel: "+224 622 00 11 22", modules: 10, montant: "2 500 000 GNF", date: "2026-03-01", statut: "Payée" },
  { id: "2", cabinet: "Cabinet Notarial Bah", email: "bah@notariale.gn", tel: "+224 625 33 44 55", modules: 5, montant: "1 200 000 GNF", date: "2026-03-01", statut: "Émise" },
  { id: "3", cabinet: "Étude Camara", email: "camara@notariale.gn", tel: "+224 628 66 77 88", modules: 6, montant: "1 500 000 GNF", date: "2026-03-01", statut: "Payée" },
  { id: "4", cabinet: "SN Condé", email: "conde@notariale.gn", tel: "+224 620 99 00 11", modules: 2, montant: "500 000 GNF", date: "2026-03-01", statut: "En retard" },
];

const statutColors: Record<string, string> = {
  Payée: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Émise: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "En retard": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export default function AdminBilling() {
  const { lang } = useLanguage();
  const fr = lang === "FR";
  const [relanceTarget, setRelanceTarget] = useState<typeof initialInvoices[0] | null>(null);
  const [relanceMode, setRelanceMode] = useState<"email" | "sms">("email");
  const [relanceMessage, setRelanceMessage] = useState("");

  const openRelance = (inv: typeof initialInvoices[0], mode: "email" | "sms") => {
    setRelanceTarget(inv);
    setRelanceMode(mode);
    setRelanceMessage(
      fr
        ? `Bonjour,\n\nNous vous informons que votre facture de ${inv.montant} du ${new Date(inv.date).toLocaleDateString("fr-FR")} est en retard de paiement.\n\nMerci de procéder au règlement dans les plus brefs délais.\n\nCordialement,\nL'équipe Notariale SaaS`
        : `Hello,\n\nThis is a reminder that your invoice of ${inv.montant} dated ${new Date(inv.date).toLocaleDateString("fr-FR")} is overdue.\n\nPlease proceed with payment at your earliest convenience.\n\nBest regards,\nNotariale SaaS Team`
    );
  };

  const sendRelance = () => {
    toast.success(
      fr
        ? `Relance envoyée par ${relanceMode === "email" ? "email" : "SMS"} à ${relanceTarget?.cabinet}`
        : `Reminder sent via ${relanceMode} to ${relanceTarget?.cabinet}`
    );
    setRelanceTarget(null);
    setRelanceMessage("");
  };

  const overdueInvoices = initialInvoices.filter(inv => inv.statut === "En retard");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Receipt className="h-5 w-5 text-primary" /></div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{fr ? "Facturation Plateforme" : "Platform Billing"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{fr ? "Factures automatiques mensuelles par cabinet" : "Automatic monthly invoices per office"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: fr ? "Total mensuel" : "Monthly total", v: "5 700 000 GNF" },
          { l: fr ? "Payées" : "Paid", v: "2" },
          { l: fr ? "En attente" : "Pending", v: "1" },
          { l: fr ? "En retard" : "Overdue", v: String(overdueInvoices.length) },
        ].map(s => (
          <div key={s.l} className="rounded-xl border border-border bg-card p-4 text-center shadow-card">
            <p className="font-heading text-xl font-bold text-foreground">{s.v}</p>
            <p className="text-xs text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-heading text-base font-semibold text-foreground">{fr ? "Factures du mois — Mars 2026" : "Invoices — March 2026"}</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Cabinet", fr ? "Modules actifs" : "Active modules", fr ? "Montant" : "Amount", "Date", fr ? "Statut" : "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initialInvoices.map((inv, i) => (
              <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{inv.cabinet}</td>
                <td className="px-4 py-3 text-sm text-foreground text-center">{inv.modules}</td>
                <td className="px-4 py-3 text-sm font-semibold text-foreground">{inv.montant}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(inv.date).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3"><span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", statutColors[inv.statut])}>{inv.statut}</span></td>
                <td className="px-4 py-3">
                  {inv.statut === "En retard" && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-primary hover:text-primary" onClick={() => openRelance(inv, "email")}>
                        <Mail className="h-3.5 w-3.5" /> Email
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-primary hover:text-primary" onClick={() => openRelance(inv, "sms")}>
                        <MessageSquare className="h-3.5 w-3.5" /> SMS
                      </Button>
                    </div>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Relance Dialog */}
      <Dialog open={!!relanceTarget} onOpenChange={o => !o && setRelanceTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {relanceMode === "email" ? <Mail className="h-5 w-5 text-primary" /> : <MessageSquare className="h-5 w-5 text-primary" />}
              {fr ? `Relance par ${relanceMode === "email" ? "email" : "SMS"}` : `Reminder via ${relanceMode}`}
            </DialogTitle>
            <DialogDescription>{relanceTarget?.cabinet}</DialogDescription>
          </DialogHeader>
          {relanceTarget && (
            <div className="space-y-4">
              <div>
                <Label>{fr ? "Destinataire" : "Recipient"}</Label>
                <Input value={relanceMode === "email" ? relanceTarget.email : relanceTarget.tel} readOnly className="mt-1 font-mono text-sm" />
              </div>
              <div>
                <Label>{fr ? "Message" : "Message"}</Label>
                <textarea
                  value={relanceMessage}
                  onChange={e => setRelanceMessage(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground min-h-[140px] resize-y"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRelanceTarget(null)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2" onClick={sendRelance}>
              <Send className="h-4 w-4" /> {fr ? "Envoyer la relance" : "Send reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
