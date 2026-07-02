import { describe, it, expect } from 'vitest';
import { detectLanguage, parseLanguageOverride } from '../../src/lib/languageDetect';

describe('languageDetect', () => {
  it('JSON 对象 → json', () => {
    expect(detectLanguage('{"a":1,"b":2}')).toBe('json');
  });
  it('JSON 数组 → json', () => {
    expect(detectLanguage('[1,2,3]')).toBe('json');
  });
  it('XML → xml', () => {
    expect(detectLanguage('<?xml version="1.0"?><root></root>')).toBe('xml');
  });
  it('HTML → html', () => {
    expect(detectLanguage('<!DOCTYPE html><html><body></body></html>')).toBe('html');
  });
  it('Python def → python', () => {
    expect(detectLanguage('def foo():\n    return 1')).toBe('python');
  });
  it('普通文本 → text', () => {
    expect(detectLanguage('hello world')).toBe('text');
  });
  it('空 → text', () => {
    expect(detectLanguage('')).toBe('text');
  });
  it('parseLanguageOverride → 合法值原样返回', () => {
    expect(parseLanguageOverride('json')).toBe('json');
    expect(parseLanguageOverride('text')).toBe('text');
  });
  it('parseLanguageOverride → null/非法值返回 null', () => {
    expect(parseLanguageOverride(null)).toBe(null);
    expect(parseLanguageOverride('unknown')).toBe(null);
  });
});
