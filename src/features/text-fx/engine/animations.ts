import type { AnimationState, AnimationType } from '../types';

export const baseState: AnimationState = {
  opacity: 1,
  scale: 1,
  offsetY: 0,
  perCharOffsetY: [],
  visibleCharCount: Infinity,
  colorOverride: undefined,
  translateX: 0,
  rotate: 0,
  perCharRotate: [],
  shadowGlow: undefined,
};

interface AnimConfig {
  speed: number;
  charCount: number;
  totalChars: number;
}

type AnimationFn = (t: number, cfg: AnimConfig) => AnimationState;

const animations: Record<AnimationType, AnimationFn> = {
  typewriter: (t, { speed, totalChars }) => {
    const charsPerSec = 5 * speed;
    const visible = Math.min(totalChars, Math.floor(t * charsPerSec));
    return { ...baseState, visibleCharCount: visible };
  },
  fade: (t, { speed }) => {
    const cycle = (t * speed) % 2;
    return { ...baseState, opacity: cycle < 1 ? cycle : 2 - cycle };
  },
  blink: (t, { speed }) => {
    const cycle = Math.floor(t * speed * 2) % 2;
    return { ...baseState, opacity: cycle === 0 ? 1 : 0.3 };
  },
  bounce: (t, { speed }) => {
    return { ...baseState, offsetY: Math.abs(Math.sin(t * speed * 4)) * -15 };
  },
  heartbeat: (t, { speed }) => {
    return { ...baseState, scale: 1 + Math.sin(t * speed * 5) * 0.1 };
  },
  rainbow: (t, { speed }) => {
    const hue = (t * speed * 60) % 360;
    return { ...baseState, colorOverride: `hsl(${hue}, 90%, 55%)` };
  },
  wave: (t, { speed, totalChars }) => {
    const offsets = Array.from({ length: totalChars }, (_, i) =>
      Math.sin(t * speed * 4 - i * 0.5) * 10,
    );
    return { ...baseState, perCharOffsetY: offsets };
  },
  slide: (t, { speed }) => {
    const progress = (t * speed) % 2;
    const x = progress < 1 ? (1 - progress) * -300 : (progress - 1) * 300;
    return { ...baseState, translateX: x };
  },
  rotate: (t, { speed }) => {
    const angle = (t * speed * 90) % 360;
    return { ...baseState, rotate: angle };
  },
  flip: (t, { speed, totalChars }) => {
    const rotates = Array.from({ length: totalChars }, (_, i) => {
      const phase = (t * speed * 2 - i * 0.3) % 2;
      return phase < 1 ? phase * 180 : (2 - phase) * 180;
    });
    return { ...baseState, perCharRotate: rotates };
  },
  shake: (t, { speed }) => {
    const x = Math.sin(t * speed * 30) * 8;
    const y = Math.cos(t * speed * 28) * 6;
    return { ...baseState, translateX: x, offsetY: y };
  },
  pulse: (t, { speed }) => {
    const s = 1 + Math.abs(Math.sin(t * speed * 3)) * 0.3;
    const glow = `0 0 ${Math.round(20 + Math.abs(Math.sin(t * speed * 3)) * 30)}px currentColor`;
    return { ...baseState, scale: s, shadowGlow: glow };
  },
  neon: (t, { speed }) => {
    const phase = (Math.sin(t * speed * 3) + 1) / 2;
    const hue = (t * speed * 60) % 360;
    const glow = `0 0 ${Math.round(10 + phase * 25)}px hsl(${hue}, 100%, 60%)`;
    return { ...baseState, colorOverride: `hsl(${hue}, 100%, 65%)`, shadowGlow: glow };
  },
  drop: (t, { speed, totalChars }) => {
    const offsets = Array.from({ length: totalChars }, (_, i) => {
      const delay = i * 0.15;
      const local = (t * speed - delay) % 2;
      if (local < 0) return -200;
      if (local < 0.5) {
        const p = local / 0.5;
        return -200 * (1 - p) * (1 - p);
      }
      const bounceP = (local - 0.5) / 0.5;
      return Math.abs(Math.sin(bounceP * Math.PI * 2)) * -15 * (1 - bounceP);
    });
    return { ...baseState, perCharOffsetY: offsets };
  },
};

export function getAnimationState(
  type: AnimationType,
  t: number,
  cfg: AnimConfig,
): AnimationState {
  return animations[type](t, cfg);
}
