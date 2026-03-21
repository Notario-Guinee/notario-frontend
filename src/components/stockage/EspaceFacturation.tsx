// ═══════════════════════════════════════════════════════════════
// EspaceFacturation — Onglet "Facturation"
// Bloc 1 : récapitulatif mensuel
// Bloc 2 : informations légales du cabinet
// Bloc 3 : coordonnées bancaires / carte de paiement
// Bloc 4 : historique des factures avec badges statut
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react';
import { Building2, CreditCard, Loader2, RefreshCw, CheckCircle2, XCircle, Clock, Eye, EyeOff, Download, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RecapFacturationMensuelle } from './RecapFacturationMensuelle';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { RecapFacturation, InfosFacturation, InfosCarteBancaire, LigneFacture } from '@/types/stockage';
import * as svc from '@/services/stockageService';

interface EspaceFacturationProps {
  recap: RecapFacturation | null;
  isLoadingRecap: boolean;
}

/** Formate un montant GNF */
function formatGnf(montant: number): string {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' GNF';
}

/** Génère et télécharge une facture au format HTML */
function downloadFacture(facture: LigneFacture, lang: string): void {
  const fr = lang !== 'EN';
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${fr ? 'Facture' : 'Invoice'} ${facture.id}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #2d3748; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .logo { font-size: 22px; font-weight: bold; color: #1B6B93; }
  .cabinet { font-size: 13px; color: #718096; }
  h1 { font-size: 28px; color: #1B6B93; margin: 0 0 4px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
  .label { font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 1px; }
  .value { font-size: 14px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #f7fafc; padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; color: #718096; }
  td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  .total-row td { font-weight: bold; border-bottom: none; font-size: 15px; color: #1B6B93; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; background: #c6f6d5; color: #276749; }
</style></head>
<body>
<div class="header">
  <div><div class="logo">Notario</div><div class="cabinet">Cabinet Diallo &amp; Associés · Conakry, Guinée</div></div>
  <div><h1>${fr ? 'FACTURE' : 'INVOICE'}</h1><div style="font-size:13px;color:#718096;">${fr ? 'N°' : 'No.'} ${facture.id}</div></div>
</div>
<div class="meta">
  <div><div class="label">${fr ? 'Date' : 'Date'}</div><div class="value">${facture.date}</div></div>
  <div><div class="label">${fr ? 'Statut' : 'Status'}</div><div class="value"><span class="badge">${facture.statut}</span></div></div>
</div>
<table>
  <thead><tr><th>${fr ? 'Description' : 'Description'}</th><th>${fr ? 'Montant' : 'Amount'}</th></tr></thead>
  <tbody>
    <tr><td>${facture.description}</td><td>${new Intl.NumberFormat('fr-FR').format(facture.montant_gnf)} GNF</td></tr>
    <tr class="total-row"><td>Total</td><td>${new Intl.NumberFormat('fr-FR').format(facture.montant_gnf)} GNF</td></tr>
  </tbody>
</table>
<p style="font-size:11px;color:#a0aec0;margin-top:40px;">Notario — Plateforme de gestion notariale · contact@notario.gn</p>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `facture_${facture.id}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Configuration du badge de statut de facture (sans label — géré via t() dans le composant) */
const statutConfig = {
  payé: {
    classes: 'bg-success/15 text-success border-success/30',
    Icone: CheckCircle2,
  },
  en_attente: {
    classes: 'bg-warning/15 text-warning border-warning/30',
    Icone: Clock,
  },
  échoué: {
    classes: 'bg-destructive/15 text-destructive border-destructive/30',
    Icone: XCircle,
  },
} as const;

/** Formate un numéro de carte : ajoute des espaces tous les 4 chiffres */
function formaterNumeroCarte(valeur: string): string {
  const chiffres = valeur.replace(/\D/g, '').slice(0, 16);
  return chiffres.replace(/(.{4})/g, '$1 ').trim();
}

/** Formate la date d'expiration MM/AA */
function formaterDateExpiration(valeur: string): string {
  const chiffres = valeur.replace(/\D/g, '').slice(0, 4);
  if (chiffres.length >= 3) return chiffres.slice(0, 2) + '/' + chiffres.slice(2);
  return chiffres;
}

/** Détecte le type de carte depuis les premiers chiffres */
function detecterTypeCarte(numero: string): InfosCarteBancaire['type_carte'] {
  const n = numero.replace(/\s/g, '');
  if (/^4/.test(n))           return 'Visa';
  if (/^5[1-5]/.test(n))      return 'Mastercard';
  if (/^3[47]/.test(n))       return 'American Express';
  if (/^62/.test(n))          return 'UnionPay';
  return 'Autre';
}

export function EspaceFacturation({ recap, isLoadingRecap }: EspaceFacturationProps) {
  const { t, lang } = useLanguage();

  /** Formate une date ISO en format court selon la langue */
  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(lang === 'EN' ? 'en-GB' : 'fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const [infos, setInfos] = useState<InfosFacturation | null>(null);
  const [carte, setCarte] = useState<InfosCarteBancaire | null>(null);
  const [factures, setFactures] = useState<LigneFacture[]>([]);
  const [isLoadingInfos, setIsLoadingInfos] = useState(true);
  const [isLoadingCarte, setIsLoadingCarte] = useState(true);
  const [isLoadingFactures, setIsLoadingFactures] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingCarte, setIsSavingCarte] = useState(false);
  /** Afficher/masquer le numéro de carte */
  const [showCardNumber, setShowCardNumber] = useState(false);
  /** Afficher/masquer le CVV */
  const [cvvVisible, setCvvVisible] = useState(false);
  /** Erreurs de validation du formulaire infos légales */
  const [erreurs, setErreurs] = useState<Partial<Record<keyof InfosFacturation, string>>>({});
  /** Erreurs de validation du formulaire carte */
  const [erreursCarte, setErreursCarte] = useState<Partial<Record<keyof InfosCarteBancaire, string>>>({});

  /** Charge les informations de facturation, la carte et l'historique au montage */
  useEffect(() => {
    svc.getInfosFacturation().then(data => {
      setInfos(data);
      setIsLoadingInfos(false);
    });
    svc.getInfosCarteBancaire().then(data => {
      setCarte(data);
      setIsLoadingCarte(false);
    });
    svc.getHistoriqueFactures().then(data => {
      setFactures(data);
      setIsLoadingFactures(false);
    });
  }, []);

  /** Met à jour un champ du formulaire */
  function mettreAJour(champ: keyof InfosFacturation, valeur: string) {
    setInfos(prev => prev ? { ...prev, [champ]: valeur } : prev);
    // Efface l'erreur du champ modifié
    if (erreurs[champ]) setErreurs(prev => ({ ...prev, [champ]: undefined }));
  }

  /** Valide le formulaire et retourne true si tout est correct */
  function validerFormulaire(): boolean {
    if (!infos) return false;
    const nouvellesErreurs: Partial<Record<keyof InfosFacturation, string>> = {};
    if (!infos.raison_sociale.trim()) nouvellesErreurs.raison_sociale = 'Champ requis.';
    if (!infos.numero_rccm.trim())   nouvellesErreurs.numero_rccm    = 'Champ requis.';
    if (!infos.adresse.trim())        nouvellesErreurs.adresse         = 'Champ requis.';
    if (!infos.ville.trim())          nouvellesErreurs.ville           = 'Champ requis.';
    if (!infos.telephone.trim())      nouvellesErreurs.telephone       = 'Champ requis.';
    // Validation du format email
    if (!infos.email_facturation.trim()) {
      nouvellesErreurs.email_facturation = 'Champ requis.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(infos.email_facturation)) {
      nouvellesErreurs.email_facturation = 'Format email invalide.';
    }
    setErreurs(nouvellesErreurs);
    return Object.keys(nouvellesErreurs).length === 0;
  }

  /** Soumission du formulaire infos légales */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!infos || !validerFormulaire()) return;
    setIsSaving(true);
    try {
      await svc.sauvegarderInfosFacturation(infos);
      toast.success(t("subs.billing.saveSuccess"));
    } catch {
      toast.error(t("subs.billing.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  /** Met à jour un champ du formulaire carte bancaire */
  function mettreAJourCarte(champ: keyof InfosCarteBancaire, valeur: string) {
    setCarte(prev => {
      if (!prev) return prev;
      const mis = { ...prev, [champ]: valeur };
      // Détection automatique du type de carte depuis le numéro
      if (champ === 'numero_carte') {
        mis.type_carte = detecterTypeCarte(valeur);
      }
      return mis;
    });
    if (erreursCarte[champ]) setErreursCarte(prev => ({ ...prev, [champ]: undefined }));
  }

  /** Valide le formulaire carte et retourne true si correct */
  function validerCarte(): boolean {
    if (!carte) return false;
    const e: Partial<Record<keyof InfosCarteBancaire, string>> = {};
    if (!carte.titulaire.trim())        e.titulaire        = 'Champ requis.';
    if (carte.numero_carte.replace(/\s/g, '').length < 16)
                                        e.numero_carte     = 'Numéro de carte invalide (16 chiffres requis).';
    if (!/^\d{2}\/\d{2}$/.test(carte.date_expiration))
                                        e.date_expiration  = 'Format requis : MM/AA.';
    if (!carte.cvv.trim() || !/^\d{3,4}$/.test(carte.cvv))
                                        e.cvv              = 'CVV invalide (3 ou 4 chiffres).';
    if (!carte.banque_emettrice.trim()) e.banque_emettrice = 'Champ requis.';
    setErreursCarte(e);
    return Object.keys(e).length === 0;
  }

  /** Soumission du formulaire carte bancaire */
  async function handleSubmitCarte(e: FormEvent) {
    e.preventDefault();
    if (!carte || !validerCarte()) return;
    setIsSavingCarte(true);
    try {
      await svc.sauvegarderInfosCarteBancaire(carte);
      // Le CVV ne doit pas être conservé en mémoire côté UI après sauvegarde
      setCarte(prev => prev ? { ...prev, cvv: '' } : prev);
      toast.success(t("subs.card.saveSuccess"));
    } catch {
      toast.error(t("subs.card.saveError"));
    } finally {
      setIsSavingCarte(false);
    }
  }

  /** Simule une nouvelle tentative de paiement pour une facture échouée */
  const handleRetryPayment = (factureId: string) => {
    setFactures(prev => prev.map(f =>
      f.id === factureId ? { ...f, statut: 'payé' as const } : f
    ));
    toast.success(t("factures.payRetrySuccess"));
  };

  /** Masque le numéro de carte — ne conserve que les 4 derniers chiffres */
  function masquerCarte(num: string): string {
    const chiffres = num.replace(/\s/g, "");
    return chiffres.length >= 4
      ? "**** **** **** " + chiffres.slice(-4)
      : "****";
  }

  return (
    <div className="space-y-8">

      {/* ══ BLOC 1 : Récapitulatif mensuel ══ */}
      <RecapFacturationMensuelle recap={recap} isLoading={isLoadingRecap} />

      {/* ══ BLOC 2 : Informations légales ══ */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-heading text-base font-semibold text-foreground">
            {t("subs.billing.legalTitle")}
          </h3>
        </div>

        {isLoadingInfos ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}
          </div>
        ) : infos ? (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Raison sociale */}
              <div className="space-y-1.5">
                <Label htmlFor="raison_sociale">{t("subs.billing.companyName")} *</Label>
                <Input
                  id="raison_sociale"
                  value={infos.raison_sociale}
                  onChange={e => mettreAJour('raison_sociale', e.target.value)}
                  className={cn(erreurs.raison_sociale && 'border-destructive')}
                />
                {erreurs.raison_sociale && (
                  <p className="text-xs text-destructive">{erreurs.raison_sociale}</p>
                )}
              </div>

              {/* N° RCCM */}
              <div className="space-y-1.5">
                <Label htmlFor="numero_rccm">{t("subs.billing.rccm")} *</Label>
                <Input
                  id="numero_rccm"
                  value={infos.numero_rccm}
                  onChange={e => mettreAJour('numero_rccm', e.target.value)}
                  placeholder="RCCM/GN/XXX/XXXX"
                  className={cn(erreurs.numero_rccm && 'border-destructive')}
                />
                {erreurs.numero_rccm && (
                  <p className="text-xs text-destructive">{erreurs.numero_rccm}</p>
                )}
              </div>

              {/* Adresse */}
              <div className="space-y-1.5">
                <Label htmlFor="adresse">{t("subs.billing.address")} *</Label>
                <Input
                  id="adresse"
                  value={infos.adresse}
                  onChange={e => mettreAJour('adresse', e.target.value)}
                  className={cn(erreurs.adresse && 'border-destructive')}
                />
                {erreurs.adresse && (
                  <p className="text-xs text-destructive">{erreurs.adresse}</p>
                )}
              </div>

              {/* Ville */}
              <div className="space-y-1.5">
                <Label htmlFor="ville">{t("subs.billing.city")} *</Label>
                <Input
                  id="ville"
                  value={infos.ville}
                  onChange={e => mettreAJour('ville', e.target.value)}
                  className={cn(erreurs.ville && 'border-destructive')}
                />
                {erreurs.ville && (
                  <p className="text-xs text-destructive">{erreurs.ville}</p>
                )}
              </div>

              {/* Email de facturation */}
              <div className="space-y-1.5">
                <Label htmlFor="email_facturation">{t("subs.billing.email")} *</Label>
                <Input
                  id="email_facturation"
                  type="email"
                  value={infos.email_facturation}
                  onChange={e => mettreAJour('email_facturation', e.target.value)}
                  className={cn(erreurs.email_facturation && 'border-destructive')}
                />
                {erreurs.email_facturation && (
                  <p className="text-xs text-destructive">{erreurs.email_facturation}</p>
                )}
              </div>

              {/* Téléphone */}
              <div className="space-y-1.5">
                <Label htmlFor="telephone">{t("subs.billing.phone")} *</Label>
                <Input
                  id="telephone"
                  value={infos.telephone}
                  onChange={e => mettreAJour('telephone', e.target.value)}
                  placeholder="+224 XXX XXX XXX"
                  className={cn(erreurs.telephone && 'border-destructive')}
                />
                {erreurs.telephone && (
                  <p className="text-xs text-destructive">{erreurs.telephone}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              disabled={isSaving}
            >
              {isSaving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("subs.billing.saving")}</>
                : t("subs.billing.save")
              }
            </Button>
          </form>
        ) : null}
      </div>

      {/* ══ BLOC 3 : Coordonnées bancaires / carte de paiement ══ */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-heading text-base font-semibold text-foreground">
            {t("subs.card.title")}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          {t("subs.card.securityNote")}
        </p>

        {isLoadingCarte ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}
          </div>
        ) : carte ? (
          <form onSubmit={handleSubmitCarte} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* Titulaire */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="titulaire">{t("subs.card.holder")} *</Label>
                <Input
                  id="titulaire"
                  value={carte.titulaire}
                  onChange={e => mettreAJourCarte('titulaire', e.target.value)}
                  placeholder="Tel qu'il apparaît sur la carte"
                  className={cn(erreursCarte.titulaire && 'border-destructive')}
                />
                {erreursCarte.titulaire && (
                  <p className="text-xs text-destructive">{erreursCarte.titulaire}</p>
                )}
              </div>

              {/* Numéro de carte */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="numero_carte">{t("subs.card.number")} *</Label>
                {/* Prévisualisation masquée — affichée uniquement quand le champ est masqué */}
                {!showCardNumber && carte.numero_carte && (
                  <p className="text-xs text-muted-foreground font-mono tracking-widest mb-1">
                    {masquerCarte(carte.numero_carte)}
                  </p>
                )}
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="numero_carte"
                    type={showCardNumber ? 'text' : 'password'}
                    value={carte.numero_carte}
                    onChange={e => mettreAJourCarte('numero_carte', formaterNumeroCarte(e.target.value))}
                    placeholder="XXXX XXXX XXXX XXXX"
                    maxLength={19}
                    className={cn('pl-10 pr-20 font-mono tracking-widest', erreursCarte.numero_carte && 'border-destructive')}
                  />
                  {/* Bouton afficher/masquer le numéro de carte */}
                  <button
                    type="button"
                    onClick={() => setShowCardNumber(v => !v)}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showCardNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {/* Badge type de carte détecté automatiquement */}
                  {carte.type_carte && carte.type_carte !== 'Autre' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-primary">
                      {carte.type_carte}
                    </span>
                  )}
                </div>
                {erreursCarte.numero_carte && (
                  <p className="text-xs text-destructive">{erreursCarte.numero_carte}</p>
                )}
              </div>

              {/* Date d'expiration */}
              <div className="space-y-1.5">
                <Label htmlFor="date_expiration">{t("subs.card.expiry")} *</Label>
                <Input
                  id="date_expiration"
                  value={carte.date_expiration}
                  onChange={e => mettreAJourCarte('date_expiration', formaterDateExpiration(e.target.value))}
                  placeholder="MM/AA"
                  maxLength={5}
                  className={cn('font-mono', erreursCarte.date_expiration && 'border-destructive')}
                />
                {erreursCarte.date_expiration && (
                  <p className="text-xs text-destructive">{erreursCarte.date_expiration}</p>
                )}
              </div>

              {/* CVV */}
              <div className="space-y-1.5">
                <Label htmlFor="cvv">{t("subs.card.cvv")} *</Label>
                <div className="relative">
                  <Input
                    id="cvv"
                    type={cvvVisible ? 'text' : 'password'}
                    value={carte.cvv}
                    onChange={e => mettreAJourCarte('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="3 ou 4 chiffres"
                    maxLength={4}
                    className={cn('font-mono pr-10', erreursCarte.cvv && 'border-destructive')}
                  />
                  <button
                    type="button"
                    onClick={() => setCvvVisible(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {cvvVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {erreursCarte.cvv && (
                  <p className="text-xs text-destructive">{erreursCarte.cvv}</p>
                )}
              </div>

              {/* Banque émettrice */}
              <div className="space-y-1.5">
                <Label htmlFor="banque_emettrice">{t("subs.card.bank")} *</Label>
                <Input
                  id="banque_emettrice"
                  value={carte.banque_emettrice}
                  onChange={e => mettreAJourCarte('banque_emettrice', e.target.value)}
                  placeholder="Ex : Banque de Guinée"
                  className={cn(erreursCarte.banque_emettrice && 'border-destructive')}
                />
                {erreursCarte.banque_emettrice && (
                  <p className="text-xs text-destructive">{erreursCarte.banque_emettrice}</p>
                )}
              </div>

              {/* Type de carte */}
              <div className="space-y-1.5">
                <Label htmlFor="type_carte">{t("subs.card.type")}</Label>
                <Select
                  value={carte.type_carte}
                  onValueChange={v => mettreAJourCarte('type_carte', v as InfosCarteBancaire['type_carte'])}
                >
                  <SelectTrigger id="type_carte">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Visa">Visa</SelectItem>
                    <SelectItem value="Mastercard">Mastercard</SelectItem>
                    <SelectItem value="American Express">American Express</SelectItem>
                    <SelectItem value="UnionPay">UnionPay</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              {t("subs.card.securityNote")}
            </p>

            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              disabled={isSavingCarte}
            >
              {isSavingCarte
                ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("subs.card.saving")}</>
                : t("subs.card.save")
              }
            </Button>

            <p className="text-[11px] text-muted-foreground/70 leading-relaxed border-t border-border pt-3">
              Vous acceptez que Notario débite votre carte pour les services auxquels vous souscrirez et de manière récurrente mensuelle jusqu'à ce que vous annuliez conformément à nos conditions, notamment en exerçant votre droit d'annulation de votre abonnement dans les 14 jours suivant la date d'abonnement. Vous pouvez annuler à tout moment dans les paramètres de votre compte.
            </p>
          </form>
        ) : null}
      </div>

      {/* ══ BLOC 4 : Historique des factures ══ */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-heading text-base font-semibold text-foreground mb-5">
          {t("subs.invoices.title")}
        </h3>

        {isLoadingFactures ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full rounded" />)}
          </div>
        ) : (
          <>
            {/* Bannière d'alerte si au moins une facture est échouée */}
            {factures.some(f => f.statut === 'échoué') && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 mb-4">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive">{t("factures.payFailed")}</p>
                  <p className="text-xs text-destructive/80 mt-0.5">{t("factures.payFailedDesc")}</p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("subs.invoices.date")}</TableHead>
                    <TableHead>{t("subs.invoices.description")}</TableHead>
                    <TableHead className="text-right">{t("subs.invoices.amount")}</TableHead>
                    <TableHead className="text-center">{t("subs.invoices.status")}</TableHead>
                    <TableHead className="text-center">{t("subs.invoices.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factures.map(facture => {
                    const cfg = statutConfig[facture.statut];
                    const { Icone } = cfg;
                    return (
                      <TableRow key={facture.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(facture.date)}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          {facture.description}
                        </TableCell>
                        <TableCell className="text-sm font-mono font-medium text-foreground text-right tabular-nums">
                          {formatGnf(facture.montant_gnf)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                              cfg.classes
                            )}>
                              <Icone className="h-3 w-3" />
                              {facture.statut === 'payé'
                                ? t("subs.invoices.paid")
                                : facture.statut === 'en_attente'
                                  ? t("subs.invoices.pending")
                                  : t("subs.invoices.failed")}
                            </span>
                            {/* Bouton "Réessayer" pour les factures échouées */}
                            {facture.statut === 'échoué' && (
                              <button
                                onClick={() => handleRetryPayment(facture.id)}
                                className="mt-1 inline-flex items-center gap-1 rounded-lg bg-destructive/10 border border-destructive/30 px-2 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/20 transition-colors"
                              >
                                <RefreshCw className="h-3 w-3" /> {t("factures.payRetry")}
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => { downloadFacture(facture, lang); toast.info(t("factures.toastDownload")); }}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label={t("factures.toastDownload")}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
