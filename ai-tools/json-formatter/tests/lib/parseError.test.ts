import { describe, it, expect } from 'vitest';
import { fromSyntaxError, fromJsonRepairError } from '../../src/lib/parseError';

describe('parseError', () => {
  describe('fromSyntaxError', () => {
    it('extracts line/col from "position X" SyntaxError', () => {
      const input = '{\n  "a": 1\n  "b": 2\n}';
      let err: SyntaxError | null = null;
      try { JSON.parse(input); } catch (e) { err = e as SyntaxError; }
      const result = fromSyntaxError(err!, input);
      expect(result.line).toBeGreaterThan(0);
      expect(result.col).toBeGreaterThan(0);
      expect(result.message).toBeTruthy();
    });

    it('returns line 1 col 1 for empty input error', () => {
      const err = new SyntaxError('Unexpected end of JSON input');
      const result = fromSyntaxError(err, '');
      expect(result.line).toBe(1);
      expect(result.col).toBe(1);
    });
  });

  describe('fromJsonRepairError', () => {
    it('maps jsonrepair error with position to {line, col, message}', () => {
      const input = "{name:1}";
      const errLike = { message: 'Property name expected', position: 1 };
      const result = fromJsonRepairError(errLike, input);
      expect(result.line).toBe(1);
      expect(result.col).toBe(2);
      expect(result.message).toContain('属性名');
    });

    it('handles missing position gracefully', () => {
      const errLike = { message: 'Unexpected token' };
      const result = fromJsonRepairError(errLike, 'invalid');
      expect(result.line).toBe(1);
      expect(result.col).toBe(1);
      expect(result.message).toBeTruthy();
    });
  });
});
