import Logo from '../logo-julio.png';
import { useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  onWhatsClick: () => void;
}

export function Navbar({ onWhatsClick }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="fixed bg-background left-0 top-0 right-0 h-20 flex items-center px-8 z-20 shadow-sm justify-between border-b border-border">
      <div className="flex items-center gap-4">
        <img src={Logo} alt="Logo" className="h-12" />
        <span className="text-2xl font-bold text-foreground">Painel de Orçamentos</span>
      </div>
      <nav className="flex gap-2 items-center">
        <button
          className={`px-4 py-2 font-semibold transition-all duration-200 rounded-lg border ${
            location.pathname === "/" 
              ? "bg-primary text-primary-foreground border-primary shadow-sm" 
              : "text-muted-foreground hover:text-primary hover:bg-primary/5 border-transparent hover:border-primary/20"
          }`}
          onClick={() => navigate("/")}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Novo Orçamento
          </div>
        </button>
        <button
          className={`px-4 py-2 font-semibold transition-all duration-200 rounded-lg border ${
            location.pathname === "/orcamentos" 
              ? "bg-primary text-primary-foreground border-primary shadow-sm" 
              : "text-muted-foreground hover:text-primary hover:bg-primary/5 border-transparent hover:border-primary/20"
          }`}
          onClick={() => navigate("/orcamentos")}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Orçamentos
          </div>
        </button>
        <button
          className={`px-4 py-2 font-semibold transition-all duration-200 rounded-lg border ${
            location.pathname === "/produtos" 
              ? "bg-primary text-primary-foreground border-primary shadow-sm" 
              : "text-muted-foreground hover:text-primary hover:bg-primary/5 border-transparent hover:border-primary/20"
          }`}
          onClick={() => navigate("/produtos")}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Produtos
          </div>
        </button>
        
        <div className="flex items-center gap-3 ml-6 pl-6 border-l border-border">
          <ThemeToggle />
          <button
            className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 border border-green-600 transition-all duration-200 shadow-sm flex items-center gap-2"
            onClick={onWhatsClick}
            title="Status do WhatsApp"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z"/>
            </svg>
            WhatsApp
          </button>
        </div>
      </nav>
    </header>
  );
}
