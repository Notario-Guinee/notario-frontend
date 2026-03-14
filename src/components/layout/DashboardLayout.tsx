// ═══════════════════════════════════════════════════════════════
// Layout principal du tableau de bord
// Structure : sidebar fixe à gauche + barre supérieure + contenu
// La largeur du contenu s'adapte à l'état de la sidebar
// ═══════════════════════════════════════════════════════════════

import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { useSidebarState } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";

/**
 * Layout Dashboard — structure la page avec sidebar, topbar et zone de contenu
 * Le contenu principal est rendu via <Outlet /> (react-router)
 */
export function DashboardLayout() {
  const { collapsed } = useSidebarState();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Barre latérale de navigation (masquée sur mobile) */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      {/* Zone de contenu principal — marge ajustée selon la sidebar */}
      <div className={cn(
        "flex flex-1 flex-col transition-all duration-300",
        "md:ml-[72px]",
        !collapsed && "md:ml-[260px]"
      )}>
        {/* Barre supérieure avec fil d'Ariane, thème, langue */}
        <TopBar />
        {/* Contenu de la page active */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
