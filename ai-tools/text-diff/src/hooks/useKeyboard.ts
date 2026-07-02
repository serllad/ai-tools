import { useEffect } from 'react';
import { useDiffStore } from '../store/useDiffStore';

export function useKeyboard(): void {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const store = useDiffStore.getState();
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); store.compare(); return; }
      if (e.shiftKey && (e.key === 'x' || e.key === 'X')) { e.preventDefault(); store.swap(); return; }
      if (!e.shiftKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); store.clear(); return; }
      if (e.shiftKey && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); store.nextDiff(); return; }
      if (e.shiftKey && (e.key === 'p' || e.key === 'P')) { e.preventDefault(); store.prevDiff(); return; }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
