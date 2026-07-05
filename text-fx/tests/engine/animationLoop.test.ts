import { describe, it, expect, vi } from 'vitest';
import { AnimationLoop } from '../../src/engine/animationLoop';

describe('AnimationLoop', () => {
  it('starts and calls render each frame', () => {
    let rafId = 0;
    const rafCallbacks: FrameRequestCallback[] = [];
    const originalRaf = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return ++rafId;
    });
    globalThis.cancelAnimationFrame = vi.fn();

    const render = vi.fn();
    const getT = vi.fn(() => 0);
    const loop = new AnimationLoop(render, getT);
    loop.start();

    rafCallbacks[0](0);
    expect(render).toHaveBeenCalled();

    loop.stop();
    globalThis.requestAnimationFrame = originalRaf;
  });

  it('stop cancels animation frame', () => {
    const cancelSpy = vi.fn();
    globalThis.requestAnimationFrame = vi.fn(() => 1);
    globalThis.cancelAnimationFrame = cancelSpy;

    const loop = new AnimationLoop(vi.fn(), () => 0);
    loop.start();
    loop.stop();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('does not run when loopCount reached (finite)', () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    globalThis.cancelAnimationFrame = vi.fn();

    const render = vi.fn();
    const getT = vi.fn(() => 5);
    const loop = new AnimationLoop(render, getT, { loopCount: 1, cycleDuration: 2 });
    loop.start();
    rafCallbacks[0](0);
    expect(render).not.toHaveBeenCalled();
  });
});
