import { describe, it, expect } from 'vitest';
import { nextAnchor, prevAnchor, canNext, canPrev } from '../../src/lib/navigation';

describe('navigation', () => {
  const anchors = [2, 5, 8];

  it('nextAnchor → 当前 -1 时返回 0', () => {
    expect(nextAnchor(anchors, -1)).toBe(0);
  });
  it('nextAnchor → 当前 0 时返回 1', () => {
    expect(nextAnchor(anchors, 0)).toBe(1);
  });
  it('nextAnchor → 已在末尾返回末尾', () => {
    expect(nextAnchor(anchors, 2)).toBe(2);
  });
  it('prevAnchor → 当前 -1 时返回 0', () => {
    expect(prevAnchor(anchors, -1)).toBe(0);
  });
  it('prevAnchor → 当前 2 时返回 1', () => {
    expect(prevAnchor(anchors, 2)).toBe(1);
  });
  it('prevAnchor → 已在开头返回开头', () => {
    expect(prevAnchor(anchors, 0)).toBe(0);
  });
  it('canNext / canPrev 边界', () => {
    expect(canNext(anchors, -1)).toBe(true);
    expect(canNext(anchors, 2)).toBe(false);
    expect(canPrev(anchors, 0)).toBe(false);
    expect(canPrev(anchors, 2)).toBe(true);
  });
  it('空锚点 → 全部 false / -1', () => {
    expect(nextAnchor([], -1)).toBe(-1);
    expect(prevAnchor([], -1)).toBe(-1);
    expect(canNext([], -1)).toBe(false);
    expect(canPrev([], -1)).toBe(false);
  });
});
