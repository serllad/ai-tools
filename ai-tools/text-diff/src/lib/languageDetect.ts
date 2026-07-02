// src/lib/languageDetect.ts
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { python } from '@codemirror/lang-python';
import { markdown } from '@codemirror/lang-markdown';
import { yaml } from '@codemirror/lang-yaml';
import { sql } from '@codemirror/lang-sql';
import type { Extension } from '@codemirror/state';

export type LanguageId = 'json' | 'xml' | 'html' | 'javascript' | 'css' | 'python' | 'markdown' | 'yaml' | 'sql' | 'text';

const ALL_LANGS: LanguageId[] = ['json','xml','html','javascript','css','python','markdown','yaml','sql','text'];

export function detectLanguage(text: string): LanguageId {
  const t = text.trim();
  if (!t) return 'text';
  if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
    try { JSON.parse(t); return 'json'; } catch { /* fallthrough */ }
  }
  if (t.startsWith('<?xml')) return 'xml';
  if (t.startsWith('<!DOCTYPE html') || t.startsWith('<html')) return 'html';
  if (/^<[\w.-]+[^>]*>/.test(t) && t.endsWith('>')) return 'xml';
  if (/^\s*(def|class|import|from)\s/.test(t)) return 'python';
  if (/^#{1,6}\s/.test(t) || /^\*\s/.test(t)) return 'markdown';
  if (/^\s*[\w-]+:\s/.test(t) && !t.includes('{')) return 'yaml';
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\s/i.test(t)) return 'sql';
  if (/[\w-]+\s*\{[^}]*:/.test(t)) return 'css';
  if (/\b(function|const|let|var|=>)\b/.test(t)) return 'javascript';
  return 'text';
}

export function parseLanguageOverride(v: string | null): LanguageId | null {
  if (!v) return null;
  return (ALL_LANGS as string[]).includes(v) ? (v as LanguageId) : null;
}

export function getLanguageExtension(override: string | null, sampleText: string): Extension[] {
  const lang = override ? (parseLanguageOverride(override) ?? detectLanguage(sampleText)) : detectLanguage(sampleText);
  switch (lang) {
    case 'json': return [json()];
    case 'xml': return [xml()];
    case 'html': return [html()];
    case 'javascript': return [javascript()];
    case 'css': return [css()];
    case 'python': return [python()];
    case 'markdown': return [markdown()];
    case 'yaml': return [yaml()];
    case 'sql': return [sql()];
    default: return [];
  }
}
