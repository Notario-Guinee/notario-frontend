// ═══════════════════════════════════════════════════════════════
// Composant racine de l'application Notario
// Configure les providers globaux (thème, langue, rôle, sidebar,
// React Query) et définit toutes les routes client-side
// ═══════════════════════════════════════════════════════════════

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { RoleProvider } from "@/context/RoleContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
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
import RegisterTenant from "./pages/RegisterTenant";

// Instance unique du client React Query
const queryClient = new QueryClient();

/**
 * Garde de route — redirige vers /login si l'utilisateur n'est pas connecté
 * Utilisé pour protéger toutes les routes du dashboard
 */
function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginTenant />,
  },
  {
    path: "/admin/login",
    element: <LoginAdmin />,
  },
  {
    path: "/client/login",
    element: <LoginPortailClient />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/espace-client",
    element: <EspaceClient />,
  },
  {
    path: "/inscription-client",
    element: <InscriptionClient />,
    },
    {
      path: "/register",
      element: <RegisterTenant />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "dashboard", element: <Dashboard /> },
          { path: "clients", element: <Clients /> },
          { path: "dossiers", element: <Dossiers /> },
          { path: "types-actions", element: <TypesActions /> },
          { path: "actes", element: <ActesSignatures /> },
          { path: "factures", element: <Factures /> },
          { path: "kanban", element: <Kanban /> },
          { path: "synthese", element: <SyntheseFinanciere /> },
          { path: "agenda", element: <Agenda /> },
          { path: "paiements", element: <Paiements /> },
          { path: "comptes", element: <ComptesBancaires /> },
          { path: "caisse", element: <Caisse /> },
          { path: "tarifs", element: <Tarifs /> },
          { path: "archives-numeriques", element: <ArchivesNumeriques /> },
          { path: "archives-physiques", element: <ArchivesPhysiques /> },
          { path: "modeles", element: <ModelesDocuments /> },
          { path: "messagerie", element: <Messagerie /> },
          { path: "notifications", element: <NotificationsPage /> },
          { path: "formation", element: <Formation /> },
          { path: "portail", element: <PortailClient /> },
          { path: "administration", element: <Administration /> },
          { path: "utilisateurs", element: <Utilisateurs /> },
          { path: "cabinet", element: <MonCabinet /> },
          { path: "admin/dashboard", element: <AdminDashboard /> },
          { path: "admin/tenants", element: <AdminTenantsPage /> },
          { path: "admin/modules", element: <AdminModulesOffres /> },
          { path: "admin/leads", element: <AdminLeadsPage /> },
          { path: "admin/licenses", element: <AdminLicenses /> },
          { path: "admin/users", element: <AdminUsersGlobal /> },
          { path: "admin/roles", element: <AdminRoles /> },
          { path: "admin/audit", element: <AdminAudit /> },
          { path: "admin/billing", element: <AdminBilling /> },
          { path: "admin/monitoring", element: <AdminMonitoring /> },
          { path: "admin/security", element: <AdminSecurityPolicies /> },
        ]
      }
    ]
  },
  {
    path: "*",
    element: <NotFound />,
  }
// @ts-ignore
], {
  future: {
    // @ts-ignore
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  }
});

/**
 * Composant racine — enveloppe l'arbre avec tous les providers
 * et définit la structure de routage de l'application
 */
const App = () => (
  <ThemeProvider>
    <LanguageProvider>
    {/* AuthProvider ajouté pour gérer l'authentification JWT avec le backend */}
    <AuthProvider>
    <RoleProvider>
    <SidebarProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Systèmes de notifications toast */}
        <Toaster />
        <Sonner />
        {/* @ts-ignore */}
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </TooltipProvider>
    </QueryClientProvider>
    </SidebarProvider>
    </RoleProvider>
    </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
