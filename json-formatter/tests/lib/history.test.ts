import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadHistory, saveHistory, addHistoryItem, MAX_HISTORY } from '../../src/lib/history';
import type { HistoryItem } from '../../src/types';

function makeItem(id: string, content: string): HistoryItem {
  return { id, summary: content.slice(0, 200), content, sizeBytes: content.length, createdAt: Date.now() };
}

beforeEach(() => {
  localStorage.clear();
});

describe('history', () => {
  it('returns empty array when nothing stored', () => {
    expect(loadHistory()).toEqual([]);
  });

  it('round-trips items through save/load', () => {
    const items = [makeItem('1', '{"a":1}'), makeItem('2', '{"b":2}')];
    saveHistory(items);
    expect(loadHistory()).toEqual(items);
  });

  it('addHistoryItem prepends and caps at MAX_HISTORY', () => {
    let items: HistoryItem[] = [];
    for (let i = 0; i < MAX_HISTORY + 2; i++) {
      items = addHistoryItem(items, makeItem(`id_${i}`, `{${i}}`));
    }
    expect(items.length).toBe(MAX_HISTORY);
    expect(items[0].id).toBe(`id_${MAX_HISTORY + 1}`);
  });

  it('addHistoryItem dedupes by id', () => {
    let items = addHistoryItem([], makeItem('dup', '{"a":1}'));
    items = addHistoryItem(items, makeItem('dup', '{"a":1}'));
    expect(items.length).toBe(1);
  });

  it('summary is truncated to 200 chars', () => {
    const long = '{"x":"' + 'a'.repeat(300) + '"}';
    const item = makeItem('1', long);
    expect(item.summary.length).toBe(200);
  });

  it('falls back to empty when localStorage throws on read', () => {
    const getter = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    expect(loadHistory()).toEqual([]);
    getter.mockRestore();
  });

  it('silently swallows save errors (fail-soft)', () => {
    const setter = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    expect(() => saveHistory([makeItem('1', '{"a":1}')])).not.toThrow();
    setter.mockRestore();
  });
});
