import { create } from 'zustand';
import { format as formatJson, compress as compressJson, validate, unwrap as unwrapJson, decodeUnicode as decodeUnicodeJson, decodeUrls as decodeUrlsJson } from '../lib/jsonEngine';
import { computeStats, computeCompressInfo } from '../lib/stats';
import { copyText } from '../lib/clipboard';
import { loadHistory, saveHistory, addHistoryItem, makeSummary } from '../lib/history';
import type { JsonStatus, ParseError, Stats, CompressInfo, HistoryItem, Theme } from '../types';

interface JsonState {
  input: string;
  output: string;
  status: JsonStatus;
  error: ParseError | null;
  lastError: string | null;

  stats: Stats;
  compressInfo: CompressInfo | null;

  history: HistoryItem[];

  autoFormat: boolean;
  confirmClear: boolean;
  theme: Theme;

  setInput(v: string): void;
  format(opts?: { skipHistory?: boolean }): void;
  compress(): void;
  unwrap(): void;
  decodeUnicode(): void;
  decodeUrls(): void;
  clear(): void;
  copy(): Promise<boolean>;
  loadHistory(item: HistoryItem): void;
  removeHistory(id: string): void;
  clearHistory(): void;
  setAutoFormat(on: boolean): void;
  setConfirmClear(on: boolean): void;
  setTheme(t: Theme): void;
  setLastError(msg: string | null): void;
}

function makeId(content: string): string {
  let h = 0;
  for (let i = 0; i < content.length; i++) {
    h = (h * 31 + content.charCodeAt(i)) | 0;
  }
  return `h_${h}_${content.length}`;
}

function persistSetting(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

export const useJsonStore = create<JsonState>((set, get) => ({
  input: '',
  output: '',
  status: 'idle',
  error: null,
  lastError: null,

  stats: { chars: 0, lines: 0, sizeBytes: 0 },
  compressInfo: null,

  history: loadHistory(),

  autoFormat: (() => { try { return localStorage.getItem('json-formatter:autoFormat') === 'true'; } catch { return false; } })(),
  confirmClear: (() => { try { return localStorage.getItem('json-formatter:confirmClear') !== 'false'; } catch { return true; } })(),
  theme: (() => { try { return (localStorage.getItem('json-formatter:theme') as Theme) || 'system'; } catch { return 'system'; } })(),

  setInput(v) {
    const stats = computeStats(v);
    if (v.length === 0) {
      set({ input: v, stats, status: 'idle', error: null });
      return;
    }
    const r = validate(v);
    set({ input: v, stats, status: r.ok ? 'valid' : 'invalid', error: r.error });
  },

  format(opts?: { skipHistory?: boolean }) {
    const { input, status } = get();
    if (status === 'invalid' || (status !== 'valid' && validate(input).ok === false)) {
      const r = validate(input);
      set({ lastError: r.error ? `请先修复第 ${r.error.line} 行的错误再格式化` : '请先修复错误再格式化' });
      return;
    }
    try {
      const output = formatJson(input);
      const compressInfo = computeCompressInfo(get().stats.sizeBytes, new Blob([output]).size);
      if (opts?.skipHistory) {
        set({ output, compressInfo, lastError: null });
      } else {
        const item: HistoryItem = {
          id: makeId(input),
          summary: makeSummary(input),
          content: input,
          sizeBytes: get().stats.sizeBytes,
          createdAt: Date.now()
        };
        const history = addHistoryItem(get().history, item);
        saveHistory(history);
        set({ output, compressInfo, history, lastError: null });
      }
    } catch {
      set({ lastError: '格式化失败' });
    }
  },

  compress() {
    const { input } = get();
    try {
      const output = compressJson(input);
      const compressInfo = computeCompressInfo(get().stats.sizeBytes, new Blob([output]).size);
      set({ output, compressInfo, lastError: null });
    } catch {
      const r = validate(input);
      set({ lastError: r.error ? `请先修复第 ${r.error.line} 行的错误再压缩` : '压缩失败' });
    }
  },

  unwrap() {
    const { input } = get();
    const unwrapped = unwrapJson(input);
    get().setInput(unwrapped);
    get().format();
  },

  decodeUnicode() {
    const { input } = get();
    const decoded = decodeUnicodeJson(input);
    get().setInput(decoded);
    get().format();
  },

  decodeUrls() {
    const { input } = get();
    const decoded = decodeUrlsJson(input);
    // decodeUrls 已返回格式化后的 JSON 字符串
    const compressInfo = computeCompressInfo(get().stats.sizeBytes, new Blob([decoded]).size);
    set({ output: decoded, compressInfo, lastError: null });
  },

  clear() {
    set({ input: '', output: '', status: 'idle', error: null, lastError: null, compressInfo: null, stats: { chars: 0, lines: 0, sizeBytes: 0 } });
  },

  async copy(): Promise<boolean> {
    const { output } = get();
    if (!output) return false;
    const ok = await copyText(output);
    if (!ok) set({ lastError: '复制失败，请手动选择文本' });
    return ok;
  },

  loadHistory(item) {
    get().setInput(item.content);
    // 恢复历史时不重复入栈（spec: 用户主动恢复的历史项不重复入栈）
    get().format({ skipHistory: true });
  },

  removeHistory(id) {
    const history = get().history.filter(i => i.id !== id);
    saveHistory(history);
    set({ history });
  },

  clearHistory() {
    saveHistory([]);
    set({ history: [] });
  },

  setAutoFormat(on) {
    persistSetting('json-formatter:autoFormat', String(on));
    set({ autoFormat: on });
  },

  setConfirmClear(on) {
    persistSetting('json-formatter:confirmClear', String(on));
    set({ confirmClear: on });
  },

  setTheme(t) {
    persistSetting('json-formatter:theme', t);
    set({ theme: t });
  },

  setLastError(msg) {
    set({ lastError: msg });
  }
}));
