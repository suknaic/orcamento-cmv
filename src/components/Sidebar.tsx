import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../logo-julio.png";

interface SidebarProps {
  onNavigate?: (page: string) => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export function Sidebar({ onNavigate, isOpen = false, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      path: "/",
      label: "Novo Orçamento",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      path: "/orcamentos",
      label: "Orçamentos Enviados",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      path: "/produtos",
      label: "Produtos",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onNavigate?.(path);
    // Fecha o sidebar em mobile após navegação
    if (window.innerWidth < 1024) {
      onToggle?.(false);
    }
  };

  const handleToggle = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    // Em mobile, usa o controle externo
    if (window.innerWidth < 1024) {
      onToggle?.(!isOpen);
    }
  };

  return (
    <>
      {/* Overlay para mobile */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => onToggle?.(false)}
      />

      <aside className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } h-screen fixed left-0 top-0 bg-sidebar border-r border-sidebar-border flex flex-col shadow-lg z-30 transition-all duration-300 ${
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      } ${!isOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}>
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between py-6 px-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <img src={logo} alt="Logo" className="h-12 w-auto" />
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors ml-auto"
            title={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            <svg className={`w-4 h-4 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

      {/* Navigation Menu */}
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
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-lg text-left transition-all duration-200 group relative ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className={`flex-shrink-0 ${isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"}`}>
                {item.icon}
              </div>
              {!isCollapsed && (
                <>
                  <span className="font-medium text-sm">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-sidebar-primary-foreground rounded-full animate-pulse" />
                  )}
                </>
              )}
              
              {/* Tooltip para modo colapsado */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-foreground text-sidebar text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-center">
            <div className="text-xs text-sidebar-foreground/60 mb-1">Sistema de Orçamentos</div>
            <div className="text-xs text-sidebar-foreground/40">v1.0.0</div>
          </div>
        </div>
      )}
    </aside>
    </>
  );
}
