import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileDrop } from '../../src/hooks/useFileDrop';
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

function makeTextFile(name: string, content: string, type = 'text/plain'): File {
  return new File([content], name, { type });
}

describe('useFileDrop', () => {
  it('reads text/json file into store input', async () => {
    const { result } = renderHook(() => useFileDrop());
    const file = makeTextFile('a.json', '{"a":1}', 'application/json');
    await act(async () => {
      await result.current.onDrop(file);
    });
    expect(useJsonStore.getState().input).toBe('{"a":1}');
    expect(useJsonStore.getState().lastError).toBeNull();
  });

  it('sets lastError when file > 5MB', async () => {
    const { result } = renderHook(() => useFileDrop());
    const big = new File([new Array(6 * 1024 * 1024).fill('a').join('')], 'big.txt', { type: 'text/plain' });
    await act(async () => {
      await result.current.onDrop(big);
    });
    expect(useJsonStore.getState().input).toBe('');
    expect(useJsonStore.getState().lastError).toContain('文件过大');
  });

  it('sets lastError for non-text file type', async () => {
    const { result } = renderHook(() => useFileDrop());
    const img = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'a.png', { type: 'image/png' });
    await act(async () => {
      await result.current.onDrop(img);
    });
    expect(useJsonStore.getState().input).toBe('');
    expect(useJsonStore.getState().lastError).toContain('仅支持');
  });

  it('accepts .txt extension', async () => {
    const { result } = renderHook(() => useFileDrop());
    const file = makeTextFile('a.txt', '{"b":2}');
    await act(async () => {
      await result.current.onDrop(file);
    });
    expect(useJsonStore.getState().input).toBe('{"b":2}');
  });
});
