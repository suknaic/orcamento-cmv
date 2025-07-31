import Logo from '../logo-julio.png';
import { useLocation, useNavigate } from "react-router-dom";

interface NavbarProps {
  onWhatsClick: () => void;
}

export function Navbar({ onWhatsClick }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="fixed bg-white left-0 top-0 right-0 h-20 flex items-center px-8 z-20 shadow justify-between">
      <div className="flex items-center gap-4">
        <img src={Logo} alt="Logo" className="h-12 " />
        <span className="text-2xl font-bold">Painel de Orçamentos</span>
      </div>
      <nav className="flex gap-6 items-center">
        <button
          className={`font-semibold ${location.pathname === "/" ? "text-green-700" : "text-gray-700"}`}
          onClick={() => navigate("/")}
        >
          Orçamentos
        </button>
        <button
          className={`font-semibold ${location.pathname === "/produtos" ? "text-green-700" : "text-gray-700"}`}
          onClick={() => navigate("/produtos")}
        >
          Produtos
        </button>
        <button
          className="ml-4 px-3 py-1 rounded bg-green-600 text-white font-semibold hover:bg-green-700 border border-green-700"
          onClick={onWhatsClick}
          title="Status do WhatsApp"
        >
          WhatsApp
        </button>
      </nav>
    </header>
  );
}
