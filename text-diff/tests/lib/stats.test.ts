import { describe, it, expect } from 'vitest';
import { formatStats, isIdentical } from '../../src/lib/stats';
import type { DiffResult } from '../../src/types';

describe('stats', () => {
  it('formatStats → "+X 行新增 -Y 行删除 Z 行未修改"', () => {
    const r: DiffResult = { lines: [], stats: { added: 2, removed: 1, equal: 3 }, diffAnchors: [] };
    expect(formatStats(r)).toBe('+2 行新增  -1 行删除  3 行未修改');
  });

  it('isIdentical → 无 added 无 removed 时为 true', () => {
    const r: DiffResult = { lines: [], stats: { added: 0, removed: 0, equal: 5 }, diffAnchors: [] };
    expect(isIdentical(r)).toBe(true);
  });

  it('isIdentical → 有差异时为 false', () => {
    const r: DiffResult = { lines: [], stats: { added: 1, removed: 0, equal: 5 }, diffAnchors: [0] };
    expect(isIdentical(r)).toBe(false);
  });

  it('空结果 → isIdentical true', () => {
    const r: DiffResult = { lines: [], stats: { added: 0, removed: 0, equal: 0 }, diffAnchors: [] };
    expect(isIdentical(r)).toBe(true);
  });
});
