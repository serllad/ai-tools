import type { ParseError } from '../types';

const FRIENDLY_MESSAGES: Array<{ match: RegExp; zh: string }> = [
  // V8: "Expected double-quoted property name" appears for trailing commas
  { match: /double-quoted property name/i, zh: '多余的逗号' },
  // V8: "Expected property name or '}'" appears for unquoted keys and single-quoted keys
  { match: /property name or/i, zh: '属性名缺少双引号' },
  { match: /property name/i, zh: '属性名缺少双引号' },
  // jsonrepair-specific
  { match: /single quote/i, zh: '应使用双引号而非单引号' },
  { match: /comment/i, zh: 'JSON 不支持注释' },
  // V8: "Expected ',' or ']' after array element" — unmatched bracket
  { match: /expected ',' or '\]'/i, zh: '括号不匹配' },
  { match: /unexpected end/i, zh: 'JSON 不完整' },
  { match: /unexpected token/i, zh: '出现意外的字符' },
  { match: /unexpected non-whitespace/i, zh: '出现意外的字符' },
  { match: /comma/i, zh: '多余的逗号' },
  { match: /bracket|brace/i, zh: '括号不匹配' }
];

function friendlyMessage(raw: string): string {
  for (const { match, zh } of FRIENDLY_MESSAGES) {
    if (match.test(raw)) return zh;
  }
  return raw || 'JSON 语法错误';
}

function positionToLineCol(text: string, pos: number): { line: number; col: number } {
  if (pos <= 0 || text.length === 0) return { line: 1, col: 1 };
  const safePos = Math.min(pos, text.length);
  const upto = text.slice(0, safePos);
  const lines = upto.split('\n');
  return { line: lines.length, col: lines[lines.length - 1].length + 1 };
}

export function fromSyntaxError(err: SyntaxError, input: string): ParseError {
  const msg = err.message || 'JSON 语法错误';
  const posMatch = msg.match(/position\s+(\d+)/i);
  const pos = posMatch ? parseInt(posMatch[1], 10) : 0;
  const { line, col } = positionToLineCol(input, pos);
  return { line, col, message: friendlyMessage(msg) };
}

export function fromJsonRepairError(err: { message?: string; position?: number }, input: string): ParseError {
  const raw = err.message || 'JSON 语法错误';
  const pos = typeof err.position === 'number' ? err.position : 0;
  const { line, col } = positionToLineCol(input, pos);
  return { line, col, message: friendlyMessage(raw) };
}
