// ═══════════════════════════════════════════════════════════════
// Composant racine de l'application Notario
// Configure les providers globaux (thème, langue, rôle, sidebar,
// React Query, DossierTabs et ActeSteps) et définit toutes les routes client-side
// ═══════════════════════════════════════════════════════════════

import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { RoleProvider } from "@/context/RoleContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DossierTabsProvider } from "@/context/DossierTabsContext";
import { ActeStepsProvider } from "@/context/ActeStepsContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageLoader } from "@/components/ui/loading-spinner";

// ─── Pages d'authentification ───
const LoginTenant         = lazy(() => import("./pages/LoginTenant"));
const ForgotPassword      = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword       = lazy(() => import("./pages/ResetPassword"));
const ActivationCompte    = lazy(() => import("./pages/ActivationCompte"));

// ─── Portail client ───
const EspaceClient      = lazy(() => import("./pages/EspaceClient"));
const InscriptionClient = lazy(() => import("./pages/InscriptionClient"));
const PortailClient     = lazy(() => import("./pages/PortailClient"));

// ─── Pages principales du gérant ───
const Dashboard         = lazy(() => import("./pages/Dashboard"));
const Clients           = lazy(() => import("./pages/Clients"));
const Dossiers          = lazy(() => import("./pages/Dossiers"));
const DocumentsPage     = lazy(() => import("./pages/DocumentsPage"));
const DocumentEditorPage       = lazy(() => import("./pages/DocumentEditorPage"));
const DocumentVersionsPage     = lazy(() => import("./pages/DocumentVersionsPage"));
const DocumentCollaboratorsPage = lazy(() => import("./pages/DocumentCollaboratorsPage"));
const DossierDocumentsPage      = lazy(() => import("./pages/DossierDocumentsPage"));
const TypesActions      = lazy(() => import("./pages/TypesActions"));
const ActesSignatures   = lazy(() => import("./pages/ActesSignatures"));
const Factures          = lazy(() => import("./pages/Factures"));
const Kanban            = lazy(() => import("./pages/Kanban"));
const SyntheseFinanciere = lazy(() => import("./pages/SyntheseFinanciere"));
const Agenda            = lazy(() => import("./pages/Agenda"));
const Paiements         = lazy(() => import("./pages/Paiements"));
const ComptesBancaires  = lazy(() => import("./pages/ComptesBancaires"));
const Caisse            = lazy(() => import("./pages/Caisse"));
const Tarifs            = lazy(() => import("./pages/Tarifs"));
const Messagerie        = lazy(() => import("./pages/Messagerie"));
const Emails            = lazy(() => import("./pages/Emails"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const Formation         = lazy(() => import("./pages/Formation"));
const Administration    = lazy(() => import("./pages/Administration"));
const Utilisateurs      = lazy(() => import("./pages/Utilisateurs"));
const Conges            = lazy(() => import("./pages/Conges"));
const MonCabinet        = lazy(() => import("./pages/MonCabinet"));
const StockagePage      = lazy(() => import("./components/stockage/StockagePage"));

// ─── Pages archives & documents ───
const ArchivesNumeriques = lazy(() => import("./pages/ArchivesNumeriques"));
const ArchivesPhysiques  = lazy(() => import("./pages/ArchivesPhysiques"));
const ModelesDocuments   = lazy(() => import("./pages/ModelesDocuments"));

// ─── Pages d'administration globale ───
const AdminDashboard        = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminTenantsPage      = lazy(() => import("./pages/admin/AdminTenantsPage"));
const AdminModulesOffres    = lazy(() => import("./pages/admin/AdminModulesOffres"));
const AdminLeadsPage        = lazy(() => import("./pages/admin/AdminLeadsPage"));
const AdminLicenses         = lazy(() => import("./pages/admin/AdminLicenses"));
const AdminUsersGlobal      = lazy(() => import("./pages/admin/AdminUsersGlobal"));
const AdminRoles            = lazy(() => import("./pages/admin/AdminRoles"));
const AdminAudit            = lazy(() => import("./pages/admin/AdminAudit"));
const AdminBilling          = lazy(() => import("./pages/admin/AdminBilling"));
const AdminMonitoring       = lazy(() => import("./pages/AdminMonitoring"));
const AdminSecurityPolicies = lazy(() => import("./pages/admin/AdminSecurityPolicies"));

// ─── Page 404 ───
const NotFound = lazy(() => import("./pages/NotFound"));

// Instance unique du client React Query
const queryClient = new QueryClient();

// ─── Protection des routes privées ───
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuth = localStorage.getItem("notario_auth") === "true";
  if (!isAuth) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ─── Garde de route avec AuthContext ───
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// ─── Redirige les utilisateurs déjà connectés hors de la page login ───
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    const role = user?.role?.toUpperCase();
    if (role === "ADMIN" || role === "SUPER_ADMIN") return <Navigate to="/admin/dashboard" replace />;
    if (role === "CLIENT") return <Navigate to="/espace-client" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

// ─── Portail client protégé ───
function ClientRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login?portal=client" replace />;
  const role = user?.role?.toUpperCase();
  if (role !== "CLIENT") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ─── Composant racine ───
const App = () => (
  <ThemeProvider>
    {/* AuthProvider ajouté pour gérer l'authentification JWT avec le backend */}
    <AuthProvider>
    <RoleProvider>
    <SidebarProvider>
    <DossierTabsProvider>
    <ActeStepsProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Systèmes de notifications toast */}
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ═══ Pages d'authentification (hors layout principal) ═══ */}
              <Route path="/login"           element={<LoginTenant />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password"  element={<ResetPassword />} />
              <Route path="/activation-compte" element={<ActivationCompte />} />

              {/* ═══ Portail client (hors layout dashboard) ═══ */}
              <Route path="/espace-client"      element={<EspaceClient />} />
              <Route path="/inscription-client" element={<InscriptionClient />} />

              {/* ═══ Routes protégées avec layout Dashboard ═══ */}
              <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
                {/* Routes du gérant */}
                <Route index                      element={<Dashboard />} />
                <Route path="/dashboard"          element={<Dashboard />} />
                <Route path="/clients"            element={<Clients />} />
                <Route path="/dossiers"           element={<Dossiers />} />
                <Route path="/documents"          element={<DocumentsPage />} />
                <Route path="/documents/:documentId" element={<DocumentEditorPage />} />
                <Route path="/documents/:documentId/versions" element={<DocumentVersionsPage />} />
                <Route path="/documents/:documentId/collaborateurs" element={<DocumentCollaboratorsPage />} />
                <Route path="/documents/dossier/:dossierId" element={<DossierDocumentsPage />} />
                <Route path="/types-actions"      element={<TypesActions />} />
                <Route path="/actes"              element={<ActesSignatures />} />
                <Route path="/factures"           element={<Factures />} />
                <Route path="/kanban"             element={<Kanban />} />
                <Route path="/synthese"           element={<SyntheseFinanciere />} />
                <Route path="/agenda"             element={<Agenda />} />
                <Route path="/paiements"          element={<Paiements />} />
                <Route path="/comptes"            element={<ComptesBancaires />} />
                <Route path="/caisse"             element={<Caisse />} />
                <Route path="/tarifs"             element={<Tarifs />} />
                <Route path="/archives-numeriques" element={<ArchivesNumeriques />} />
                <Route path="/archives-physiques"  element={<ArchivesPhysiques />} />
                <Route path="/modeles"            element={<ModelesDocuments />} />
                <Route path="/messagerie"         element={<Messagerie />} />
                <Route path="/emails"             element={<Emails />} />
                <Route path="/notifications"      element={<NotificationsPage />} />
                <Route path="/formation"          element={<Formation />} />
                <Route path="/portail"            element={<PortailClient />} />
                <Route path="/administration"     element={<Administration />} />
                <Route path="/utilisateurs"       element={<Utilisateurs />} />
                <Route path="/conges"             element={<Conges />} />
                <Route path="/cabinet"            element={<MonCabinet />} />
                {/* Gestion du stockage et de l'abonnement */}
                <Route path="/stockage"           element={<StockagePage />} />

                {/* Routes d'administration globale */}
                <Route path="/admin/dashboard"  element={<AdminDashboard />} />
                <Route path="/admin/tenants"    element={<AdminTenantsPage />} />
                <Route path="/admin/modules"    element={<AdminModulesOffres />} />
                <Route path="/admin/leads"      element={<AdminLeadsPage />} />
                <Route path="/admin/licenses"   element={<AdminLicenses />} />
                <Route path="/admin/users"      element={<AdminUsersGlobal />} />
                <Route path="/admin/roles"      element={<AdminRoles />} />
                <Route path="/admin/audit"      element={<AdminAudit />} />
                <Route path="/admin/billing"    element={<AdminBilling />} />
                <Route path="/admin/monitoring" element={<AdminMonitoring />} />
                <Route path="/admin/security"   element={<AdminSecurityPolicies />} />
              </Route>

              {/* Page 404 — route de secours */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ActeStepsProvider>
    </DossierTabsProvider>
    </SidebarProvider>
    </RoleProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;