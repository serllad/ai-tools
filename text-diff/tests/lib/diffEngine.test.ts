// tests/lib/diffEngine.test.ts
import { describe, it, expect } from 'vitest';
import { computeDiff } from '../../src/lib/diffEngine';

describe('computeDiff 行级', () => {
  it('两侧完全相同 → 全 equal，无差异锚点', () => {
    const r = computeDiff('hello\nworld', 'hello\nworld', 'char');
    expect(r.lines).toHaveLength(2);
    expect(r.lines.every(l => l.type === 'equal')).toBe(true);
    expect(r.stats).toEqual({ added: 0, removed: 0, equal: 2 });
    expect(r.diffAnchors).toEqual([]);
  });

  it('新增一行 → 该行 added，统计 +1，1 个锚点', () => {
    const r = computeDiff('a\nb', 'a\nb\nc', 'char');
    const added = r.lines.filter(l => l.type === 'added');
    expect(added).toHaveLength(1);
    expect(added[0].text).toBe('c');
    expect(added[0].leftIndex).toBeNull();
    expect(added[0].rightIndex).toBe(3);
    expect(r.stats.added).toBe(1);
    expect(r.diffAnchors).toHaveLength(1);
  });

  it('删除一行 → 该行 removed', () => {
    const r = computeDiff('a\nb\nc', 'a\nc', 'char');
    const removed = r.lines.filter(l => l.type === 'removed');
    expect(removed).toHaveLength(1);
    expect(removed[0].text).toBe('b');
    expect(removed[0].leftIndex).toBe(2);
    expect(removed[0].rightIndex).toBeNull();
    expect(r.stats.removed).toBe(1);
  });

  it('修改一行 → removed + added 相邻', () => {
    const r = computeDiff('hello world', 'hello universe', 'char');
    const types = r.lines.map(l => l.type);
    expect(types).toContain('removed');
    expect(types).toContain('added');
    expect(r.stats.removed).toBe(1);
    expect(r.stats.added).toBe(1);
  });

  it('空字符串两侧 → 0 行', () => {
    const r = computeDiff('', '', 'char');
    expect(r.lines).toHaveLength(0);
    expect(r.stats).toEqual({ added: 0, removed: 0, equal: 0 });
  });

  it('diffAnchors 标记每个差异块首行索引', () => {
    const r = computeDiff('a\nb\nc\nd', 'a\nB\nc\nD', 'char');
    expect(r.diffAnchors.length).toBeGreaterThanOrEqual(2);
    for (const idx of r.diffAnchors) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(r.lines.length);
    }
  });
});

describe('computeDiff 逐字高亮', () => {
  it('单字符修改 → charParts 标记具体字符', () => {
    const r = computeDiff('hello world', 'hello universe', 'char');
    const removed = r.lines.find(l => l.type === 'removed')!;
    const added = r.lines.find(l => l.type === 'added')!;
    expect(removed.charParts).toBeDefined();
    expect(added.charParts).toBeDefined();
    const removedFrag = removed.charParts!.filter(p => p.type === 'removed').map(p => p.value).join('');
    expect(removedFrag).toContain('world');
    const addedFrag = added.charParts!.filter(p => p.type === 'added').map(p => p.value).join('');
    expect(addedFrag).toContain('universe');
  });

  it('逐词模式 → 按词分块', () => {
    const r = computeDiff('hello world', 'hello universe', 'word');
    const added = r.lines.find(l => l.type === 'added')!;
    const addedWords = added.charParts!.filter(p => p.type === 'added').map(p => p.value);
    expect(addedWords).toContain('universe');
  });

  it('多处不连续修改 → 每处独立标记', () => {
    const r = computeDiff('a1b2c', 'aXbYc', 'char');
    const added = r.lines.find(l => l.type === 'added')!;
    const addedFrags = added.charParts!.filter(p => p.type === 'added').map(p => p.value);
    expect(addedFrags).toContain('X');
    expect(addedFrags).toContain('Y');
  });
});
