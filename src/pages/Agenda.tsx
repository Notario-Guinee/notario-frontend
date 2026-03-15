// ═══════════════════════════════════════════════════════════════
// Page Agenda — Gestion des rendez-vous du cabinet
// Inclut : vues semaine/mois/jour/liste, création de RDV,
// rappels de notification, détail modal par rendez-vous
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Clock, MapPin, User, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { mockClients } from "@/data/mockData";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

type ViewMode = "mois" | "semaine" | "jour" | "liste";

type RDV = {
  id: string; heure: string; titre: string; client: string; lieu: string;
  duree: string; statut: string; date: string; description?: string; rappel?: string;
};

const initialRdvData: RDV[] = [
  { id: "1", heure: "09:00", titre: "Consultation Camara Fatoumata", client: "Camara Fatoumata", lieu: "Bureau 1", duree: "1h", statut: "Confirmé", date: "2026-03-09" },
  { id: "2", heure: "11:00", titre: "Signature acte DOS-2026-002", client: "SCI Les Palmiers", lieu: "Salle de conférence", duree: "30min", statut: "Confirmé", date: "2026-03-09" },
  { id: "3", heure: "14:30", titre: "Consultation Bah Ibrahima", client: "Bah Ibrahima", lieu: "Bureau 2", duree: "45min", statut: "En attente", date: "2026-03-09" },
  { id: "4", heure: "16:00", titre: "Réunion équipe hebdo", client: "Équipe", lieu: "Salle de conférence", duree: "1h", statut: "Confirmé", date: "2026-03-09" },
  { id: "5", heure: "10:00", titre: "RDV Soumah Aissatou", client: "Soumah Aissatou", lieu: "Bureau 1", duree: "45min", statut: "Confirmé", date: "2026-03-10" },
  { id: "6", heure: "15:00", titre: "Signature DOS-2026-004", client: "Condé Mariama", lieu: "Salle de conférence", duree: "1h", statut: "Annulé", date: "2026-03-11" },
  { id: "7", heure: "09:30", titre: "Consultation Barry Ousmane", client: "Barry Ousmane", lieu: "Bureau 2", duree: "30min", statut: "En attente", date: "2026-03-12" },
];

const statusColorMap: Record<string, string> = {
  "Confirmé": "bg-success/15 border-l-2 border-l-success",
  "Annulé": "bg-destructive/15 border-l-2 border-l-destructive",
  "En attente": "bg-primary/10 border-l-2 border-l-primary",
};

const hours = Array.from({ length: 9 }, (_, i) => `${i + 8}:00`);

