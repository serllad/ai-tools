import type { HistoryItem } from '../types';

export const MAX_HISTORY = 5;
const STORAGE_KEY = 'json-formatter:history';

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryItem[];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // fail-soft: privacy mode / quota exceeded — silently degrade
  }
}

export function addHistoryItem(items: HistoryItem[], item: HistoryItem): HistoryItem[] {
  const filtered = items.filter(i => i.id !== item.id);
  return [item, ...filtered].slice(0, MAX_HISTORY);
}

export function makeSummary(content: string): string {
  return content.slice(0, 200);
}
