import { useEffect } from 'react';
import { useJsonStore } from '../store/useJsonStore';

export function useAutoFormat(): void {
  const input = useJsonStore(s => s.input);
  const autoFormat = useJsonStore(s => s.autoFormat);
  const status = useJsonStore(s => s.status);
  const format = useJsonStore(s => s.format);

  useEffect(() => {
    if (!autoFormat) return;
    if (status !== 'valid') return;
    const t = setTimeout(() => {
      // Re-check status inside timer in case it changed
      const current = useJsonStore.getState();
      if (current.autoFormat && current.status === 'valid') {
        format({ skipHistory: true });
      }
    }, 500);
    return () => clearTimeout(t);
  }, [input, autoFormat, status, format]);
}
