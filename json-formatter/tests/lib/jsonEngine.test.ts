import { describe, it, expect } from 'vitest';
import { format, compress, validate } from '../../src/lib/jsonEngine';

describe('jsonEngine.format', () => {
  it('formats flat JSON with 2-space indent', () => {
    const result = format('{"name":"test","age":1}');
    expect(result).toBe('{\n  "name": "test",\n  "age": 1\n}');
  });

  it('preserves key order', () => {
    const result = format('{"b":1,"a":2}');
    expect(result).toBe('{\n  "b": 1,\n  "a": 2\n}');
  });

  it('preserves unicode without escaping', () => {
    const result = format('{"name":"中文"}');
    expect(result).toContain('中文');
    expect(result).not.toContain('\\u');
  });

  it('handles nested objects deeper than 10 levels', () => {
    let input = '1';
    for (let i = 0; i < 12; i++) input = `{"a":${input}}`;
    const result = format(input);
    const lines = result.split('\n');
    expect(lines.length).toBeGreaterThan(20);
    expect(() => JSON.parse(result)).not.toThrow();
  });
});

describe('jsonEngine.compress', () => {
  it('removes all whitespace outside strings', () => {
    const result = compress('{\n  "a": 1,\n  "b": 2\n}');
    expect(result).toBe('{"a":1,"b":2}');
  });

  it('preserves spaces inside string values', () => {
    const result = compress('{"msg": "hello world"}');
    expect(result).toBe('{"msg":"hello world"}');
  });
});

describe('jsonEngine.validate', () => {
  it('returns ok=true for valid JSON', () => {
    const r = validate('{"a":1}');
    expect(r.ok).toBe(true);
    expect(r.error).toBeNull();
  });

  it('detects missing quotes on key', () => {
    const r = validate('{name:1}');
    expect(r.ok).toBe(false);
    expect(r.error?.line).toBe(1);
    expect(r.error?.message).toContain('属性名');
  });

  it('detects trailing comma', () => {
    const r = validate('{"a":1,}');
    expect(r.ok).toBe(false);
    expect(r.error?.message).toContain('逗号');
  });

  it('detects unmatched bracket', () => {
    const r = validate('{"a":[1,2}');
    expect(r.ok).toBe(false);
    expect(r.error?.message).toContain('括号');
  });

  it('detects single quotes', () => {
    const r = validate("{'a':1}");
    expect(r.ok).toBe(false);
    expect(r.error?.message).toContain('双引号');
  });

  it('returns ok for empty input (idle state)', () => {
    const r = validate('');
    expect(r.ok).toBe(true);
    expect(r.error).toBeNull();
  });
});

describe('jsonEngine performance', () => {
  it('formats 100KB input under 50ms', () => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < 5000; i++) obj[`key_${i}`] = `value_${i}`;
    const input = JSON.stringify(obj);
    expect(input.length).toBeGreaterThan(100_000);
    const start = performance.now();
    format(input);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it('formats 1MB input under 300ms', () => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < 50000; i++) obj[`key_${i}`] = `value_${i}`;
    const input = JSON.stringify(obj);
    expect(input.length).toBeGreaterThan(1_000_000);
    const start = performance.now();
    format(input);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(300);
  });
});
