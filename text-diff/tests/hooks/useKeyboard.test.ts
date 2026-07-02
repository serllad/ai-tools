import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboard } from '../../src/hooks/useKeyboard';
import { useDiffStore } from '../../src/store/useDiffStore';

function fire(key: string, opts: KeyboardEventInit = {}) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, ...opts }));
}

describe('useKeyboard', () => {
  it('Cmd/Ctrl+Enter → compare', () => {
    const spy = vi.spyOn(useDiffStore.getState(), 'compare');
    renderHook(() => useKeyboard());
    fire('Enter', { metaKey: true });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
  it('Cmd/Ctrl+Shift+X → swap', () => {
    const spy = vi.spyOn(useDiffStore.getState(), 'swap');
    renderHook(() => useKeyboard());
    fire('x', { metaKey: true, shiftKey: true });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
  it('Cmd/Ctrl+K → clear', () => {
    const spy = vi.spyOn(useDiffStore.getState(), 'clear');
    renderHook(() => useKeyboard());
    fire('k', { metaKey: true });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
  it('Cmd/Ctrl+Shift+N → nextDiff', () => {
    const spy = vi.spyOn(useDiffStore.getState(), 'nextDiff');
    renderHook(() => useKeyboard());
    fire('n', { metaKey: true, shiftKey: true });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
  it('Cmd/Ctrl+Shift+P → prevDiff', () => {
    const spy = vi.spyOn(useDiffStore.getState(), 'prevDiff');
    renderHook(() => useKeyboard());
    fire('p', { metaKey: true, shiftKey: true });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
