// ═══════════════════════════════════════════════════════════════
// Composant racine de l'application Notario
// Configure les providers globaux (thème, langue, rôle, sidebar,
// React Query) et définit toutes les routes client-side
// ═══════════════════════════════════════════════════════════════

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { RoleProvider } from "@/context/RoleContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// ─── Pages principales de l'application ───
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Dossiers from "./pages/Dossiers";
import TypesActions from "./pages/TypesActions";
import ActesSignatures from "./pages/ActesSignatures";
import Factures from "./pages/Factures";
import Kanban from "./pages/Kanban";
import SyntheseFinanciere from "./pages/SyntheseFinanciere";
import Agenda from "./pages/Agenda";
import Paiements from "./pages/Paiements";
import ComptesBancaires from "./pages/ComptesBancaires";
import Caisse from "./pages/Caisse";
import Tarifs from "./pages/Tarifs";
import ArchivesNumeriques from "./pages/ArchivesNumeriques";
import ArchivesPhysiques from "./pages/ArchivesPhysiques";
import ModelesDocuments from "./pages/ModelesDocuments";
import Messagerie from "./pages/Messagerie";
import NotificationsPage from "./pages/NotificationsPage";
import Formation from "./pages/Formation";
import PortailClient from "./pages/PortailClient";
import Administration from "./pages/Administration";
import Utilisateurs from "./pages/Utilisateurs";
import MonCabinet from "./pages/MonCabinet";
import NotFound from "./pages/NotFound";

// ─── Pages d'administration globale ───
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTenantsPage from "./pages/admin/AdminTenantsPage";
import AdminModulesOffres from "./pages/admin/AdminModulesOffres";
import AdminLeadsPage from "./pages/admin/AdminLeadsPage";
import AdminLicenses from "./pages/admin/AdminLicenses";
import AdminUsersGlobal from "./pages/admin/AdminUsersGlobal";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminMonitoring from "./pages/AdminMonitoring";
import AdminSecurityPolicies from "./pages/admin/AdminSecurityPolicies";

// ─── Pages d'authentification ───
import LoginTenant from "./pages/LoginTenant";
import LoginAdmin from "./pages/LoginAdmin";
import LoginPortailClient from "./pages/LoginPortailClient";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// ─── Espace client (portail externe) ───
import EspaceClient from "./pages/EspaceClient";
import InscriptionClient from "./pages/InscriptionClient";

// Instance unique du client React Query
const queryClient = new QueryClient();

/**
 * Composant racine — enveloppe l'arbre avec tous les providers
 * et définit la structure de routage de l'application
 */
const App = () => (
  <ThemeProvider>
    <LanguageProvider>
    <RoleProvider>
    <SidebarProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Systèmes de notifications toast */}
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* ═══ Pages d'authentification (hors layout principal) ═══ */}
            <Route path="/login" element={<LoginTenant />} />
            <Route path="/admin/login" element={<LoginAdmin />} />
            <Route path="/client/login" element={<LoginPortailClient />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ═══ Portail client (hors layout dashboard) ═══ */}
            <Route path="/espace-client" element={<EspaceClient />} />
            <Route path="/inscription-client" element={<InscriptionClient />} />

            {/* ═══ Routes protégées avec layout Dashboard ═══ */}
            <Route element={<DashboardLayout />}>
              {/* Routes du gérant */}
              <Route index element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/dossiers" element={<Dossiers />} />
              <Route path="/types-actions" element={<TypesActions />} />
              <Route path="/actes" element={<ActesSignatures />} />
              <Route path="/factures" element={<Factures />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/synthese" element={<SyntheseFinanciere />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/paiements" element={<Paiements />} />
              <Route path="/comptes" element={<ComptesBancaires />} />
              <Route path="/caisse" element={<Caisse />} />
              <Route path="/tarifs" element={<Tarifs />} />
              <Route path="/archives-numeriques" element={<ArchivesNumeriques />} />
              <Route path="/archives-physiques" element={<ArchivesPhysiques />} />
              <Route path="/modeles" element={<ModelesDocuments />} />
              <Route path="/messagerie" element={<Messagerie />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/formation" element={<Formation />} />
              <Route path="/portail" element={<PortailClient />} />
              <Route path="/administration" element={<Administration />} />
              <Route path="/utilisateurs" element={<Utilisateurs />} />
              <Route path="/cabinet" element={<MonCabinet />} />

              {/* Routes d'administration globale */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/tenants" element={<AdminTenantsPage />} />
              <Route path="/admin/modules" element={<AdminModulesOffres />} />
              <Route path="/admin/leads" element={<AdminLeadsPage />} />
              <Route path="/admin/licenses" element={<AdminLicenses />} />
              <Route path="/admin/users" element={<AdminUsersGlobal />} />
              <Route path="/admin/roles" element={<AdminRoles />} />
              <Route path="/admin/audit" element={<AdminAudit />} />
              <Route path="/admin/billing" element={<AdminBilling />} />
              <Route path="/admin/monitoring" element={<AdminMonitoring />} />
              <Route path="/admin/security" element={<AdminSecurityPolicies />} />
            </Route>

            {/* Page 404 — route de secours */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </SidebarProvider>
    </RoleProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
