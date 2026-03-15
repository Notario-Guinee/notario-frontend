// ═══════════════════════════════════════════════════════════════
// EspaceFacturation — Onglet "Facturation"
// Bloc 1 : récapitulatif mensuel
// Bloc 2 : informations légales du cabinet
// Bloc 3 : coordonnées bancaires / carte de paiement
// Bloc 4 : historique des factures avec badges statut
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, FormEvent } from 'react';
import { Building2, CreditCard, Loader2, RefreshCw, CheckCircle2, XCircle, Clock, Eye, EyeOff } from 'lucide-react';
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

/** Formate une date ISO en format court */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Configuration du badge de statut de facture */
const statutConfig = {
  payé: {
    classes: 'bg-success/15 text-success border-success/30',
    label: 'Payé',
    Icone: CheckCircle2,
  },
  en_attente: {
    classes: 'bg-warning/15 text-warning border-warning/30',
    label: 'En attente',
    Icone: Clock,
  },
  échoué: {
    classes: 'bg-destructive/15 text-destructive border-destructive/30',
    label: 'Échoué',
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
  const [infos, setInfos] = useState<InfosFacturation | null>(null);
  const [carte, setCarte] = useState<InfosCarteBancaire | null>(null);
  const [factures, setFactures] = useState<LigneFacture[]>([]);
  const [isLoadingInfos, setIsLoadingInfos] = useState(true);
  const [isLoadingCarte, setIsLoadingCarte] = useState(true);
  const [isLoadingFactures, setIsLoadingFactures] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingCarte, setIsSavingCarte] = useState(false);
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
      toast.success('Informations enregistrées avec succès.');
    } catch {
      toast.error("Une erreur est survenue lors de l'enregistrement.");
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
      toast.success('Coordonnées bancaires enregistrées avec succès.');
    } catch {
      toast.error("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSavingCarte(false);
    }
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
            Informations de facturation
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
                <Label htmlFor="raison_sociale">Raison sociale *</Label>
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
                <Label htmlFor="numero_rccm">N° RCCM *</Label>
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
                <Label htmlFor="adresse">Adresse *</Label>
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
                <Label htmlFor="ville">Ville *</Label>
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
                <Label htmlFor="email_facturation">Email de facturation *</Label>
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
                <Label htmlFor="telephone">Téléphone *</Label>
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
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</>
                : 'Enregistrer les informations'
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
            Coordonnées bancaires
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Ces informations sont utilisées pour le prélèvement automatique mensuel de votre abonnement.
          Le CVV n'est jamais conservé après enregistrement.
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
                <Label htmlFor="titulaire">Nom du titulaire *</Label>
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
                <Label htmlFor="numero_carte">Numéro de carte *</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="numero_carte"
                    value={carte.numero_carte}
                    onChange={e => mettreAJourCarte('numero_carte', formaterNumeroCarte(e.target.value))}
                    placeholder="XXXX XXXX XXXX XXXX"
                    maxLength={19}
                    className={cn('pl-10 font-mono tracking-widest', erreursCarte.numero_carte && 'border-destructive')}
                  />
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
                <Label htmlFor="date_expiration">Date d'expiration *</Label>
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
                <Label htmlFor="cvv">CVV / CVC *</Label>
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
                <Label htmlFor="banque_emettrice">Banque émettrice *</Label>
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
                <Label htmlFor="type_carte">Type de carte</Label>
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
              Vos données bancaires sont chiffrées et sécurisées. Le CVV n'est jamais stocké après validation.
            </p>

            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              disabled={isSavingCarte}
            >
              {isSavingCarte
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</>
                : 'Enregistrer les coordonnées bancaires'
              }
            </Button>
          </form>
        ) : null}
      </div>

      {/* ══ BLOC 4 : Historique des factures ══ */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-heading text-base font-semibold text-foreground mb-5">
          Historique des factures
        </h3>

        {isLoadingFactures ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full rounded" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
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
                        <div className="flex items-center justify-center gap-2">
                          <span className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                            cfg.classes
                          )}>
                            <Icone className="h-3 w-3" />
                            {cfg.label}
                          </span>
                          {/* Bouton "Réessayer" pour les factures échouées */}
                          {facture.statut === 'échoué' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[11px] px-2 gap-1"
                              onClick={() => toast.info('Nouvelle tentative de paiement en cours…')}
                            >
                              <RefreshCw className="h-3 w-3" />
                              Réessayer
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
