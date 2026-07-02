import type { DiffResult } from '../types';

export function formatStats(r: DiffResult): string {
  return `+${r.stats.added} 行新增  -${r.stats.removed} 行删除  ${r.stats.equal} 行未修改`;
}

export function isIdentical(r: DiffResult | null): boolean {
  if (!r) return false;
  return r.stats.added === 0 && r.stats.removed === 0;
}
