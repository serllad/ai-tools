import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoFormat } from '../../src/hooks/useAutoFormat';
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

afterEach(() => {
  vi.useRealTimers();
});

describe('useAutoFormat', () => {
  it('does nothing when autoFormat is false', () => {
    vi.useFakeTimers();
    useJsonStore.getState().setAutoFormat(false);
    useJsonStore.getState().setInput('{"a":1}');
    renderHook(() => useAutoFormat());
    vi.advanceTimersByTime(1000);
    expect(useJsonStore.getState().output).toBe('');
  });

  it('formats valid input after 500ms debounce when autoFormat on', () => {
    vi.useFakeTimers();
    useJsonStore.getState().setAutoFormat(true);
    renderHook(() => useAutoFormat());
    act(() => {
      useJsonStore.getState().setInput('{"a":1}');
    });
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(useJsonStore.getState().output).toBe('');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(useJsonStore.getState().output).toBe('{\n  "a": 1\n}');
  });

  it('does not overwrite output when input becomes invalid', () => {
    vi.useFakeTimers();
    useJsonStore.getState().setAutoFormat(true);
    renderHook(() => useAutoFormat());
    act(() => {
      useJsonStore.getState().setInput('{"a":1}');
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(useJsonStore.getState().output).toBe('{\n  "a": 1\n}');
    act(() => {
      useJsonStore.getState().setInput('{name:1}');
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(useJsonStore.getState().output).toBe('{\n  "a": 1\n}');
  });
});
