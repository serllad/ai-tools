import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollSync } from '../../src/hooks/useScrollSync';

describe('useScrollSync', () => {
  it('attach 后返回 detach 函数', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    const { result } = renderHook(() => useScrollSync());
    const detach = result.current.attach(a, b);
    expect(typeof detach).toBe('function');
    detach();
  });

  it('一侧滚动 → 同步另一侧 scrollTop 比例', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    Object.defineProperty(a, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(a, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(b, 'scrollHeight', { value: 500, configurable: true });
    Object.defineProperty(b, 'clientHeight', { value: 200, configurable: true });
    document.body.appendChild(a);
    document.body.appendChild(b);
    const { result } = renderHook(() => useScrollSync());
    result.current.attach(a, b);
    a.scrollTop = 400;
    a.dispatchEvent(new Event('scroll'));
    expect(b.scrollTop).toBeCloseTo(150, 0);
    document.body.removeChild(a);
    document.body.removeChild(b);
  });
});
