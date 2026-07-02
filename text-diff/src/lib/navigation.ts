export function nextAnchor(anchors: number[], current: number): number {
  if (anchors.length === 0) return -1;
  if (current < 0) return 0;
  return Math.min(current + 1, anchors.length - 1);
}

export function prevAnchor(anchors: number[], current: number): number {
  if (anchors.length === 0) return -1;
  if (current < 0) return 0;
  return Math.max(current - 1, 0);
}

export function canNext(anchors: number[], current: number): boolean {
  if (anchors.length === 0) return false;
  return current < 0 || current < anchors.length - 1;
}

export function canPrev(anchors: number[], current: number): boolean {
  if (anchors.length === 0) return false;
  return current > 0;
}
