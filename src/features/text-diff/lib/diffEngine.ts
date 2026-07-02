// src/lib/diffEngine.ts
import { diffArrays, diffChars, diffWords } from 'diff';
import type { DiffLine, DiffPart, DiffResult, DiffStats, Granularity } from '../types';

function toLines(s: string): string[] {
  if (s === '') return [];
  return s.split('\n');
}

export function computeDiff(left: string, right: string, granularity: Granularity): DiffResult {
  const leftLines = toLines(left);
  const rightLines = toLines(right);

  const changes = diffArrays(leftLines, rightLines);
  const lines: DiffLine[] = [];
  let leftIdx = 0;
  let rightIdx = 0;
  const stats: DiffStats = { added: 0, removed: 0, equal: 0 };
  const diffAnchors: number[] = [];

  interface RawLine { type: 'equal' | 'added' | 'removed'; text: string; li: number | null; ri: number | null; }
  const raw: RawLine[] = [];
  for (const c of changes) {
    const type = c.added ? 'added' : c.removed ? 'removed' : 'equal';
    for (const text of c.value) {
      let li: number | null = null, ri: number | null = null;
      if (type === 'equal') { leftIdx++; rightIdx++; li = leftIdx; ri = rightIdx; }
      else if (type === 'removed') { leftIdx++; li = leftIdx; }
      else { rightIdx++; ri = rightIdx; }
      raw.push({ type, text: String(text), li, ri });
    }
  }

  let i = 0;
  let lastAnchorIdx = -2;
  while (i < raw.length) {
    const cur = raw[i];
    if (cur.type === 'removed' && i + 1 < raw.length && raw[i + 1].type === 'added') {
      // 收集连续 removed 块
      const removedBlock: RawLine[] = [];
      let j = i;
      while (j < raw.length && raw[j].type === 'removed') { removedBlock.push(raw[j]); j++; }
      const addedBlock: RawLine[] = [];
      while (j < raw.length && raw[j].type === 'added') { addedBlock.push(raw[j]); j++; }

      // 锚点：块的起始行
      if (lines.length - lastAnchorIdx > 1 || lastAnchorIdx < 0) {
        diffAnchors.push(lines.length);
        lastAnchorIdx = lines.length;
      }

      const pairs = Math.min(removedBlock.length, addedBlock.length);
      for (let k = 0; k < pairs; k++) {
        const parts = charDiff(removedBlock[k].text, addedBlock[k].text, granularity);
        lines.push({ leftIndex: removedBlock[k].li, rightIndex: null, type: 'removed', text: removedBlock[k].text, charParts: parts });
        stats.removed++;
      }
      for (let k = pairs; k < removedBlock.length; k++) {
        lines.push({ leftIndex: removedBlock[k].li, rightIndex: null, type: 'removed', text: removedBlock[k].text });
        stats.removed++;
      }
      for (let k = 0; k < addedBlock.length; k++) {
        const parts = k < pairs ? charDiff(removedBlock[k].text, addedBlock[k].text, granularity) : undefined;
        lines.push({ leftIndex: null, rightIndex: addedBlock[k].ri, type: 'added', text: addedBlock[k].text, charParts: parts });
        stats.added++;
      }
      i = j;
    } else if (cur.type === 'removed') {
      // 纯删除块（无配对 added）
      if (lines.length - lastAnchorIdx > 1 || lastAnchorIdx < 0) {
        diffAnchors.push(lines.length);
        lastAnchorIdx = lines.length;
      }
      lines.push({ leftIndex: cur.li, rightIndex: null, type: 'removed', text: cur.text });
      stats.removed++;
      i++;
    } else if (cur.type === 'added') {
      // 纯新增块（无配对 removed）
      if (lines.length - lastAnchorIdx > 1 || lastAnchorIdx < 0) {
        diffAnchors.push(lines.length);
        lastAnchorIdx = lines.length;
      }
      lines.push({ leftIndex: null, rightIndex: cur.ri, type: 'added', text: cur.text });
      stats.added++;
      i++;
    } else {
      // equal
      lines.push({ leftIndex: cur.li, rightIndex: cur.ri, type: 'equal', text: cur.text });
      stats.equal++;
      i++;
    }
  }

  return { lines, stats, diffAnchors };
}

function charDiff(removed: string, added: string, granularity: Granularity): DiffPart[] {
  const d = granularity === 'char' ? diffChars(removed, added) : diffWords(removed, added);
  // First pass: collapse consecutive same-type parts.
  const parts: DiffPart[] = [];
  for (const p of d) {
    const type: DiffPart['type'] = p.added ? 'added' : p.removed ? 'removed' : 'equal';
    const last = parts[parts.length - 1];
    if (last && last.type === type) {
      last.value += p.value;
    } else {
      parts.push({ type, value: p.value });
    }
  }
  // Second pass: when a removed+added pair and the next removed+added pair are
  // separated only by a short equal run (<=2 chars), convert the equal text into
  // BOTH removed and added parts so each side reads as a contiguous span.
  // Pattern: removed, added, equal(short), removed, added
  //   -> removed, added, removed(equal), added(equal), removed, added
  //   -> collapse -> removed(merged), added(merged)
  // This makes "wo"/"unive"/"r"/"ld"/"se" highlight "world" and "universe" as
  // whole words while keeping single-char edits like "X"/"Y" distinct.
  const out: DiffPart[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p0 = parts[i];       // removed
    const p1 = parts[i + 1];   // added
    const sep = parts[i + 2];  // equal (short)
    const p3 = parts[i + 3];   // removed
    const p4 = parts[i + 4];   // added
    if (
      p0 && p1 && sep && p3 && p4 &&
      p0.type === 'removed' && p1.type === 'added' &&
      sep.type === 'equal' && sep.value.length <= 2 &&
      p3.type === 'removed' && p4.type === 'added'
    ) {
      // Emit the equal text as both removed and added so it bridges the pairs.
      out.push({ ...p0 });
      out.push({ ...p1 });
      out.push({ type: 'removed', value: sep.value });
      out.push({ type: 'added', value: sep.value });
      i += 2; // skip sep; next iteration handles p3
    } else {
      out.push({ ...p0 });
    }
  }
  // Third pass: collapse consecutive same-type parts again.
  const collapsed: DiffPart[] = [];
  for (const p of out) {
    const last = collapsed[collapsed.length - 1];
    if (last && last.type === p.type) {
      last.value += p.value;
    } else {
      collapsed.push({ type: p.type, value: p.value });
    }
  }
  return collapsed;
}
