import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyText, formatSummary } from '../../src/lib/clipboard';
import type { DiffResult } from '../../src/types';

describe('clipboard', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
    });
  });

  it('copyText → 调用 clipboard.writeText', async () => {
    const ok = await copyText('abc');
    expect(ok).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('abc');
  });

  it('formatSummary → 差异行带 +/- 前缀，equal 行无前缀', () => {
    const r: DiffResult = {
      lines: [
        { leftIndex: 1, rightIndex: 1, type: 'equal', text: 'a' },
        { leftIndex: 2, rightIndex: null, type: 'removed', text: 'b' },
        { leftIndex: null, rightIndex: 2, type: 'added', text: 'c' }
      ],
      stats: { added: 1, removed: 1, equal: 1 },
      diffAnchors: [1]
    };
    expect(formatSummary(r)).toBe('  a\n- b\n+ c');
  });
});
