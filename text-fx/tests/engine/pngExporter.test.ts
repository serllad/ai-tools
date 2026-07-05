import { describe, it, expect, vi } from 'vitest';
import { exportPng } from '../../src/engine/pngExporter';

describe('pngExporter', () => {
  it('calls canvas.toBlob with image/png', () => {
    const toBlob = vi.fn((cb: BlobCallback) => {
      cb(new Blob(['x'], { type: 'image/png' }));
    });
    const canvas = { toBlob } as unknown as HTMLCanvasElement;
    const cb = vi.fn();
    exportPng(canvas, cb);
    expect(toBlob).toHaveBeenCalled();
    expect(cb).toHaveBeenCalled();
  });

  it('filename has .png extension and timestamp', () => {
    const toBlob = vi.fn((cb: BlobCallback) => {
      cb(new Blob(['x'], { type: 'image/png' }));
    });
    const canvas = { toBlob } as unknown as HTMLCanvasElement;
    const cb = vi.fn();
    exportPng(canvas, cb);
    expect(cb).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.stringMatching(/^textfx_\d+\.png$/),
    );
  });
});
