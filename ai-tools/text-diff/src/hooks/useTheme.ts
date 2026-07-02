import { useEffect } from 'react';
import { useDiffStore } from '../store/useDiffStore';

function getPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useTheme(): void {
  const theme = useDiffStore(s => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    function apply(t: 'light' | 'dark' | 'system') {
      const isDark = t === 'dark' || (t === 'system' && getPrefersDark());
      root.classList.toggle('dark', isDark);
    }
    apply(theme);
    if (theme === 'system' && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => apply('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);
}

