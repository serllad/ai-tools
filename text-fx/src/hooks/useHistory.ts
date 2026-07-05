import { useState, useCallback } from 'react';
import type { HistoryItem, ConfigState } from '../types';

export const HISTORY_KEY = 'textfx_history';
export const MAX_HISTORY = 10;

function loadItems(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryItem[];
  } catch {
    return [];
  }
}

function saveItems(items: HistoryItem[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>(() => loadItems());

  const addItem = useCallback(
    (input: { thumbnail: string; textPreview: string; config: ConfigState }) => {
      setItems((prev) => {
        const next: HistoryItem = {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          thumbnail: input.thumbnail,
          textPreview: input.textPreview,
          config: input.config,
          createdAt: Date.now(),
        };
        const updated = [next, ...prev].slice(0, MAX_HISTORY);
        saveItems(updated);
        return updated;
      });
    },
    [],
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      saveItems(updated);
      return updated;
    });
  }, []);

  return { items, addItem, removeItem };
}
