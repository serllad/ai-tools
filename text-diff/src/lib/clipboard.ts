import type { DiffResult } from '../types';

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function formatSummary(r: DiffResult): string {
  return r.lines.map(l => {
    if (l.type === 'added') return `+ ${l.text}`;
    if (l.type === 'removed') return `- ${l.text}`;
    return `  ${l.text}`;
  }).join('\n');
}
