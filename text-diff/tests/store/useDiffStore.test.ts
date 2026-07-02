import { describe, it, expect, beforeEach } from 'vitest';
import { useDiffStore } from '../../src/store/useDiffStore';

beforeEach(() => {
  useDiffStore.getState().clear();
  useDiffStore.setState({ autoCompare: true, confirmClear: true, theme: 'system', granularity: 'char', viewMode: 'split', languageOverride: null });
});

describe('useDiffStore', () => {
  it('setLeft / setRight 更新文本', () => {
    useDiffStore.getState().setLeft('abc');
    useDiffStore.getState().setRight('abd');
    expect(useDiffStore.getState().left).toBe('abc');
    expect(useDiffStore.getState().right).toBe('abd');
  });

  it('compare → 计算 result 与 stats', () => {
    useDiffStore.getState().setLeft('a\nb');
    useDiffStore.getState().setRight('a\nc');
    useDiffStore.getState().compare();
    const s = useDiffStore.getState();
    expect(s.result).not.toBeNull();
    expect(s.result!.stats.removed).toBe(1);
    expect(s.result!.stats.added).toBe(1);
    expect(s.status).toBe('done');
  });

  it('compare → 两侧空不计算，status idle', () => {
    useDiffStore.getState().compare();
    expect(useDiffStore.getState().result).toBeNull();
    expect(useDiffStore.getState().status).toBe('idle');
  });

  it('swap → 左右互换并重对比', () => {
    useDiffStore.getState().setLeft('a');
    useDiffStore.getState().setRight('b');
    useDiffStore.getState().swap();
    expect(useDiffStore.getState().left).toBe('b');
    expect(useDiffStore.getState().right).toBe('a');
  });

  it('clear → 清空全部', () => {
    useDiffStore.getState().setLeft('x');
    useDiffStore.getState().setRight('y');
    useDiffStore.getState().compare();
    useDiffStore.getState().clear();
    const s = useDiffStore.getState();
    expect(s.left).toBe('');
    expect(s.right).toBe('');
    expect(s.result).toBeNull();
    expect(s.status).toBe('idle');
  });

  it('nextDiff / prevDiff → 更新 currentAnchor', () => {
    useDiffStore.getState().setLeft('a\nb\nc');
    useDiffStore.getState().setRight('a\nB\nc');
    useDiffStore.getState().compare();
    useDiffStore.getState().nextDiff();
    expect(useDiffStore.getState().currentAnchor).toBe(0);
  });

  it('setViewMode / setGranularity / setTheme', () => {
    useDiffStore.getState().setViewMode('inline');
    useDiffStore.getState().setGranularity('word');
    useDiffStore.getState().setTheme('dark');
    expect(useDiffStore.getState().viewMode).toBe('inline');
    expect(useDiffStore.getState().granularity).toBe('word');
    expect(useDiffStore.getState().theme).toBe('dark');
  });

  it('setLanguageOverride', () => {
    useDiffStore.getState().setLanguageOverride('json');
    expect(useDiffStore.getState().languageOverride).toBe('json');
    useDiffStore.getState().setLanguageOverride(null);
    expect(useDiffStore.getState().languageOverride).toBeNull();
  });
});