export default function Agenda() {
  const { t, lang } = useLanguage();
  const [rdvData, setRdvData] = useState<RDV[]>(initialRdvData);
  const [view, setView] = useState<ViewMode>("semaine");
  const [selectedRdv, setSelectedRdv] = useState<RDV | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const today = new Date();

  // Dynamic day names based on language
  const days = [
    t("agenda.days.mon"),
    t("agenda.days.tue"),
    t("agenda.days.wed"),
    t("agenda.days.thu"),
    t("agenda.days.fri"),
    t("agenda.days.sat"),
    t("agenda.days.sun"),
  ];

  // Dynamic view mode labels
  const viewLabels: Record<ViewMode, string> = {
    jour: t("agenda.day"),
    semaine: t("agenda.week"),
    mois: t("agenda.month"),
    liste: t("agenda.list"),
  };

  // Dynamic location options
  const lieux = [
    t("agenda.lieu.bureau1"),
    t("agenda.lieu.bureau2"),
    t("agenda.lieu.salle"),
    t("agenda.lieu.exterieur"),
  ];

  // Internal lieu values (always French keys stored in data)
  const lieuValues = ["Bureau 1", "Bureau 2", "Salle de conférence", "Extérieur"];

  const durees = ["15min", "30min", "45min", "1h", "1h30", "2h"];

  // Dynamic reminder options
  const rappelOptions = [
    { value: "15 minutes avant", label: t("agenda.rappel.15min") },
    { value: "30 minutes avant", label: t("agenda.rappel.30min") },
    { value: "1 heure avant", label: t("agenda.rappel.1h") },
    { value: "2 heures avant", label: t("agenda.rappel.2h") },
    { value: "1 jour avant", label: t("agenda.rappel.1j") },
  ];

  const [form, setForm] = useState({
    titre: "", client: "", lieu: "Bureau 1", date: "", heure: "09:00",
    duree: "1h", description: "", rappel: "30 minutes avant",
  });

  const resetForm = () => setForm({ titre: "", client: "", lieu: "Bureau 1", date: "", heure: "09:00", duree: "1h", description: "", rappel: "30 minutes avant" });

  const handleCreate = () => {
    const newRdv: RDV = {
      id: String(Date.now()), heure: form.heure, titre: form.titre || `RDV ${form.client}`,
      client: form.client, lieu: form.lieu, duree: form.duree,
      statut: "Confirmé", date: form.date, description: form.description, rappel: form.rappel,
    };
    setRdvData(prev => [...prev, newRdv]);
    setShowCreateModal(false);
    resetForm();
    toast.success(t("agenda.toast.created"));
    if (form.rappel) {
      const rappelLabel = rappelOptions.find(r => r.value === form.rappel)?.label || form.rappel;
      toast.info(`🔔 ${t("agenda.toast.reminder")} ${rappelLabel}`, { duration: 4000 });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-xl font-bold text-foreground">{t("agenda.pageTitle")}</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg bg-muted p-1">
            {(["jour", "semaine", "mois", "liste"] as ViewMode[]).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {viewLabels[v]}
              </button>
            ))}
          </div>
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <Plus className="mr-1 h-4 w-4" /> {t("agenda.newRdv")}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button className="rounded-lg p-2 hover:bg-muted transition-colors"><ChevronLeft className="h-4 w-4 text-muted-foreground" /></button>
        <h2 className="font-heading text-base font-semibold text-foreground">
          {today.toLocaleDateString(lang === "EN" ? "en-GB" : "fr-FR", { month: "long", year: "numeric" })}
        </h2>
        <button className="rounded-lg p-2 hover:bg-muted transition-colors"><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>
        <button className="ml-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">{t("agenda.today")}</button>
      </div>

      {/* Calendar Grid (Semaine view) */}
      {view === "semaine" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
          <div className="grid border-b border-border" style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}>
            <div className="border-r border-border" />
            {days.map((d, i) => (
              <div key={d} className={`border-r border-border last:border-0 p-3 text-center ${i === 0 ? "bg-primary/5" : ""}`}>
                <p className="text-xs font-semibold text-muted-foreground">{d}</p>
                <p className={`font-heading text-base font-bold mt-0.5 ${i === 0 ? "text-primary" : "text-foreground"}`}>{9 + i}</p>
              </div>
            ))}
          </div>
          <div className="overflow-y-auto max-h-[480px] scrollbar-thin">
            {hours.map((h) => (
              <div key={h} className="grid border-b border-border last:border-0" style={{ gridTemplateColumns: "64px repeat(7, 1fr)", minHeight: "64px" }}>
                <div className="border-r border-border p-2 text-right">
                  <span className="text-[10px] text-muted-foreground">{h}</span>
                </div>
                {days.map((d, di) => {
                  const slot = rdvData.find(r => r.heure === h && parseInt(r.date.split('-')[2]) === 9 + di);
                  return (
                    <div key={d} className="border-r border-border last:border-0 p-1 relative group hover:bg-muted/20 transition-colors cursor-pointer">
                      {slot && (
                        <div onClick={() => setSelectedRdv(slot)}
                          className={`rounded-md p-2 text-xs cursor-pointer hover:opacity-90 transition-opacity ${statusColorMap[slot.statut] || "bg-muted"}`}>
                          <p className="font-semibold text-foreground truncate">{slot.titre}</p>
                          <p className="text-muted-foreground">{slot.heure} · {slot.duree}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste view */}
      {view === "liste" && (
        <div className="space-y-3">
          {rdvData.map((rdv) => (
            <motion.div key={rdv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted/20 transition-colors cursor-pointer"
              onClick={() => setSelectedRdv(rdv)}>
              <div className="shrink-0 text-center w-14">
                <p className="font-heading text-sm font-bold text-primary">{rdv.heure}</p>
                <p className="text-[10px] text-muted-foreground">{rdv.duree}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{rdv.titre}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{rdv.client}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{rdv.lieu}</span>
                </div>
              </div>
              <StatusBadge status={rdv.statut} />
            </motion.div>
          ))}
        </div>
      )}

      {view === "jour" && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
          <h2 className="font-heading text-sm font-semibold text-foreground">
            {today.toLocaleDateString(lang === "EN" ? "en-GB" : "fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </h2>
          {rdvData.filter(r => r.date === "2026-03-09").map((rdv) => (
            <div key={rdv.id} className={`rounded-lg p-3 ${statusColorMap[rdv.statut] || "bg-muted"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{rdv.titre}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{rdv.heure} · {rdv.duree}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{rdv.lieu}</span>
                  </div>
                </div>
                <StatusBadge status={rdv.statut} />
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "mois" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
          <div className="grid grid-cols-7 border-b border-border">
            {days.map(d => <div key={d} className="p-3 text-center text-xs font-semibold text-muted-foreground border-r border-border last:border-0">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 0;
              const hasEvent = rdvData.some(r => parseInt(r.date.split('-')[2]) === day);
              return (
                <div key={i} className="border-b border-r border-border last:border-r-0 p-2 min-h-[80px] hover:bg-muted/20 transition-colors cursor-pointer">
                  <p className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${day === 9 ? "bg-primary text-primary-foreground" : "text-foreground"}`}>{day > 0 && day <= 31 ? day : ""}</p>
                  {hasEvent && day > 0 && <div className="h-1.5 w-full rounded-full bg-primary/40" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RDV Detail Modal */}
      {selectedRdv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedRdv(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-heading text-lg font-bold text-foreground">{selectedRdv.titre}</h3>
            <div className="mt-4 space-y-3">
              {[
                { label: t("agenda.detail.client"), value: selectedRdv.client, icon: User },
                { label: t("agenda.detail.heure"), value: `${selectedRdv.heure} · ${selectedRdv.duree}`, icon: Clock },
                { label: t("agenda.detail.lieu"), value: selectedRdv.lieu, icon: MapPin },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                  <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium text-foreground">{value}</p></div>
                </div>
              ))}
              {selectedRdv.rappel && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"><Bell className="h-4 w-4 text-muted-foreground" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("agenda.detail.rappel")}</p>
                    <p className="font-medium text-foreground">
                      {rappelOptions.find(r => r.value === selectedRdv.rappel)?.label ?? selectedRdv.rappel}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2"><StatusBadge status={selectedRdv.statut} /></div>
            </div>
            <div className="mt-5 flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedRdv(null)}>{t("agenda.detail.close")}</Button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">{t("agenda.detail.edit")}</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create RDV Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{t("agenda.createRdv")}</DialogTitle>
            <DialogDescription>{t("agenda.planNew")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("agenda.create.titreLabel")}</Label>
              <Input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder={t("agenda.create.titrePlaceholder")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("agenda.create.clientLabel")}</Label>
                <Select value={form.client} onValueChange={v => setForm(f => ({ ...f, client: v }))}>
                  <SelectTrigger><SelectValue placeholder={t("agenda.create.clientPlaceholder")} /></SelectTrigger>
                  <SelectContent>
                    {mockClients.map(c => (
                      <SelectItem key={c.id} value={`${c.nom} ${c.prenom}`.trim()}>{c.nom} {c.prenom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("agenda.create.lieuLabel")}</Label>
                <Select value={form.lieu} onValueChange={v => setForm(f => ({ ...f, lieu: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {lieuValues.map((val, idx) => (
                      <SelectItem key={val} value={val}>{lieux[idx]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("agenda.create.dateLabel")}</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("agenda.create.heureLabel")}</Label>
                <Input type="time" value={form.heure} onChange={e => setForm(f => ({ ...f, heure: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("agenda.duration")}</Label>
                <Select value={form.duree} onValueChange={v => setForm(f => ({ ...f, duree: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {durees.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Bell className="h-3.5 w-3.5 text-primary" /> {t("agenda.reminder")}</Label>
              <Select value={form.rappel} onValueChange={v => setForm(f => ({ ...f, rappel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {rappelOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("agenda.notesDesc")}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t("agenda.create.notesPlaceholder")} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>{t("agenda.cancel")}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={!form.client || !form.date}>
              {t("agenda.createRdv")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
