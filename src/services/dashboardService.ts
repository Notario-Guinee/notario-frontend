// ═══════════════════════════════════════════════════════════════
// Service Dashboard — Centralise les statistiques et indicateurs
// Basé sur les endpoints de DashboardController.java
// ═══════════════════════════════════════════════════════════════

const getHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };
  
  const BASE = "/api/dashboard";
  
  export interface GlobalStats {
    nombreDossiersTotal: number;
    nombreDossiersActifs: number;
    nombreDossiersTermines: number;
    nombreDossiersMois: number;
    evolutionDossiers: number;
    nombreClientsTotal: number;
    nombreClientsActifs: number;
    nombreNouveauxClients: number;
    tauxFidelisation: number;
    chiffreAffairesMois: number;
    chiffreAffairesAnnee: number;
    honorairesEncaisses: number;
    soldeCaisse: number;
    evolutionCA: number;
    nombreFactures: number;
    nombreFacturesPayees: number;
    montantFacturesPendantes: number;
    tauxRecouvrement: number;
    nombreDebours?: number;
    montantDeboursAvances?: number;
    montantDeboursRembourses?: number;
    montantDeboursEnAttente?: number;
    delaiMoyenTraitement?: number;
    tauxRespectDelais?: number;
    satisfactionClient?: number;
    evolutionMensuelle: Record<string, any>;
    repartitionTypeActes: Record<string, any>;
    nombreAlertes: number;
    nombreNotifications: number;
    dossiersBlocants: number;
    facturesEnRetard: number;
    periodeMaj?: string;
  }
  
  export interface Notification {
    id: number;
    type: string;
    action: string;
    detail: string;
    time: string;
    lu: boolean;
  }

  export interface DashboardConfig {
    userId: number;
    layout: any;
    widgets: any[];
    preferences: any;
  }

  // ─── Aide à la gestion des réponses ───
  async function handleResponse(res: Response) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok || (data && data.success === false)) {
      throw new Error(data.message || `Erreur Dashboard (Status: ${res.status})`);
    }
    return data;
  }
  
  // ─── DASHBOARD UTILISATEUR ───
  export async function getDashboardUser(userId: number): Promise<any> {
    const res = await fetch(`${BASE}/user/${userId}`, { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }

  export async function actualiserDashboard(userId: number): Promise<any> {
    const res = await fetch(`${BASE}/user/${userId}/refresh`, { method: "POST", headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }

  export async function reinitialiserDashboard(userId: number): Promise<any> {
    const res = await fetch(`${BASE}/user/${userId}/reset`, { method: "POST", headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }

  // ─── STATISTIQUES GLOBALES ───
  export async function getGlobalStats(): Promise<GlobalStats> {
    const res = await fetch(`${BASE}/statistics/global`, { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }

  export async function getStatistiquesPeriode(dateDebut: string, dateFin: string): Promise<GlobalStats> {
    const res = await fetch(`${BASE}/statistics/period?dateDebut=${dateDebut}&dateFin=${dateFin}`, { 
      headers: getHeaders() 
    });
    const data = await handleResponse(res);
    return data.data;
  }
  
  export async function getKPIs(): Promise<Record<string, any>> {
    const res = await fetch(`${BASE}/kpi`, { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }

  // ─── DONNÉES WIDGETS ───
  export async function getWidgetData(widgetId: number): Promise<Record<string, any>> {
    const res = await fetch(`${BASE}/widget/${widgetId}/data`, { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }

  export async function refreshWidget(widgetId: number): Promise<Record<string, any>> {
    const res = await fetch(`${BASE}/widget/${widgetId}/refresh`, { method: "POST", headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }

  export async function getRealTimeWidgets(widgetIds: number[]): Promise<Record<string, any>> {
    const res = await fetch(`${BASE}/widgets/realtime`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(widgetIds)
    });
    const data = await handleResponse(res);
    return data.data;
  }
  
  // ─── NOTIFICATIONS ET ALERTES ───
  export async function getRecentNotifications(userId: number): Promise<Notification[]> {
    const res = await fetch(`${BASE}/user/${userId}/notifications`, { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }
  
  export async function getActiveAlerts(userId: number): Promise<any[]> {
    const res = await fetch(`${BASE}/user/${userId}/alerts`, { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }

  export async function marquerNotificationsLues(notificationIds: number[]): Promise<void> {
    const res = await fetch(`${BASE}/notifications/mark-read`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(notificationIds)
    });
    await handleResponse(res);
  }

  // ─── ANALYSE ET TENDANCES ───
  export async function analyserTendances(dateDebut: string, dateFin: string): Promise<Record<string, any>> {
    const res = await fetch(`${BASE}/analysis/trends?dateDebut=${dateDebut}&dateFin=${dateFin}`, { 
      headers: getHeaders() 
    });
    const data = await handleResponse(res);
    return data.data;
  }

  export async function calculerPrevisions(): Promise<Record<string, any>> {
    const res = await fetch(`${BASE}/analysis/forecasts`, { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }

  export async function comparerPerformances(dateDebut: string, dateFin: string): Promise<Record<string, any>> {
    const res = await fetch(`${BASE}/analysis/performance?dateDebut=${dateDebut}&dateFin=${dateFin}`, { 
      headers: getHeaders() 
    });
    const data = await handleResponse(res);
    return data.data;
  }

  // ─── CONFIGURATION ───
  export async function sauvegarderConfiguration(userId: number, configuration: any): Promise<void> {
    const res = await fetch(`${BASE}/user/${userId}/configuration`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(configuration)
    });
    await handleResponse(res);
  }

  export async function getConfigurationDashboard(userId: number): Promise<any> {
    const res = await fetch(`${BASE}/user/${userId}/configuration`, { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.data;
  }

  // ─── EXPORT ───
  export async function exporterDonneesDashboard(userId: number, format: "PDF" | "EXCEL" | "CSV" = "PDF"): Promise<Blob> {
    const res = await fetch(`${BASE}/user/${userId}/export?format=${format}`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Erreur lors de l'export du dashboard");
    return res.blob();
  }

  // ─── MAINTENANCE ───
  export async function actualiserToutesLesDonnees(): Promise<void> {
    const res = await fetch(`${BASE}/maintenance/refresh-all`, { method: "POST", headers: getHeaders() });
    await handleResponse(res);
  }

  export async function nettoyerDonneesObsoletes(): Promise<void> {
    const res = await fetch(`${BASE}/maintenance/cleanup`, { method: "POST", headers: getHeaders() });
    await handleResponse(res);
  }

  export async function recalculerStatistiques(): Promise<void> {
    const res = await fetch(`${BASE}/maintenance/recalculate`, { method: "POST", headers: getHeaders() });
    await handleResponse(res);
  }
