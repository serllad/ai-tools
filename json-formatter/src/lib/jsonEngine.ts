import { jsonrepair } from 'jsonrepair';
import { fromSyntaxError, fromJsonRepairError } from './parseError';
import type { ParseError } from '../types';

export type ValidateResult =
  | { ok: true; error: null }
  | { ok: false; error: ParseError };

export function format(input: string): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed, null, 2);
}

export function compress(input: string): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed);
}

export function validate(input: string): ValidateResult {
  if (input.length === 0) return { ok: true, error: null };
  try {
    JSON.parse(input);
    return { ok: true, error: null };
  } catch (e) {
    const syntaxErr = e as SyntaxError;
    // Try jsonrepair for friendlier error localization
    try {
      jsonrepair(input);
      // jsonrepair succeeded where JSON.parse failed — surface the original SyntaxError
      return { ok: false, error: fromSyntaxError(syntaxErr, input) };
    } catch (repairErr) {
      const errObj = repairErr as { message?: string; position?: number };
      return { ok: false, error: fromJsonRepairError(errObj, input) };
    }
  }
}

/**
 * 去转义/解包：处理被字符串包裹的 JSON。
 * 输入如 "\"{\\\"a\\\":1}\"" → 返回 "{\"a\":1}"（外层字符串 parse 一次）。
 * 若外层不是合法 JSON 字符串或非字符串类型，原样返回交由上层 validate 接管。
 */
export function unwrap(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) return input;
  try {
    const inner = JSON.parse(trimmed);
    if (typeof inner === 'string') return inner;
    return input;
  } catch {
    return input;
  }
}

/**
 * Unicode 解码：把 \uXXXX 转义序列解码成实际字符。
 * 直接对原始文本做替换，不依赖 JSON 解析（这样即使外层非合法 JSON 也能解码）。
 * 支持代理对（emoji 等 \ud83d\ude00 → 😀），避免产生孤立代理被 JSON.stringify 重新转义。
 */
export function decodeUnicode(input: string): string {
  // 先消费成对的代理（high \ud800-\udbff + low \udc00-\udfff），再处理单独的 \uXXXX
  return input.replace(/\\u(d[89ab][0-9a-fA-F]{2})\\u(d[cdef][0-9a-fA-F]{2})|\\u([0-9a-fA-F]{4})/gi, (_m, hi, lo, single) => {
    if (hi !== undefined && lo !== undefined) {
      const high = parseInt(hi, 16);
      const low = parseInt(lo, 16);
      return String.fromCodePoint((high - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000);
    }
    return String.fromCodePoint(parseInt(single, 16));
  });
}

/**
 * URL 解码：解码 JSON 字符串值里的 %XX 百分号编码。
 * 思路：parse 成对象 → 递归遍历 → 字符串值做 decodeURIComponent → 重新 stringify。
 * parse 失败则原样返回，交由上层 validate 接管。
 */
export function decodeUrls(input: string): string {
  try {
    const parsed = JSON.parse(input);
    const decoded = decodeUrlInValue(parsed);
    return JSON.stringify(decoded, null, 2);
  } catch {
    return input;
  }
}

function decodeUrlInValue(value: unknown): unknown {
  if (typeof value === 'string') {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) {
    return value.map(decodeUrlInValue);
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = decodeUrlInValue(v);
    }
    return result;
  }
  return value;
}
