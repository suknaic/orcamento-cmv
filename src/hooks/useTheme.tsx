import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// Define o tipo para o valor do contexto do tema.
type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
};

// Cria o contexto do tema. O valor inicial é `undefined` porque o provedor
// ainda não envolveu a aplicação.
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Define as propriedades que o componente ThemeProvider aceita.
// `children` representa os componentes filhos que serão envolvidos pelo provedor.
type ThemeProviderProps = {
  children: ReactNode;
};

/**
 * O `ThemeProvider` é um componente que gerencia o estado do tema (claro/escuro)
 * e o fornece para todos os componentes filhos através do `ThemeContext`.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  // O estado `isDark` armazena a preferência de tema do usuário.
  // A função de inicialização lê o tema salvo no `localStorage` ou a preferência do sistema.
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      // Se não houver tema salvo, usa a preferência do sistema operacional.
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false; // Padrão para ambientes sem `window` (ex: SSR).
  });

  // `useEffect` para aplicar a classe 'dark' ao elemento `<html>` e salvar
  // a preferência no `localStorage` sempre que `isDark` mudar.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }, [isDark]);

  // `toggleTheme` é a função para alternar entre os temas.
  // `useCallback` é usado para memoizar a função, evitando recriações desnecessárias.
  const toggleTheme = useCallback(() => {
    setIsDark(prevState => !prevState);
  }, []);

  // O valor fornecido pelo contexto inclui o estado atual e a função para alterá-lo.
  const value = { isDark, toggleTheme };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * O hook `useTheme` é um atalho para consumir o `ThemeContext`.
 * Ele garante que o hook seja usado dentro de um `ThemeProvider`.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  // Se o contexto for `undefined`, significa que o hook foi usado fora do provedor.
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}