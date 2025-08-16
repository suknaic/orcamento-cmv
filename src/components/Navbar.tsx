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
      <nav className="flex gap-6 items-center">
        <button
          className={`font-semibold transition-colors ${
            location.pathname === "/" 
              ? "text-primary" 
              : "text-muted-foreground hover:text-primary"
          }`}
          onClick={() => navigate("/")}
        >
          Novo Orçamento
        </button>
        <button
          className={`font-semibold transition-colors ${
            location.pathname === "/orcamentos" 
              ? "text-primary" 
              : "text-muted-foreground hover:text-primary"
          }`}
          onClick={() => navigate("/orcamentos")}
        >
          Orçamentos
        </button>
        <button
          className={`font-semibold transition-colors ${
            location.pathname === "/produtos" 
              ? "text-primary" 
              : "text-muted-foreground hover:text-primary"
          }`}
          onClick={() => navigate("/produtos")}
        >
          Produtos
        </button>
        
        <div className="flex items-center gap-3 ml-4">
          <ThemeToggle />
          <button
            className="px-3 py-1 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90 border border-primary transition-colors"
            onClick={onWhatsClick}
            title="Status do WhatsApp"
          >
            WhatsApp
          </button>
        </div>
      </nav>
    </header>
  );
}
