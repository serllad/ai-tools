import { describe, it, expect, vi } from 'vitest';
import { render } from '../../src/engine/canvasRenderer';
import type { RenderInput } from '../../src/types';

function makeMockCtx() {
  const calls: string[] = [];
  let _font = '';
  const ctx: any = {
    fillText: vi.fn(() => calls.push('fillText')),
    strokeText: vi.fn(() => calls.push('strokeText')),
    fillRect: vi.fn(() => calls.push('fillRect')),
    clearRect: vi.fn(() => calls.push('clearRect')),
    drawImage: vi.fn(() => calls.push('drawImage')),
    translate: vi.fn(() => calls.push('translate')),
    scale: vi.fn(() => calls.push('scale')),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    measureText: vi.fn(() => ({ width: 50 })),
    save: vi.fn(() => calls.push('save')),
    restore: vi.fn(() => calls.push('restore')),
    set fillStyle(v: any) { calls.push('fillStyle:' + v); },
    get fillStyle() { return ''; },
    set font(v: any) { _font = v; },
    get font() { return _font; },
    set globalAlpha(v: any) { calls.push('globalAlpha:' + v); },
    get globalAlpha() { return 1; },
    set lineWidth(v: any) { calls.push('lineWidth:' + v); },
    get lineWidth() { return 1; },
    set textAlign(v: any) { calls.push('textAlign:' + v); },
    get textAlign() { return ''; },
    set textBaseline(v: any) { calls.push('textBaseline:' + v); },
    get textBaseline() { return ''; },
    set shadowBlur(v: any) { calls.push('shadowBlur:' + v); },
    get shadowBlur() { return 0; },
    set shadowOffsetX(v: any) { calls.push('shadowOffsetX:' + v); },
    get shadowOffsetX() { return 0; },
    set shadowOffsetY(v: any) { calls.push('shadowOffsetY:' + v); },
    get shadowOffsetY() { return 0; },
    set shadowColor(v: any) { calls.push('shadowColor:' + v); },
    get shadowColor() { return ''; },
  };
  return ctx;
}

function makeCanvas(ctx: any): any {
  return {
    width: 0,
    height: 0,
    getContext: () => ctx,
  };
}

describe('canvasRenderer', () => {
  const baseInput = {
    text: 'Hi',
    style: {
      fontFamily: 'system' as const,
      fontSize: 48,
      color: '#ffffff',
      bold: false,
      stroke: { enabled: false, width: 0, color: '#000' },
      shadow: { enabled: false, blur: 0, offsetX: 0, offsetY: 0, color: '#000' },
    },
    background: { type: 'solid' as const, color: '#ff0000' },
    size: { width: 500, height: 200 },
    animationState: {
      opacity: 1,
      scale: 1,
      offsetY: 0,
      perCharOffsetY: [],
      visibleCharCount: Infinity,
      translateX: 0,
    },
  };

  it('sets canvas size', () => {
    const ctx = makeMockCtx();
    const canvas = makeCanvas(ctx);
    render({ ...baseInput, canvas } as unknown as RenderInput);
    expect(canvas.width).toBe(500);
    expect(canvas.height).toBe(200);
  });

  it('draws solid background', () => {
    const ctx = makeMockCtx();
    const canvas = makeCanvas(ctx);
    render({ ...baseInput, canvas } as unknown as RenderInput);
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('sets font property', () => {
    const ctx = makeMockCtx();
    const canvas = makeCanvas(ctx);
    render({ ...baseInput, canvas } as unknown as RenderInput);
    expect(ctx.font).toContain('48px');
  });

  it('calls fillText for visible chars', () => {
    const ctx = makeMockCtx();
    const canvas = makeCanvas(ctx);
    render({ ...baseInput, canvas } as unknown as RenderInput);
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it('calls strokeText when stroke enabled', () => {
    const ctx = makeMockCtx();
    const canvas = makeCanvas(ctx);
    const input = {
      ...baseInput,
      canvas,
      style: {
        ...baseInput.style,
        stroke: { enabled: true, width: 3, color: '#000000' },
      },
    } as unknown as RenderInput;
    render(input);
    expect(ctx.strokeText).toHaveBeenCalled();
  });

  it('respects visibleCharCount from animation state', () => {
    const ctx = makeMockCtx();
    const canvas = makeCanvas(ctx);
    const input = {
      ...baseInput,
      canvas,
      animationState: { ...baseInput.animationState, visibleCharCount: 1 },
    } as unknown as RenderInput;
    render(input);
    expect(ctx.fillText).toHaveBeenCalledTimes(1);
  });

  it('skips background for transparent type', () => {
    const ctx = makeMockCtx();
    const canvas = makeCanvas(ctx);
    const input = {
      ...baseInput,
      canvas,
      background: { type: 'transparent' as const },
    } as unknown as RenderInput;
    render(input);
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  const fakeImg = { width: 200, height: 100 } as unknown as HTMLImageElement;

  it('stretch fit draws image to full canvas', () => {
    const ctx = makeMockCtx();
    const canvas = makeCanvas(ctx);
    render({
      ...baseInput,
      canvas,
      background: { type: 'image' as const, fit: 'stretch' as const },
      backgroundImage: { el: fakeImg, fit: 'stretch' as const },
    } as unknown as RenderInput);
    expect(ctx.drawImage).toHaveBeenCalledWith(fakeImg, 0, 0, 500, 200);
  });

  it('cover fit crops source region', () => {
    const ctx = makeMockCtx();
    const canvas = makeCanvas(ctx);
    render({
      ...baseInput,
      canvas,
      background: { type: 'image' as const, fit: 'cover' as const },
      backgroundImage: { el: fakeImg, fit: 'cover' as const },
    } as unknown as RenderInput);
    // scale = max(500/200, 200/100) = 2.5; sw=200, sh=80, sx=0, sy=10
    expect(ctx.drawImage).toHaveBeenCalledWith(fakeImg, 0, 10, 200, 80, 0, 0, 500, 200);
  });

  it('contain fit letterboxes centered', () => {
    const ctx = makeMockCtx();
    const canvas = makeCanvas(ctx);
    render({
      ...baseInput,
      canvas,
      background: { type: 'image' as const, fit: 'contain' as const },
      backgroundImage: { el: fakeImg, fit: 'contain' as const },
    } as unknown as RenderInput);
    // scale = min(500/200, 200/100) = 2; dw=400, dh=200, dx=50, dy=0
    expect(ctx.drawImage).toHaveBeenCalledWith(fakeImg, 50, 0, 400, 200);
  });

  it('image type without loaded image draws nothing', () => {
    const ctx = makeMockCtx();
    const canvas = makeCanvas(ctx);
    render({
      ...baseInput,
      canvas,
      background: { type: 'image' as const, fit: 'cover' as const },
    } as unknown as RenderInput);
    expect(ctx.drawImage).not.toHaveBeenCalled();
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });
});
