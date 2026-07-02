// src/types.ts

export type ViewMode = 'split' | 'inline';
export type Granularity = 'char' | 'word';
export type Theme = 'light' | 'dark' | 'system';
export type Side = 'left' | 'right';
export type CompareStatus = 'idle' | 'comparing' | 'done' | 'error';

export interface DiffPart {
  type: 'equal' | 'added' | 'removed';
  value: string;
}

export interface DiffLine {
  leftIndex: number | null;
  rightIndex: number | null;
  type: 'equal' | 'added' | 'removed';
  text: string;
  charParts?: DiffPart[];
}

export interface DiffStats {
  added: number;
  removed: number;
  equal: number;
}

export interface DiffResult {
  lines: DiffLine[];
  stats: DiffStats;
  diffAnchors: number[];
}

export interface CopyTarget {
  kind: 'left' | 'right' | 'summary';
}
