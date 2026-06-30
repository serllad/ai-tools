import { useCallback } from 'react';
import { useJsonStore } from '../store/useJsonStore';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_EXT = ['.json', '.txt'];
const ACCEPTED_TYPE_PREFIX = ['text/', 'application/json'];

function isAccepted(file: File): boolean {
  if (ACCEPTED_TYPE_PREFIX.some(p => file.type.startsWith(p))) return true;
  const lower = file.name.toLowerCase();
  return ACCEPTED_EXT.some(ext => lower.endsWith(ext));
}

export function useFileDrop() {
  const onDrop = useCallback(async (file: File) => {
    const store = useJsonStore.getState();
    if (!isAccepted(file)) {
      store.setLastError('仅支持 .json / .txt 文本文件');
      return;
    }
    if (file.size > MAX_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      store.setLastError(`文件过大（${mb} MB），可能影响性能`);
      return;
    }
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
    useJsonStore.getState().setInput(text);
  }, []);

  return { onDrop };
}
