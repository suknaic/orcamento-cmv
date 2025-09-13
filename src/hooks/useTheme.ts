import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
  // Inicializando o estado uma única vez
  const [isDark, setIsDark] = useState(() => {
    // Verificar localStorage ou preferência do sistema
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) {
        return saved === 'dark';
      }
      // Verificar preferência do sistema
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Usando useCallback para memoizar a função e evitar re-renderizações
  const toggleTheme = useCallback(() => {
    setIsDark(prevState => {
      const newState = !prevState;
      
      // Atualizando o localStorage e classes aqui para garantir sincronia
      if (typeof window !== 'undefined') {
        const root = document.documentElement;
        if (newState) {
          root.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        } else {
          root.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
      }
      
      return newState;
    });
  }, []);

  // Este useEffect só roda uma vez na montagem do componente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, []);

  return { isDark, toggleTheme };
}
