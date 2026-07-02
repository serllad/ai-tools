import { describe, it, expect } from 'vitest';
import { computeStats, computeCompressInfo, formatBytes } from '../../src/lib/stats';

describe('stats', () => {
  describe('computeStats', () => {
    it('counts chars, lines, bytes for ASCII', () => {
      const s = computeStats('{"a":1}\n{"b":2}');
      expect(s.chars).toBe(15);
      expect(s.lines).toBe(2);
      expect(s.sizeBytes).toBe(15);
    });

    it('counts bytes correctly for multibyte UTF-8', () => {
      const s = computeStats('中文');
      expect(s.chars).toBe(2);
      expect(s.lines).toBe(1);
      expect(s.sizeBytes).toBe(6);
    });

    it('returns zeros for empty string', () => {
      const s = computeStats('');
      expect(s).toEqual({ chars: 0, lines: 0, sizeBytes: 0 });
    });
  });

  describe('computeCompressInfo', () => {
    it('computes ratio and saved bytes', () => {
      const info = computeCompressInfo(100, 30);
      expect(info).not.toBeNull();
      expect(info!.ratio).toBeCloseTo(0.3, 2);
      expect(info!.savedBytes).toBe(70);
    });

    it('returns null when input size is 0', () => {
      expect(computeCompressInfo(0, 0)).toBeNull();
    });
  });

  describe('formatBytes', () => {
    it('formats bytes', () => {
      expect(formatBytes(500)).toBe('500 B');
    });
    it('formats KB', () => {
      expect(formatBytes(2048)).toBe('2.0 KB');
    });
    it('formats MB', () => {
      expect(formatBytes(1048576)).toBe('1.0 MB');
    });
  });
});
