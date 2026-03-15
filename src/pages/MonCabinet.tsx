// ═══════════════════════════════════════════════════════════════
// Page Mon Cabinet — Profil et paramètres du cabinet notarial
// Inclut : informations générales, logo, coordonnées, sécurité
// et gestion de l'avatar du gérant avec upload d'image
// ═══════════════════════════════════════════════════════════════

import { useState, useRef } from "react";
import { Building2, Upload, User, Shield, Mail, Phone, MapPin, Camera, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { currentUser } from "@/data/mockData";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

export default function MonCabinet() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"cabinet" | "profil" | "securite">("cabinet");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [cabinetForm, setCabinetForm] = useState({
    nom: currentUser.cabinet,
    email: "contact@diallo-notaires.gn",
    telephone: "+224 622 00 11 22",
    adresse: "Quartier Almamya, Commune de Kaloum, Conakry",
    devise: "GNF",
    formatFacture: "FAC-{ANNEE}-{SEQ}",
  });

  const [profilForm, setProfilForm] = useState({
    nom: "Diallo",
    prenom: currentUser.firstName,
    email: currentUser.email,
    telephone: "+224 622 00 11 22",
    role: currentUser.role,
  });

  const [securiteForm, setSecuriteForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    mfaEnabled: false,
    sessionTimeout: "30",
  });

  const tabs = [
    { id: "cabinet" as const, label: t("cabinet.tabCabinet"), icon: Building2 },
    { id: "profil" as const, label: t("cabinet.tabProfil"), icon: User },
    { id: "securite" as const, label: t("cabinet.tabSecurite"), icon: Shield },
  ];

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("cabinet.toastLogoInvalid"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target?.result as string);
      toast.success(t("cabinet.toastLogoUpdated"));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold text-foreground">{t("cabinet.pageTitle")}</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Cabinet Tab */}
      {activeTab === "cabinet" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
            {/* Logo section - prominent */}
            <div className="flex items-center gap-5 mb-4">
              <div className="relative group">
                <input type="file" ref={logoInputRef} accept="image/*" className="hidden" onChange={handleLogoChange} />
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo cabinet" className="h-20 w-20 rounded-2xl object-cover border-2 border-primary/30 shadow-md" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border-2 border-dashed border-primary/30">
                    <Building2 className="h-8 w-8 text-primary/60" />
                  </div>
                )}
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1">
                <p className="font-heading text-lg font-bold text-foreground">{cabinetForm.nom}</p>
                <p className="text-xs text-muted-foreground mb-2">Conakry, Guinée</p>
                <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} className="gap-2 text-xs">
                  <Upload className="h-3.5 w-3.5" /> {t("cabinet.changeLogo")}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("cabinet.officeName")}</Label>
              <Input value={cabinetForm.nom} onChange={e => setCabinetForm(f => ({ ...f, nom: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("cabinet.officeEmail")}</Label>
                <Input value={cabinetForm.email} onChange={e => setCabinetForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("cabinet.officePhone")}</Label>
                <Input value={cabinetForm.telephone} onChange={e => setCabinetForm(f => ({ ...f, telephone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("cabinet.officeAddress")}</Label>
              <Input value={cabinetForm.adresse} onChange={e => setCabinetForm(f => ({ ...f, adresse: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("cabinet.currency")}</Label>
                <Select value={cabinetForm.devise} onValueChange={v => setCabinetForm(f => ({ ...f, devise: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GNF">{t("cabinet.devise.gnf")}</SelectItem>
                    <SelectItem value="EUR">{t("cabinet.devise.eur")}</SelectItem>
                    <SelectItem value="USD">{t("cabinet.devise.usd")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("cabinet.invoiceFormatLabel")}</Label>
                <Input value={cabinetForm.formatFacture} onChange={e => setCabinetForm(f => ({ ...f, formatFacture: e.target.value }))} />
              </div>
            </div>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={() => toast.success(t("cabinet.toastSettingsSaved"))}>
              {t("cabinet.saveSettings")}
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("cabinet.storage")}</h2>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3"/>
                  <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="77.5, 100" strokeLinecap="round"/>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-heading text-sm font-bold text-foreground">78%</span>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">15.5 Go</p>
                <p className="text-xs text-muted-foreground">{t("cabinet.storageUsed")}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profil Tab */}
      {activeTab === "profil" && (
        <div className="max-w-2xl">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 font-heading text-2xl font-bold text-primary">
                  {profilForm.prenom.charAt(0)}{profilForm.nom.charAt(0)}
                </div>
                <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-foreground">{profilForm.prenom} {profilForm.nom}</p>
                <p className="text-sm text-muted-foreground">{profilForm.role} · {currentUser.cabinet}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("cabinet.lastName")}</Label>
                <Input value={profilForm.nom} onChange={e => setProfilForm(f => ({ ...f, nom: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("cabinet.firstName")}</Label>
                <Input value={profilForm.prenom} onChange={e => setProfilForm(f => ({ ...f, prenom: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {t("label.email")}</Label>
                <Input value={profilForm.email} onChange={e => setProfilForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {t("cabinet.officePhone")}</Label>
                <Input value={profilForm.telephone} onChange={e => setProfilForm(f => ({ ...f, telephone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("cabinet.role")}</Label>
              <Input value={profilForm.role} disabled className="opacity-60" />
            </div>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={() => toast.success(t("cabinet.toastProfileSaved"))}>
              {t("cabinet.saveProfile")}
            </Button>
          </div>
        </div>
      )}

      {/* Securite Tab */}
      {activeTab === "securite" && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
            <h2 className="font-heading text-sm font-semibold text-foreground">{t("cabinet.changePasswordTitle")}</h2>
            <div className="space-y-2">
              <Label>{t("cabinet.oldPassword")}</Label>
              <Input type="password" value={securiteForm.oldPassword} onChange={e => setSecuriteForm(f => ({ ...f, oldPassword: e.target.value }))} placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("cabinet.newPasswordLabel")}</Label>
                <Input type="password" value={securiteForm.newPassword} onChange={e => setSecuriteForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>{t("cabinet.confirm")}</Label>
                <Input type="password" value={securiteForm.confirmPassword} onChange={e => setSecuriteForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="••••••••" />
              </div>
            </div>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={() => {
              if (securiteForm.newPassword !== securiteForm.confirmPassword) { toast.error(t("cabinet.toastPasswordMismatch")); return; }
              toast.success(t("cabinet.toastPasswordChanged"));
              setSecuriteForm(f => ({ ...f, oldPassword: "", newPassword: "", confirmPassword: "" }));
            }}>
              {t("cabinet.updatePasswordBtn")}
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
            <h2 className="font-heading text-sm font-semibold text-foreground">{t("cabinet.twoFactorTitle")}</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{t("cabinet.enableMfa")}</p>
                <p className="text-xs text-muted-foreground">{t("cabinet.twoFactorDesc")}</p>
              </div>
              <Switch checked={securiteForm.mfaEnabled} onCheckedChange={v => { setSecuriteForm(f => ({ ...f, mfaEnabled: v })); toast.success(v ? t("cabinet.toastMfaEnabled") : t("cabinet.toastMfaDisabled")); }} />
            </div>
            <div className="space-y-2">
              <Label>{t("cabinet.sessionExpiry")}</Label>
              <Select value={securiteForm.sessionTimeout} onValueChange={v => setSecuriteForm(f => ({ ...f, sessionTimeout: v }))}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">{t("cabinet.session15")}</SelectItem>
                  <SelectItem value="30">{t("cabinet.session30")}</SelectItem>
                  <SelectItem value="60">{t("cabinet.session60")}</SelectItem>
                  <SelectItem value="120">{t("cabinet.session120")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
