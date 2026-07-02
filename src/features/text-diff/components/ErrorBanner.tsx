import { useEffect } from 'react';
import { useDiffStore } from '../store/useDiffStore';

export function ErrorBanner() {
  const lastError = useDiffStore(s => s.lastError);
  const setLastError = useDiffStore(s => s.setLastError);

  useEffect(() => {
    if (!lastError) return;
    const t = setTimeout(() => setLastError(null), 5000);
    return () => clearTimeout(t);
  }, [lastError, setLastError]);

  if (!lastError) return null;
  return (
    <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 text-sm flex justify-between items-center">
      <span>{lastError}</span>
      <button onClick={() => setLastError(null)} className="ml-3 text-yellow-600">✕</button>
    </div>
  );
}
