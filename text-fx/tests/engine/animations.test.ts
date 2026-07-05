import { describe, it, expect } from 'vitest';
import { getAnimationState, baseState } from '../../src/engine/animations';

describe('animations', () => {
  const cfg = { speed: 1, charCount: 5, totalChars: 5 };

  it('baseState has sensible defaults', () => {
    expect(baseState.opacity).toBe(1);
    expect(baseState.scale).toBe(1);
    expect(baseState.offsetY).toBe(0);
    expect(baseState.visibleCharCount).toBe(Infinity);
    expect(baseState.translateX).toBe(0);
    expect(baseState.perCharOffsetY).toEqual([]);
  });

  it('typewriter reveals chars over time', () => {
    const s0 = getAnimationState('typewriter', 0, cfg);
    expect(s0.visibleCharCount).toBe(0);
    const s1 = getAnimationState('typewriter', 1, cfg);
    expect(s1.visibleCharCount).toBe(5);
  });

  it('fade oscillates opacity 0->1->0', () => {
    expect(getAnimationState('fade', 0, cfg).opacity).toBeCloseTo(0);
    expect(getAnimationState('fade', 1, cfg).opacity).toBeCloseTo(1);
    expect(getAnimationState('fade', 2, cfg).opacity).toBeCloseTo(0);
  });

  it('blink toggles between 1 and 0.3', () => {
    expect(getAnimationState('blink', 0, cfg).opacity).toBe(1);
    expect(getAnimationState('blink', 0.5, cfg).opacity).toBe(0.3);
  });

  it('bounce produces negative offsetY (upward)', () => {
    const s = getAnimationState('bounce', 0.5, cfg);
    expect(s.offsetY).toBeLessThanOrEqual(0);
  });

  it('heartbeat scales around 1', () => {
    const s = getAnimationState('heartbeat', 0, cfg);
    expect(s.scale).toBeCloseTo(1);
  });

  it('rainbow produces hsl color', () => {
    const s = getAnimationState('rainbow', 0, cfg);
    expect(s.colorOverride).toMatch(/^hsl\(/);
  });

  it('wave produces per-char offsets', () => {
    const s = getAnimationState('wave', 0, cfg);
    expect(s.perCharOffsetY).toHaveLength(5);
  });

  it('slide moves translateX', () => {
    const s0 = getAnimationState('slide', 0, cfg);
    expect(s0.translateX).toBe(-300);
  });
});
