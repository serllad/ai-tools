import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useConfigStore, PRESETS } from '../../src/store/configStore';

describe('configStore', () => {
  beforeEach(() => {
    useConfigStore.getState().reset();
  });

  it('has default state', () => {
    const s = useConfigStore.getState();
    expect(s.mode).toBe('gif');
    expect(s.animation).toBe('typewriter');
    expect(s.fontSize).toBe(48);
  });

  it('setText updates text', () => {
    useConfigStore.getState().setText('hello');
    expect(useConfigStore.getState().text).toBe('hello');
  });

  it('setMode updates mode', () => {
    useConfigStore.getState().setMode('png');
    expect(useConfigStore.getState().mode).toBe('png');
  });

  it('setAnimation updates animation', () => {
    useConfigStore.getState().setAnimation('blink');
    expect(useConfigStore.getState().animation).toBe('blink');
  });

  it('setBackground updates background', () => {
    useConfigStore.getState().setBackground({ type: 'transparent' });
    expect(useConfigStore.getState().background.type).toBe('transparent');
  });

  it('applyPreset overrides fields', () => {
    useConfigStore.getState().applyPreset(PRESETS[0]);
    const s = useConfigStore.getState();
    expect(s.animation).toBe(PRESETS[0].config.animation);
  });

  it('reset returns to defaults', () => {
    useConfigStore.getState().setText('changed');
    useConfigStore.getState().reset();
    expect(useConfigStore.getState().text).toBe('');
  });

  it('PRESETS has 6 entries', () => {
    expect(PRESETS).toHaveLength(6);
  });

  describe('background image', () => {
    beforeEach(() => {
      vi.stubGlobal('URL', {
        createObjectURL: () => 'blob:mock',
        revokeObjectURL: vi.fn(),
      });
      // Image whose onload fires as soon as src is set.
      class MockImage {
        onload: (() => void) | null = null;
        width = 200;
        height = 100;
        set src(_v: string) {
          this.onload?.();
        }
      }
      vi.stubGlobal('Image', MockImage);
    });

    it('setBgImage loads image and switches background to image', () => {
      const file = new File(['x'], 'a.png', { type: 'image/png' });
      useConfigStore.getState().setBgImage(file);
      const s = useConfigStore.getState();
      expect(s.background.type).toBe('image');
      expect(s.bgImage).not.toBeNull();
      expect(s.bgImageUrl).toBe('blob:mock');
    });

    it('setBgImageFit updates fit only when background is image', () => {
      const file = new File(['x'], 'a.png', { type: 'image/png' });
      useConfigStore.getState().setBgImage(file);
      useConfigStore.getState().setBgImageFit('contain');
      const bg = useConfigStore.getState().background;
      expect(bg.type === 'image' && bg.fit).toBe('contain');
    });

    it('setBgImageFit is ignored when background is not image', () => {
      useConfigStore.getState().setBackground({ type: 'transparent' });
      useConfigStore.getState().setBgImageFit('stretch');
      expect(useConfigStore.getState().background.type).toBe('transparent');
    });

    it('clearBgImage clears image and reverts background to default', () => {
      const file = new File(['x'], 'a.png', { type: 'image/png' });
      useConfigStore.getState().setBgImage(file);
      useConfigStore.getState().clearBgImage();
      const s = useConfigStore.getState();
      expect(s.bgImage).toBeNull();
      expect(s.bgImageUrl).toBeNull();
      expect(s.background.type).toBe('solid');
    });
  });
});
