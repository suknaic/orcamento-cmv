import { useLocation, useNavigate } from "react-router-dom";
import logo from "../logo-julio.png";

interface SidebarProps {
  onNavigate?: (page: string) => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

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
  };

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-sidebar border-r border-sidebar-border flex flex-col shadow-lg z-30">
      {/* Logo */}
      <div className="flex items-center justify-center py-8 border-b border-sidebar-border">
        <img src={logo} alt="Logo" className="h-16 w-auto" />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 flex flex-col p-4 space-y-2">
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider px-3 py-2">
            Menu Principal
          </h3>
        </div>

        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 group ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <div className={`flex-shrink-0 ${isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"}`}>
                {item.icon}
              </div>
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-sidebar-primary-foreground rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-center">
          <div className="text-xs text-sidebar-foreground/60 mb-1">Sistema de Orçamentos</div>
          <div className="text-xs text-sidebar-foreground/40">v1.0.0</div>
        </div>
      </div>
    </aside>
  );
}
