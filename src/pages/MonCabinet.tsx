// ═══════════════════════════════════════════════════════════════
// Page Mon Cabinet — Profil et paramètres du cabinet notarial
// Inclut : informations générales, logo, coordonnées, sécurité
// et gestion de l'avatar du gérant avec upload d'image
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from "react";
import { Building2, Upload, User, Shield, Mail, Phone, Camera, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { cabinetService, authService, type CabinetConfig } from "@/services/cabinetService";

export default function MonCabinet() {
  const { t } = useLanguage();
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<"cabinet" | "profil" | "securite">("cabinet");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // État chargement initial
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [cabinetVersion, setCabinetVersion] = useState<number>(0);

  // États des formulaires
  const [cabinetForm, setCabinetForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    ville: "",
    devise: "GNF",
    formatFacture: "FAC-{ANNEE}-{SEQ}",
  });

  const [profilForm, setProfilForm] = useState({
    nom: user?.nom ?? "",
    prenom: user?.prenom ?? "",
    email: user?.email ?? "",
    telephone: "",
    role: user?.role ?? "",
  });

  const [securiteForm, setSecuriteForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    mfaEnabled: false,
    sessionTimeout: "30",
  });

  // États de sauvegarde
  const [savingCabinet, setSavingCabinet] = useState(false);
  const [savingProfil, setSavingProfil] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // ── Chargement de la config cabinet au montage ──────────────────────────────
  useEffect(() => {
    cabinetService.getConfig()
      .then((config: CabinetConfig) => {
        setCabinetVersion(config.version);
        setLogoPreview(config.logoUrl ?? null);
        setCabinetForm({
          nom: config.nomCabinet ?? "",
          email: config.email ?? "",
          telephone: config.telephone ?? "",
          adresse: config.adresse ?? "",
          ville: config.ville ?? "",
          devise: config.devise ?? "GNF",
          formatFacture: config.configurationFactureJson ?? "FAC-{ANNEE}-{SEQ}",
        });
      })
      .catch(() => toast.error("Impossible de charger la configuration du cabinet"))
      .finally(() => setLoadingConfig(false));
  }, []);

  // ── Synchronise le formulaire profil avec l'utilisateur connecté ────────────
  useEffect(() => {
    if (user) {
      setProfilForm(f => ({
        ...f,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
      }));
    }
  }, [user]);

  const tabs = [
    { id: "cabinet" as const, label: t("cabinet.tabCabinet"), icon: Building2 },
    { id: "profil" as const, label: t("cabinet.tabProfil"), icon: User },
    { id: "securite" as const, label: t("cabinet.tabSecurite"), icon: Shield },
  ];

  // ── Gestion du logo ─────────────────────────────────────────────────────────
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("cabinet.toastLogoInvalid"));
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoPreview(dataUrl);
      try {
        await cabinetService.updateLogo(dataUrl);
        toast.success(t("cabinet.toastLogoUpdated"));
      } catch {
        toast.error("Erreur lors de la mise à jour du logo");
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Sauvegarde des infos cabinet ────────────────────────────────────────────
  const handleSaveCabinet = async () => {
    setSavingCabinet(true);
    try {
      await cabinetService.updateContact({
        adresse: cabinetForm.adresse,
        ville: cabinetForm.ville,
        telephone: cabinetForm.telephone,
        email: cabinetForm.email,
      });
      await cabinetService.updateDevise(cabinetForm.devise);
      toast.success(t("cabinet.toastSettingsSaved"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la sauvegarde";
      toast.error(message);
    } finally {
      setSavingCabinet(false);
    }
  };

  // ── Sauvegarde du profil ─────────────────────────────────────────────────────
  const handleSaveProfil = async () => {
    setSavingProfil(true);
    try {
      await authService.updateProfile({
        nom: profilForm.nom,
        prenom: profilForm.prenom,
        email: profilForm.email,
        telephone: profilForm.telephone,
        role: profilForm.role,
      });
      toast.success(t("cabinet.toastProfileSaved"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la sauvegarde";
      toast.error(message);
    } finally {
      setSavingProfil(false);
    }
  };

  // ── Changement de mot de passe ───────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (securiteForm.newPassword !== securiteForm.confirmPassword) {
      toast.error(t("cabinet.toastPasswordMismatch"));
      return;
    }
    setSavingPassword(true);
    try {
      await authService.changePassword({
        ancienMotDePasse: securiteForm.oldPassword,
        nouveauMotDePasse: securiteForm.newPassword,
        confirmationMotDePasse: securiteForm.confirmPassword,
      });
      toast.success(t("cabinet.toastPasswordChanged"));
      setSecuriteForm(f => ({ ...f, oldPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors du changement de mot de passe";
      toast.error(message);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            {/* Logo section */}
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
                <p className="text-xs text-muted-foreground mb-2">{cabinetForm.ville || "—"}</p>
                <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} className="gap-2 text-xs">
                  <Upload className="h-3.5 w-3.5" /> {t("cabinet.changeLogo")}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("cabinet.officeName")}</Label>
              <Input value={cabinetForm.nom} disabled className="opacity-60" />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("cabinet.officeAddress")}</Label>
                <Input value={cabinetForm.adresse} onChange={e => setCabinetForm(f => ({ ...f, adresse: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input value={cabinetForm.ville} onChange={e => setCabinetForm(f => ({ ...f, ville: e.target.value }))} />
              </div>
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
            <Button
              className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
              onClick={handleSaveCabinet}
              disabled={savingCabinet}
            >
              {savingCabinet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                <p className="text-sm text-muted-foreground">{profilForm.role} · {cabinetForm.nom}</p>
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
            <Button
              className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
              onClick={handleSaveProfil}
              disabled={savingProfil}
            >
              {savingProfil && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
            <Button
              className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
              onClick={handleChangePassword}
              disabled={savingPassword}
            >
              {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
