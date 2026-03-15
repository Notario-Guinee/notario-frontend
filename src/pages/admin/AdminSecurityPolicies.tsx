// ═══════════════════════════════════════════════════════════════
// Page Admin Politiques de Sécurité — Règles de sécurité globales
// Configuration des politiques d'authentification (2FA, sessions,
// mots de passe, IP autorisées) appliquées à toute la plateforme
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Shield, Lock, Key, Clock, Globe, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface SecurityPolicy {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  enabled: boolean;
}

interface CabinetPolicies {
  cabinetId: string;
  cabinetName: string;
  mfa: { enabled: boolean; roles: string[] };
  passwordComplexity: { enabled: boolean; minLength: number; requireSpecial: boolean; requireNumber: boolean; requireUpper: boolean };
  sessionDuration: { enabled: boolean; timeout: number };
  ipRestriction: { enabled: boolean; allowedIps: string[] };
}

const initialCabinets: CabinetPolicies[] = [
  {
    cabinetId: "1", cabinetName: "Étude Diallo & Associés",
    mfa: { enabled: true, roles: ["Gérant", "Notaire"] },
    passwordComplexity: { enabled: true, minLength: 8, requireSpecial: true, requireNumber: true, requireUpper: true },
    sessionDuration: { enabled: true, timeout: 30 },
    ipRestriction: { enabled: false, allowedIps: [] },
  },
  {
    cabinetId: "2", cabinetName: "Cabinet Notarial Bah",
    mfa: { enabled: false, roles: [] },
    passwordComplexity: { enabled: true, minLength: 6, requireSpecial: false, requireNumber: true, requireUpper: false },
    sessionDuration: { enabled: true, timeout: 60 },
    ipRestriction: { enabled: false, allowedIps: [] },
  },
  {
    cabinetId: "3", cabinetName: "Étude Camara",
    mfa: { enabled: true, roles: ["Gérant"] },
    passwordComplexity: { enabled: true, minLength: 10, requireSpecial: true, requireNumber: true, requireUpper: true },
    sessionDuration: { enabled: true, timeout: 15 },
    ipRestriction: { enabled: true, allowedIps: ["197.149.0.0/16", "41.223.0.0/16"] },
  },
  {
    cabinetId: "4", cabinetName: "SN Condé",
    mfa: { enabled: false, roles: [] },
    passwordComplexity: { enabled: false, minLength: 6, requireSpecial: false, requireNumber: false, requireUpper: false },
    sessionDuration: { enabled: false, timeout: 60 },
    ipRestriction: { enabled: false, allowedIps: [] },
  },
];

const allRoles = ["Gérant", "Notaire", "Clerc", "Comptable", "Secrétaire"];

