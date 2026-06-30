import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboard } from '../../src/hooks/useKeyboard';
import { useJsonStore } from '../../src/store/useJsonStore';

beforeEach(() => {
  localStorage.clear();
  useJsonStore.setState({
    input: '', output: '', status: 'idle', error: null, lastError: null,
    stats: { chars: 0, lines: 0, sizeBytes: 0 },
    compressInfo: null, history: [],
    autoFormat: false, confirmClear: true, theme: 'system'
  });
});

function fireKey(key: string, opts: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {}) {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, ...opts });
  document.dispatchEvent(ev);
}

describe('useKeyboard', () => {
  it('triggers format on Ctrl+Enter', () => {
    const formatSpy = vi.spyOn(useJsonStore.getState(), 'format');
    renderHook(() => useKeyboard());
    fireKey('Enter', { ctrlKey: true });
    expect(formatSpy).toHaveBeenCalled();
    formatSpy.mockRestore();
  });

  it('triggers format on Cmd+Enter (mac)', () => {
    const formatSpy = vi.spyOn(useJsonStore.getState(), 'format');
    renderHook(() => useKeyboard());
    fireKey('Enter', { metaKey: true });
    expect(formatSpy).toHaveBeenCalled();
    formatSpy.mockRestore();
  });

  it('triggers clear on Ctrl+K', () => {
    const clearSpy = vi.spyOn(useJsonStore.getState(), 'clear');
    renderHook(() => useKeyboard());
    fireKey('k', { ctrlKey: true });
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('triggers copy on Ctrl+Shift+C', async () => {
    const copySpy = vi.spyOn(useJsonStore.getState(), 'copy').mockResolvedValue(true);
    renderHook(() => useKeyboard());
    fireKey('c', { ctrlKey: true, shiftKey: true });
    expect(copySpy).toHaveBeenCalled();
    copySpy.mockRestore();
  });

  it('does not trigger on plain Enter', () => {
    const formatSpy = vi.spyOn(useJsonStore.getState(), 'format');
    renderHook(() => useKeyboard());
    fireKey('Enter');
    expect(formatSpy).not.toHaveBeenCalled();
    formatSpy.mockRestore();
  });
});
