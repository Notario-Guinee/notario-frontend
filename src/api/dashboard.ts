import { apiClient } from '@/lib/apiClient';

export interface GlobalStats {
  nombreDossiersTotal: number;
  nombreDossiersActifs: number;
  nombreDossiersMois: number;
  evolutionDossiers: number;
  nombreClientsTotal: number;
  nombreClientsActifs: number;
  nombreNouveauxClients: number;
  chiffreAffairesMois: number;
  chiffreAffairesAnnee: number;
  honorairesEncaisses: number;
  soldeCaisse: number;
  evolutionCA: number;
  nombreFactures: number;
  nombreFacturesPayees: number;
  montantFacturesPendantes: number;
  tauxRecouvrement: number;
  evolutionMensuelle: Record<string, unknown>;
  repartitionTypeActes: Record<string, unknown>;
  nombreAlertes: number;
  nombreNotifications: number;
  dossiersBlocants: number;
  facturesEnRetard: number;
}

export interface Notification {
  id: number;
  type: string;
  action: string;
  detail: string;
  time: string;
  lu: boolean;
}

export interface DashboardUser {
  statistiques: Record<string, unknown>;
  widgets: DashboardWidget[];
  preferences?: Record<string, unknown>;
}

export interface DashboardWidget {
  id: number;
  titre: string;
  typeWidget: string;
  actif: boolean;
  largeur?: number;
  hauteur?: number;
  positionX?: number;
  positionY?: number;
  donnees?: Record<string, unknown>;
}

const BASE = '/api/dashboard';

// ─── Dashboard utilisateur ───
export const getDashboardUser = (userId: number) =>
  apiClient.get<DashboardUser>(`${BASE}/user/${userId}`);

export const refreshDashboard = (userId: number) =>
  apiClient.post<DashboardUser>(`${BASE}/user/${userId}/refresh`);

export const resetDashboard = (userId: number) =>
  apiClient.post<DashboardUser>(`${BASE}/user/${userId}/reset`);

// ─── Statistiques globales ───
export const getGlobalStats = () =>
  apiClient.get<GlobalStats>(`${BASE}/statistics/global`);

export const getKPIs = () =>
  apiClient.get<Record<string, unknown>>(`${BASE}/kpi`);

// ─── Notifications ───
export const getRecentNotifications = (userId: number) =>
  apiClient.get<Notification[]>(`${BASE}/user/${userId}/notifications`);

// ─── Widget data ───
export const getWidgetData = (widgetId: number) =>
  apiClient.get<Record<string, unknown>>(`${BASE}/widget/${widgetId}/data`);

// ─── Statistiques par période ───
export const getStatistiquesPeriode = (dateDebut: string, dateFin: string) =>
  apiClient.get<Record<string, unknown>>(`${BASE}/statistics/period?dateDebut=${encodeURIComponent(dateDebut)}&dateFin=${encodeURIComponent(dateFin)}`);

// ─── Alertes actives ───
export const getActiveAlerts = (userId: number) =>
  apiClient.get<Record<string, unknown>[]>(`${BASE}/user/${userId}/alerts`);

// ─── Marquer notifications lues ───
export const marquerNotificationsLues = (ids: number[]) =>
  apiClient.post<void>(`${BASE}/notifications/mark-read`, ids);

// ─── Tendances ───
export const analyserTendances = (dateDebut: string, dateFin: string) =>
  apiClient.get<Record<string, unknown>>(`${BASE}/analysis/trends?dateDebut=${encodeURIComponent(dateDebut)}&dateFin=${encodeURIComponent(dateFin)}`);

// ─── Prévisions ───
export const calculerPrevisions = () =>
  apiClient.get<Record<string, unknown>>(`${BASE}/analysis/forecasts`);

// ─── Comparaison de performances ───
export const comparerPerformances = (dateDebut: string, dateFin: string) =>
  apiClient.get<Record<string, unknown>>(`${BASE}/analysis/performance?dateDebut=${encodeURIComponent(dateDebut)}&dateFin=${encodeURIComponent(dateFin)}`);

// ─── Configuration dashboard ───
export const getConfigurationDashboard = (userId: number) =>
  apiClient.get<Record<string, unknown>>(`${BASE}/user/${userId}/configuration`);

export const sauvegarderConfiguration = (userId: number, config: Record<string, unknown>) =>
  apiClient.post<void>(`${BASE}/user/${userId}/configuration`, config);

// ─── Export dashboard ───
export const exporterDonneesDashboard = (userId: number, format: string = 'PDF') =>
  apiClient.get<Blob>(`${BASE}/user/${userId}/export?format=${encodeURIComponent(format)}`);

// ─── Refresh widget individuel ───
export const refreshWidget = (widgetId: number) =>
  apiClient.post<Record<string, unknown>>(`${BASE}/widget/${widgetId}/refresh`);

// ─── Données temps réel de plusieurs widgets ───
export const getRealTimeWidgets = (widgetIds: number[]) =>
  apiClient.post<Record<string, unknown>>(`${BASE}/widgets/realtime`, widgetIds);

// ─── Maintenance ───
export const actualiserToutesLesDonnees = () =>
  apiClient.post<void>(`${BASE}/maintenance/refresh-all`);

export const nettoyerDonneesObsoletes = () =>
  apiClient.post<void>(`${BASE}/maintenance/cleanup`);

export const recalculerStatistiques = () =>
  apiClient.post<void>(`${BASE}/maintenance/recalculate`);
