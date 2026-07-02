import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileDrop } from '../../src/hooks/useFileDrop';
import { useDiffStore } from '../../src/store/useDiffStore';

function makeFile(name: string, content: string, type = 'text/plain') {
  return new File([content], name, { type });
}

describe('useFileDrop', () => {
  it('txt 文件填入 left', async () => {
    const { result } = renderHook(() => useFileDrop());
    await act(async () => {
      await result.current.onDrop(makeFile('a.txt', 'hello'), 'left');
    });
    expect(useDiffStore.getState().left).toBe('hello');
  });
  it('txt 文件填入 right', async () => {
    const { result } = renderHook(() => useFileDrop());
    await act(async () => {
      await result.current.onDrop(makeFile('b.txt', 'world'), 'right');
    });
    expect(useDiffStore.getState().right).toBe('world');
  });
  it('非文本文件 → 设置 lastError', async () => {
    const { result } = renderHook(() => useFileDrop());
    useDiffStore.getState().setLeft('hello');
    await act(async () => {
      await result.current.onDrop(makeFile('a.png', '', 'image/png'), 'left');
    });
    expect(useDiffStore.getState().left).toBe('hello');
    expect(useDiffStore.getState().lastError).toContain('文本文件');
  });
  it('> 2MB 文件 → 仍填入但设置提示', async () => {
    const big = 'x'.repeat(2.5 * 1024 * 1024);
    const { result } = renderHook(() => useFileDrop());
    await act(async () => {
      await result.current.onDrop(makeFile('big.txt', big), 'left');
    });
    expect(useDiffStore.getState().left).toBe(big);
    expect(useDiffStore.getState().lastError).toContain('文件较大');
  });
});
