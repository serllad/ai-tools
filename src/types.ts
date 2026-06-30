export type JsonStatus = 'idle' | 'valid' | 'invalid' | 'processing';

export interface ParseError {
  line: number;
  col: number;
  message: string;
}

export interface Stats {
  chars: number;
  lines: number;
  sizeBytes: number;
}

export interface CompressInfo {
  ratio: number;
  savedBytes: number;
}

export interface HistoryItem {
  id: string;          // content hash
  summary: string;     // first 200 chars
  content: string;     // full JSON
  sizeBytes: number;
  createdAt: number;
}

export type Theme = 'light' | 'dark' | 'system';