export default function AdminSecurityPolicies() {
  const { lang } = useLanguage();
  const fr = lang === "FR";
  const [cabinets, setCabinets] = useState(initialCabinets);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState<{ cabinetId: string; policy: string } | null>(null);
  const [newIp, setNewIp] = useState("");

  const getCabinet = (id: string) => cabinets.find(c => c.cabinetId === id)!;

  const updateCabinet = (id: string, updater: (c: CabinetPolicies) => CabinetPolicies) => {
    setCabinets(prev => prev.map(c => c.cabinetId === id ? updater(c) : c));
  };

  const togglePolicy = (cabinetId: string, policy: "mfa" | "passwordComplexity" | "sessionDuration" | "ipRestriction") => {
    updateCabinet(cabinetId, c => ({
      ...c,
      [policy]: { ...c[policy], enabled: !c[policy].enabled },
    }));
    const cab = getCabinet(cabinetId);
    const wasEnabled = cab[policy].enabled;
    toast.success(`${wasEnabled ? "Désactivé" : "Activé"} pour ${cab.cabinetName}`);
  };

  const policies = [
    { key: "mfa", icon: Lock, title: fr ? "Authentification à deux facteurs" : "Two-factor authentication", desc: fr ? "Exiger MFA pour les rôles sensibles" : "Require MFA for sensitive roles" },
    { key: "passwordComplexity", icon: Key, title: fr ? "Complexité des mots de passe" : "Password complexity", desc: fr ? "Exiger des mots de passe forts" : "Require strong passwords" },
    { key: "sessionDuration", icon: Clock, title: fr ? "Durée de session" : "Session duration", desc: fr ? "Limiter la durée des sessions" : "Limit session duration" },
    { key: "ipRestriction", icon: Globe, title: fr ? "Restriction IP" : "IP restriction", desc: fr ? "Limiter l'accès aux IPs autorisées" : "Limit access to allowed IPs" },
  ];

  const configuringCabinet = configuring ? getCabinet(configuring.cabinetId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {fr ? "Politiques de sécurité" : "Security Policies"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {fr ? "Configurer les politiques de sécurité pour chaque cabinet" : "Configure security policies per office"}
          </p>
        </div>
      </div>

      {/* Cabinet list */}
      <div className="space-y-3">
        {cabinets.map(cab => {
          const isExpanded = expandedId === cab.cabinetId;
          const activePolicies = [cab.mfa.enabled, cab.passwordComplexity.enabled, cab.sessionDuration.enabled, cab.ipRestriction.enabled].filter(Boolean).length;

          return (
            <div key={cab.cabinetId} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : cab.cabinetId)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">{cab.cabinetName}</p>
                    <p className="text-xs text-muted-foreground">
                      {activePolicies}/4 {fr ? "politiques actives" : "active policies"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[cab.mfa.enabled, cab.passwordComplexity.enabled, cab.sessionDuration.enabled, cab.ipRestriction.enabled].map((on, i) => (
                      <div key={i} className={cn("w-2 h-2 rounded-full", on ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                    ))}
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Policies */}
              {isExpanded && (
                <div className="border-t border-border px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {policies.map(p => {
                    const policyData = cab[p.key as keyof CabinetPolicies] as { enabled: boolean };
                    return (
                      <div key={p.key} className="rounded-lg border border-border p-4 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", policyData.enabled ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-muted")}>
                            <p.icon className={cn("h-5 w-5", policyData.enabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{p.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{p.desc}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", policyData.enabled ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground")}>
                                {policyData.enabled ? (fr ? "Actif" : "Active") : (fr ? "Inactif" : "Inactive")}
                              </span>
                              <button
                                onClick={() => setConfiguring({ cabinetId: cab.cabinetId, policy: p.key })}
                                className="text-[10px] text-primary hover:underline font-medium"
                              >
                                {fr ? "Configurer" : "Configure"}
                              </button>
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={policyData.enabled}
                          onCheckedChange={() => togglePolicy(cab.cabinetId, p.key as any)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={!!configuring} onOpenChange={o => !o && setConfiguring(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {configuring && policies.find(p => p.key === configuring.policy)?.title}
            </DialogTitle>
            <DialogDescription>{configuringCabinet?.cabinetName}</DialogDescription>
          </DialogHeader>

          {configuring && configuringCabinet && (
            <div className="space-y-4">
              {configuring.policy === "mfa" && (
                <>
                  <p className="text-xs text-muted-foreground">{fr ? "Sélectionner les rôles qui doivent utiliser le MFA :" : "Select roles that must use MFA:"}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {allRoles.map(role => (
                      <label key={role} className="flex items-center gap-2 rounded-lg border border-border p-2.5 cursor-pointer hover:bg-muted/30">
                        <input
                          type="checkbox"
                          checked={configuringCabinet.mfa.roles.includes(role)}
                          onChange={() => {
                            const roles = configuringCabinet.mfa.roles.includes(role)
                              ? configuringCabinet.mfa.roles.filter(r => r !== role)
                              : [...configuringCabinet.mfa.roles, role];
                            updateCabinet(configuring.cabinetId, c => ({ ...c, mfa: { ...c.mfa, roles } }));
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-foreground">{role}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {configuring.policy === "passwordComplexity" && (
                <>
                  <div className="space-y-2">
                    <Label>{fr ? "Longueur minimale" : "Minimum length"}</Label>
                    <Input
                      type="number"
                      value={configuringCabinet.passwordComplexity.minLength}
                      onChange={e => updateCabinet(configuring.cabinetId, c => ({ ...c, passwordComplexity: { ...c.passwordComplexity, minLength: Number(e.target.value) } }))}
                      min={6} max={32}
                    />
                  </div>
                  {[
                    { key: "requireSpecial" as const, label: fr ? "Caractères spéciaux requis" : "Special characters required" },
                    { key: "requireNumber" as const, label: fr ? "Chiffres requis" : "Numbers required" },
                    { key: "requireUpper" as const, label: fr ? "Majuscules requises" : "Uppercase required" },
                  ].map(opt => (
                    <div key={opt.key} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{opt.label}</span>
                      <Switch
                        checked={configuringCabinet.passwordComplexity[opt.key]}
                        onCheckedChange={v => updateCabinet(configuring.cabinetId, c => ({ ...c, passwordComplexity: { ...c.passwordComplexity, [opt.key]: v } }))}
                      />
                    </div>
                  ))}
                </>
              )}

              {configuring.policy === "sessionDuration" && (
                <div className="space-y-2">
                  <Label>{fr ? "Durée maximale (minutes)" : "Maximum duration (minutes)"}</Label>
                  <Select
                    value={String(configuringCabinet.sessionDuration.timeout)}
                    onValueChange={v => updateCabinet(configuring.cabinetId, c => ({ ...c, sessionDuration: { ...c.sessionDuration, timeout: Number(v) } }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[15, 30, 60, 120, 240, 480].map(v => (
                        <SelectItem key={v} value={String(v)}>{v} min</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {configuring.policy === "ipRestriction" && (
                <>
                  <p className="text-xs text-muted-foreground">{fr ? "Adresses IP autorisées (CIDR ou IP unique) :" : "Allowed IP addresses (CIDR or single IP):"}</p>
                  <div className="space-y-2">
                    {configuringCabinet.ipRestriction.allowedIps.map((ip, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input value={ip} readOnly className="font-mono text-sm flex-1" />
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
                          updateCabinet(configuring.cabinetId, c => ({
                            ...c, ipRestriction: { ...c.ipRestriction, allowedIps: c.ipRestriction.allowedIps.filter((_, idx) => idx !== i) }
                          }));
                        }}>✕</Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Ex: 197.149.0.0/16" value={newIp} onChange={e => setNewIp(e.target.value)} className="font-mono text-sm" />
                    <Button size="sm" onClick={() => {
                      if (!newIp.trim()) return;
                      updateCabinet(configuring.cabinetId, c => ({
                        ...c, ipRestriction: { ...c.ipRestriction, allowedIps: [...c.ipRestriction.allowedIps, newIp.trim()] }
                      }));
                      setNewIp("");
                    }}>{fr ? "Ajouter" : "Add"}</Button>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfiguring(null)}>{fr ? "Fermer" : "Close"}</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={() => {
              toast.success(fr ? "Configuration sauvegardée" : "Configuration saved");
              setConfiguring(null);
            }}>{fr ? "Enregistrer" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
