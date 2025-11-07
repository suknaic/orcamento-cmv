import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo-julio.png";
import { ThemeToggle } from "./ThemeToggle";

interface SidebarProps {
  onNavigate?: (page: string) => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  onCollapseChange?: (collapsed: boolean) => void;
  onWhatsClick?: () => void;
}

export function Sidebar({ onNavigate, isOpen = false, onToggle, onCollapseChange, onWhatsClick }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Efeito para notificar mudanças no estado de colapso
  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

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
    onCollapseChange?.(newCollapsed);
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
      } h-screen fixed left-0 top-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col shadow-lg z-30 transition-all duration-300 ${
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      } ${!isOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}>
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between py-6 px-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <img src={logo} alt="Logo" className="h-12 w-auto" />
          )}
          <button
            onClick={handleToggle}
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
                <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-foreground text-sidebar bg-opacity-90 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t border-sidebar-border ${isCollapsed ? 'flex flex-col items-center space-y-2' : ''}`}>
        {/* Botões de tema e WhatsApp */}
        <div className={`${isCollapsed ? 'flex flex-col space-y-3' : 'space-y-2'}`}>
          {/* Botão de Tema */}
          <div
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-lg text-left transition-all duration-200 group relative w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer`}
            title={isCollapsed ? "Alternar tema" : undefined}
            onClick={() => {}}
          >
            <div className="flex-shrink-0">
              <ThemeToggle />
            </div>
            {!isCollapsed && (
              <span className="font-medium text-sm">Tema</span>
            )}
            
            {/* Tooltip para modo colapsado */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-foreground text-sidebar bg-opacity-90 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Alternar Tema
              </div>
            )}
          </div>
          
          {/* Botão de WhatsApp */}
          <button
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-lg text-left transition-all duration-200 group relative w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`}
            onClick={onWhatsClick}
            title={isCollapsed ? "Status do WhatsApp" : undefined}
            data-testid="whatsapp-button"
            id="whatsapp-status-button"
          >
            <div className="flex-shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z"/>
              </svg>
            </div>
            {!isCollapsed && (
              <span className="font-medium text-sm">WhatsApp</span>
            )}
            
            {/* Tooltip para modo colapsado */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-foreground text-sidebar bg-opacity-90 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Status do WhatsApp
              </div>
            )}
          </button>
        </div>
        
        {/* Informação do sistema - só visível quando não estiver colapsado */}
        {!isCollapsed && (
          <div className="text-center mt-6">
            <div className="text-xs text-sidebar-foreground/60 mb-1">Sistema de Orçamentos - v1.0.0</div>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
