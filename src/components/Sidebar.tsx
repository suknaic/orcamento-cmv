import logo from "../logo.svg";
interface SidebarProps {
  onNavigate?: (page: string) => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-white border-r flex flex-col items-center py-8 shadow-lg z-30">
      <img src={logo} alt="Logo" className="h-20 mb-4" />
      <nav className="flex flex-col gap-4 w-full px-4 mt-8">
        <span className="text-lg font-bold text-gray-700 mb-2">Menu</span>
        <a className="text-blue-700 hover:underline" href="#orcamento" onClick={e => { e.preventDefault(); onNavigate?.("orcamento"); }}>Orçamento</a>
        <a className="text-blue-700 hover:underline" href="#produtos" onClick={e => { e.preventDefault(); onNavigate?.("produtos"); }}>Produtos</a>
      </nav>
      <div className="mt-auto text-xs text-gray-400 pt-8">Sistema de Orçamentos</div>
    </aside>
  );
}
