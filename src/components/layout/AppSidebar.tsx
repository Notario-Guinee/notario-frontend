// ═══════════════════════════════════════════════════════════════
// Sidebar principale — Menu de navigation latéral
// Affiche les groupes de navigation selon le rôle actif (gérant
// ou admin global), avec logo, switcher de rôle et profil
// ═══════════════════════════════════════════════════════════════

import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { currentUser } from "@/data/mockData";
import { useSidebarState } from "@/context/SidebarContext";
import { useLanguage } from "@/context/LanguageContext";
import { useRole } from "@/context/RoleContext";
import {
  LayoutDashboard, Users, FolderOpen, Calendar, CheckSquare,
  Receipt, CreditCard, Landmark, Wallet, BarChart3, Settings,
  Search, Package, FileText, MessageSquare, Bell,
  GraduationCap, Globe, Building2, UserCog, Shield,
  ChevronLeft, ChevronRight, Scale, Activity, Key, Megaphone, Monitor, HardDrive,
} from "lucide-react";

/** Structure d'un élément de navigation */
interface NavItem { title: string; path: string; icon: React.ElementType; badge?: number; }
/** Structure d'un groupe de navigation */
interface NavGroup { label: string; items: NavItem[]; }

export function AppSidebar() {
  const { collapsed, toggle } = useSidebarState();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const { isAdminGlobal, role, setRole } = useRole();

  // ─── Navigation du gérant ───
  const gerantGroups: NavGroup[] = [
    { label: t("navGroup.home"), items: [{ title: t("nav.dashboard"), path: "/dashboard", icon: LayoutDashboard }] },
    {
      label: t("navGroup.business"),
      items: [
        { title: t("nav.clients"), path: "/clients", icon: Users },
        { title: t("nav.dossiers"), path: "/dossiers", icon: FolderOpen },
        { title: t("nav.typesActions"), path: "/types-actions", icon: Scale },
        { title: t("nav.actesSignatures"), path: "/actes", icon: FileText },
        { title: t("nav.agenda"), path: "/agenda", icon: Calendar },
        { title: t("nav.kanban"), path: "/kanban", icon: CheckSquare },
      ],
    },
    {
      label: t("navGroup.finance"),
      items: [
        { title: t("nav.factures"), path: "/factures", icon: Receipt },
        { title: t("nav.paiements"), path: "/paiements", icon: CreditCard },
        { title: t("nav.comptes"), path: "/comptes", icon: Landmark },
        { title: t("nav.caisse"), path: "/caisse", icon: Wallet },
        { title: t("nav.synthese"), path: "/synthese", icon: BarChart3 },
        { title: t("nav.tarifs"), path: "/tarifs", icon: Settings },
      ],
    },
    {
      label: t("navGroup.documents"),
      items: [
        { title: t("nav.archivesNumeriques"), path: "/archives-numeriques", icon: Search },
        { title: t("nav.archivesPhysiques"), path: "/archives-physiques", icon: Package },
        { title: t("nav.modeles"), path: "/modeles", icon: FileText },
      ],
    },
    {
      label: t("navGroup.communication"),
      items: [
        { title: t("nav.messagerie"), path: "/messagerie", icon: MessageSquare, badge: 3 },
        { title: t("nav.notifications"), path: "/notifications", icon: Bell, badge: 5 },
        { title: t("nav.formation"), path: "/formation", icon: GraduationCap },
      ],
    },
    { label: t("navGroup.portal"), items: [{ title: t("nav.portail"), path: "/portail", icon: Globe }] },
    {
      label: t("navGroup.cabinet"),
      items: [
        { title: t("sidebar.cabinetProfile"), path: "/administration?tab=cabinet", icon: Building2 },
        { title: t("sidebar.users"), path: "/utilisateurs", icon: Users },
        { title: t("sidebar.storageplan"), path: "/stockage", icon: HardDrive },
        { title: t("sidebar.auditLog"), path: "/administration?tab=audit", icon: Shield },
        { title: t("sidebar.securityAccess"), path: "/administration?tab=securite", icon: UserCog },
        { title: t("sidebar.settings"), path: "/administration?tab=parametres", icon: Settings },
      ],
    },
  ];

  // ─── Navigation de l'administrateur global ───
  const adminGroups: NavGroup[] = [
    { label: t("navGroup.adminDashboard"), items: [{ title: t("sidebar.adminOverview"), path: "/admin/dashboard", icon: LayoutDashboard }] },
    {
      label: t("navGroup.adminPlatform"),
      items: [
        { title: t("sidebar.adminTenants"), path: "/admin/tenants", icon: Building2 },
        { title: t("sidebar.adminModulesPlans"), path: "/admin/modules", icon: Package },
        { title: t("sidebar.adminBilling"), path: "/admin/billing", icon: Receipt },
        { title: t("sidebar.adminLicenses"), path: "/admin/licenses", icon: Key },
        { title: t("sidebar.adminMonitoring"), path: "/admin/monitoring", icon: Monitor },
      ],
    },
    {
      label: t("navGroup.adminUsersAccess"),
      items: [
        { title: t("sidebar.adminGlobalUsers"), path: "/admin/users", icon: Users },
        { title: t("sidebar.adminRoles"), path: "/admin/roles", icon: UserCog },
      ],
    },
    {
      label: t("navGroup.adminSales"),
      items: [
        { title: t("sidebar.adminLeadsDemons"), path: "/admin/leads", icon: Megaphone },
      ],
    },
    {
      label: t("navGroup.adminSecurity"),
      items: [
        { title: t("sidebar.adminSecurityPolicies"), path: "/admin/security", icon: Shield },
        { title: t("sidebar.adminAuditLog"), path: "/admin/audit", icon: Shield },
      ],
    },
  ];

  // Sélectionner les groupes selon le rôle actif
  const navGroups = isAdminGlobal ? adminGroups : gerantGroups;

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
      collapsed ? "w-[72px]" : "w-[260px]"
    )}>
      {/* ═══ Logo et nom de l'application ═══ */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4 shrink-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-blue">
          <Scale className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-heading text-sm font-bold text-foreground truncate">Notario</h1>
            <p className="text-[10px] text-muted-foreground truncate">{isAdminGlobal ? t("sidebar.adminGlobal") : currentUser.cabinet}</p>
          </div>
        )}
      </div>

      {/* ═══ Sélecteur de rôle (Gérant / Admin) ═══ */}
      <div className="shrink-0 border-b border-border p-2">
        <div className={cn("flex rounded-lg bg-muted p-0.5", collapsed && "flex-col")}>
          <button
            onClick={() => setRole("gerant")}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-[10px] font-semibold transition-colors",
              !isAdminGlobal ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
            title="Gérant"
            aria-pressed={!isAdminGlobal}
          >
            {collapsed ? "G" : t("sidebar.adminGerant")}
          </button>
          <button
            onClick={() => setRole("admin_global")}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-[10px] font-semibold transition-colors",
              isAdminGlobal ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
            title="Admin Global"
            aria-pressed={isAdminGlobal}
          >
            {collapsed ? "A" : "Admin"}
          </button>
        </div>
      </div>

      {/* ═══ Groupes de navigation ═══ */}
      <nav id="sidebar-nav" className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-3">
            {/* Label du groupe (masqué en mode réduit) */}
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
            )}
            {collapsed && <div className="mx-2 mb-1 h-px bg-border" />}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                // Vérifier si le lien est actif (support des query params)
                const isActive = item.path.includes("?")
                  ? location.pathname + location.search === item.path
                  : location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      title={collapsed ? item.title : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                        isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.title}</span>
                          {/* Badge de notification */}
                          {item.badge && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ═══ Section utilisateur connecté ═══ */}
      <div className="shrink-0 border-t border-border p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-heading text-xs font-bold",
            isAdminGlobal ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
          )}>
            {isAdminGlobal ? "A" : currentUser.firstName.charAt(0)}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{isAdminGlobal ? "Super Admin" : currentUser.name}</p>
              <p className="text-[10px] text-muted-foreground">{isAdminGlobal ? "Admin Global" : currentUser.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Bouton de réduction/extension de la sidebar ═══ */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground shadow-sm transition-colors z-50"
        aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
        aria-expanded={!collapsed}
        aria-controls="sidebar-nav"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
