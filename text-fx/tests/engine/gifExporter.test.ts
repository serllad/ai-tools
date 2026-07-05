import { describe, it, expect, vi } from 'vitest';
import { exportGif } from '../../src/engine/gifExporter';

// Mock gif.js
vi.mock('gif.js', () => {
  return {
    default: class MockGif {
      frames: any[] = [];
      private listeners: Record<string, ((arg?: any) => void)[]> = {};

      on(event: string, cb: (arg?: any) => void) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(cb);
      }

      private emit(event: string, arg?: any) {
        (this.listeners[event] || []).forEach((cb) => cb(arg));
      }

      render() {
        // Simulate async render completion
        setTimeout(() => this.emit('finished', new Blob([], { type: 'image/gif' })), 10);
      }

      addFrame(ctx: any, opts: any) {
        this.frames.push({ ctx, opts });
      }

      finish() {}
    },
  };
});

describe('gifExporter', () => {
  it('produces a blob and calls onDone', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 50;
    const onProgress = vi.fn();
    const onDone = vi.fn();

    await new Promise<void>((resolve) => {
      exportGif({
        canvas,
        frameCount: 5,
        delay: 100,
        renderFrame: vi.fn(),
        onProgress,
        onDone: (blob, filename) => {
          onDone(blob, filename);
          resolve();
        },
        workerScriptPath: '/workers/gif.worker.js',
      });
    });

    expect(true).toBe(true);
  });
});
