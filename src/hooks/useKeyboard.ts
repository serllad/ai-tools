import { useEffect } from 'react';
import { useJsonStore } from '../store/useJsonStore';

export function useKeyboard(): void {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        useJsonStore.getState().format();
        return;
      }
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        useJsonStore.getState().clear();
        return;
      }
      if ((e.key === 'c' || e.key === 'C') && e.shiftKey) {
        e.preventDefault();
        void useJsonStore.getState().copy();
        return;
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
