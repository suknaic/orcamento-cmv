import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ChevronLeft,
  PlusCircle,
  Send,
  Package,
  MessageSquare,
  Sun,
  Moon,
} from "lucide-react";
import logo from "../assets/logo-julio.png";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/hooks/useTheme";

interface SidebarProps {
  onNavigate?: (page: string) => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  onCollapseChange?: (collapsed: boolean) => void;
  onWhatsClick?: () => void;
}

const menuItems = [
  {
    path: "/",
    label: "Novo Orçamento",
    icon: PlusCircle,
  },
  {
    path: "/orcamentos",
    label: "Orçamentos Enviados",
    icon: Send,
  },
  {
    path: "/produtos",
    label: "Produtos",
    icon: Package,
  },
];

export function Sidebar({
  onNavigate,
  isOpen = false,
  onToggle,
  onCollapseChange,
  onWhatsClick,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  const handleNavigation = (path: string) => {
    navigate(path);
    onNavigate?.(path);
    if (window.innerWidth < 1024) {
      onToggle?.(false);
    }
  };

  const handleToggle = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
    // Only toggle sidebar open/close state on small screens
    if (window.innerWidth < 1024) {
      onToggle?.(!isOpen);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => onToggle?.(false)}
      />

      <aside
        className={`h-[calc(100vh-4rem)] fixed left-0 top-16 text-sidebar-foreground border-r border-sidebar-border flex flex-col shadow-lg z-30 transition-all duration-300 lg:h-screen lg:top-0 ${isDark ? 'bg-black' : 'bg-gray-100'} ${
          isCollapsed ? "w-20" : "w-64"
        } ${!isOpen ? "-translate-x-full lg:translate-x-0" : "translate-x-0"} ${isOpen && !isCollapsed ? "shadow-2xl" : ""}`}
      >
        <div className=" z-auto flex items-center justify-between py-6 px-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <img src={logo} alt="Logo" className="h-12 w-auto" />
          )}
          <button
            onClick={handleToggle}
            className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors ml-auto"
            title={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            <ChevronLeft
              className={`w-6 h-6 transform transition-transform ${
                isCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <nav className="flex-1 flex flex-col p-4 space-y-2">
          {!isCollapsed && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider px-3 py-2">
                Menu Principal
              </h3>
            </div>
          )}

          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center ${
                  isCollapsed ? "justify-center" : "gap-3"
                } px-3 py-3 rounded-lg text-left transition-all duration-200 group relative ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`flex-shrink-0 w-6 h-6 ${
                    isActive
                      ? "text-sidebar-primary-foreground"
                      : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                  }`}
                />
                {!isCollapsed && (
                  <>
                    <span className="font-medium text-sm">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-sidebar-primary-foreground rounded-full animate-pulse" />
                    )}
                  </>
                )}

                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-foreground text-sidebar bg-opacity-90 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        <div
          className={`p-4 border-t border-sidebar-border ${
            isCollapsed ? "flex flex-col items-center space-y-2" : ""
          }`}
        >
          <div
            className={`${
              isCollapsed ? "flex flex-col space-y-3" : "space-y-2"
            }`}
          >
            <div
              className={`flex items-center ${
                isCollapsed ? "justify-center" : "gap-3"
              } px-3 py-3 rounded-lg text-left transition-all duration-200 group relative w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer`}
              title={isCollapsed ? "Alternar tema" : undefined}
            >
              <ThemeToggle />
              {!isCollapsed && (
                <span className="font-medium text-sm">Tema</span>
              )}

              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-foreground text-sidebar bg-opacity-90 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Alternar Tema
                </div>
              )}
            </div>

            <button
              className={`flex items-center ${
                isCollapsed ? "justify-center" : "gap-3"
              } px-3 py-3 rounded-lg text-left transition-all duration-200 group relative w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`}
              onClick={onWhatsClick}
              title={isCollapsed ? "Status do WhatsApp" : undefined}
              data-testid="whatsapp-button"
              id="whatsapp-status-button"
            >
              <MessageSquare className="flex-shrink-0 w-6 h-6" />
              {!isCollapsed && (
                <span className="font-medium text-sm">WhatsApp</span>
              )}

              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-foreground text-sidebar bg-opacity-90 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Status do WhatsApp
                </div>
              )}
            </button>
          </div>

          {!isCollapsed && (
            <div className="text-center mt-6">
              <div className="text-xs text-sidebar-foreground/60 mb-1">
                Sistema de Orçamentos - v1.0.0
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
