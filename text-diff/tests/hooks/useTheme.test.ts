import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTheme } from '../../src/hooks/useTheme';
import { useDiffStore } from '../../src/store/useDiffStore';

describe('useTheme', () => {
  it('theme=dark → 给 documentElement 加 dark class', () => {
    useDiffStore.setState({ theme: 'dark' });
    const { unmount } = renderHook(() => useTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    unmount();
  });

  it('theme=light → 不加 dark class', () => {
    useDiffStore.setState({ theme: 'light' });
    const { unmount } = renderHook(() => useTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    unmount();
  });
});
