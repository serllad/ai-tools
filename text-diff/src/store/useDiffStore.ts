import { create } from 'zustand';
import type { CompareStatus, DiffResult, Granularity, Theme, ViewMode } from '../types';
import { computeDiff } from '../lib/diffEngine';
import { nextAnchor, prevAnchor, canNext, canPrev } from '../lib/navigation';
import type { LanguageId } from '../lib/languageDetect';

interface DiffState {
  left: string;
  right: string;
  result: DiffResult | null;
  status: CompareStatus;
  viewMode: ViewMode;
  granularity: Granularity;
  theme: Theme;
  currentAnchor: number;
  autoCompare: boolean;
  confirmClear: boolean;
  languageOverride: LanguageId | null;
  lastError: string | null;

  setLeft: (v: string) => void;
  setRight: (v: string) => void;
  swap: () => void;
  clear: () => void;
  compare: () => void;
  setViewMode: (m: ViewMode) => void;
  setGranularity: (g: Granularity) => void;
  setTheme: (t: Theme) => void;
  setAutoCompare: (b: boolean) => void;
  setConfirmClear: (b: boolean) => void;
  setLanguageOverride: (l: LanguageId | null) => void;
  nextDiff: () => void;
  prevDiff: () => void;
  setLastError: (e: string | null) => void;
}

export const useDiffStore = create<DiffState>((set, get) => ({
  left: '',
  right: '',
  result: null,
  status: 'idle',
  viewMode: 'split',
  granularity: 'char',
  theme: 'system',
  currentAnchor: -1,
  autoCompare: true,
  confirmClear: true,
  languageOverride: null,
  lastError: null,

  setLeft: (v) => set({ left: v }),
  setRight: (v) => set({ right: v }),
  swap: () => {
    const { left, right, autoCompare } = get();
    set({ left: right, right: left });
    // 自动对比开启时让 useAutoCompare 防抖触发；否则立即对比
    if (!autoCompare) get().compare();
  },
  clear: () => set({ left: '', right: '', result: null, status: 'idle', currentAnchor: -1, lastError: null }),
  compare: () => {
    const { left, right, granularity } = get();
    if (!left || !right) {
      set({ result: null, status: 'idle', currentAnchor: -1 });
      return;
    }
    set({ status: 'comparing' });
    const result = computeDiff(left, right, granularity);
    set({ result, status: 'done', currentAnchor: result.diffAnchors.length > 0 ? 0 : -1 });
  },
  setViewMode: (m) => set({ viewMode: m }),
  setGranularity: (g) => {
    set({ granularity: g });
    if (get().result) get().compare();
  },
  setTheme: (t) => set({ theme: t }),
  setAutoCompare: (b) => set({ autoCompare: b }),
  setConfirmClear: (b) => set({ confirmClear: b }),
  setLanguageOverride: (l) => set({ languageOverride: l }),
  nextDiff: () => {
    const { result, currentAnchor } = get();
    if (!result) return;
    if (!canNext(result.diffAnchors, currentAnchor)) return;
    set({ currentAnchor: nextAnchor(result.diffAnchors, currentAnchor) });
  },
  prevDiff: () => {
    const { result, currentAnchor } = get();
    if (!result) return;
    if (!canPrev(result.diffAnchors, currentAnchor)) return;
    set({ currentAnchor: prevAnchor(result.diffAnchors, currentAnchor) });
  },
  setLastError: (e) => set({ lastError: e }),
}));
