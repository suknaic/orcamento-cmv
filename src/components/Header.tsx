import { Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 bg-background h-16 flex items-center px-4 border-b z-10">
      <button onClick={onMenuClick} className="p-2 lg:hidden">
        <Menu className="w-6 h-6" />
      </button>
    </header>
  );
}
