import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoCompare } from '../../src/hooks/useAutoCompare';
import { useDiffStore } from '../../src/store/useDiffStore';

beforeEach(() => {
  vi.useFakeTimers();
  useDiffStore.getState().clear();
  useDiffStore.setState({ autoCompare: true });
});
afterEach(() => vi.useRealTimers());

describe('useAutoCompare', () => {
  it('输入后 500ms 自动触发 compare', () => {
    const spy = vi.spyOn(useDiffStore.getState(), 'compare');
    renderHook(() => useAutoCompare());
    act(() => {
      useDiffStore.getState().setLeft('a');
      useDiffStore.getState().setRight('b');
    });
    expect(spy).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(500); });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('autoCompare=false → 不触发', () => {
    useDiffStore.setState({ autoCompare: false });
    const spy = vi.spyOn(useDiffStore.getState(), 'compare');
    renderHook(() => useAutoCompare());
    act(() => {
      useDiffStore.getState().setLeft('a');
      useDiffStore.getState().setRight('b');
    });
    act(() => { vi.advanceTimersByTime(600); });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('文本 > 5000 行 → 不触发并设置 lastError', () => {
    const big = Array(5001).fill('x').join('\n');
    renderHook(() => useAutoCompare());
    act(() => {
      useDiffStore.getState().setLeft(big);
      useDiffStore.getState().setRight('b');
    });
    act(() => { vi.advanceTimersByTime(600); });
    expect(useDiffStore.getState().result).toBeNull();
    expect(useDiffStore.getState().lastError).toBeTruthy();
  });
});
